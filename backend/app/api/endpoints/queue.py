from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks
from typing import Optional, List
from app.models.token import TokenCreate, TokenModel
from app.core.database import get_db
from app.core.config import settings
from app.services.websocket import manager
from app.services.sms import sms_service
from app.services.telegram import telegram_service
from bson import ObjectId
import json
import asyncio
from datetime import datetime

router = APIRouter()

# ─── HELPER: Recalculate all positions and estimated times for a restaurant ───
async def recalculate_queue(restaurant_id: str):
    """Recalculate positions and estimated wait times for all waiting tokens"""
    db = get_db()
    
    # Get all tables
    tables_cursor = await db["tables"].find({"restaurant_id": restaurant_id}).to_list(1000)
    if not tables_cursor:
        return []
        
    # Get all active tokens
    tokens = await db["tokens"].find(
        {"restaurant_id": restaurant_id, "status": {"$in": ["waiting", "called", "delayed", "dining"]}}
    ).sort([("status", -1), ("position", 1)]).to_list(1000)
    
    # Initialize table availability times (in minutes from now)
    tables_avail = {str(t["_id"]): 0 for t in tables_cursor}
    table_seats = {str(t["_id"]): t["seats"] for t in tables_cursor}
    
    now = datetime.utcnow()
    avg_time = settings.AVG_DINING_TIME_MINS
    
    for t in tables_cursor:
        if t["status"] == "cleaning":
            tables_avail[str(t["_id"])] = 5
    
    # Update availability for dining tokens
    dining_tokens = [tk for tk in tokens if tk["status"] == "dining"]
    for dt in dining_tokens:
        if dt.get("dining_at") and dt.get("assigned_table_id"):
            elapsed_mins = max(0, (now - dt["dining_at"]).total_seconds() / 60)
            rem = max(0, avg_time - elapsed_mins)
            t_ids = [t_id.strip() for t_id in str(dt["assigned_table_id"]).split(",") if t_id.strip()]
            for t_id in t_ids:
                if t_id in tables_avail:
                    tables_avail[t_id] = rem

    waiting_tokens = [tk for tk in tokens if tk["status"] in ["waiting", "called", "delayed"]]
    waiting_tokens.sort(key=lambda x: x["position"] if x.get("position") else 999999)
    
    updated_tokens = []
    
    for idx, tk in enumerate(waiting_tokens):
        new_position = idx + 1
        group_size = tk["group_size"]
        
        # Sort current availability events
        avail_events = sorted(list(set(tables_avail.values())))
        
        best_time = 0
        allocated_tids = []
        
        def find_combo(time_t):
            avail_tids = [tid for tid, avail in tables_avail.items() if avail <= time_t]
            if not avail_tids:
                return None
            avail_tables = [{"id": tid, "seats": table_seats[tid]} for tid in avail_tids]
            avail_tables.sort(key=lambda x: x["seats"])
            
            # Single fit
            for t in avail_tables:
                if t["seats"] >= group_size:
                    return [t["id"]]
            
            # Combination fit (greedy knapsack-like)
            best_c = [None]
            def search(idx_s, current_combo, current_seats):
                if current_seats >= group_size:
                    if best_c[0] is None:
                        best_c[0] = list(current_combo)
                    else:
                        best_seats = sum(t["seats"] for t in best_c[0])
                        if current_seats < best_seats:
                            best_c[0] = list(current_combo)
                        elif current_seats == best_seats and len(current_combo) < len(best_c[0]):
                            best_c[0] = list(current_combo)
                    return
                if idx_s >= len(avail_tables):
                    return
                current_combo.append(avail_tables[idx_s])
                search(idx_s + 1, current_combo, current_seats + avail_tables[idx_s]["seats"])
                current_combo.pop()
                if best_c[0] is None:
                    search(idx_s + 1, current_combo, current_seats)
            
            search(0, [], 0)
            if best_c[0]:
                return [t["id"] for t in best_c[0]]
            return None

        if not avail_events:
            # No tables defined for restaurant?
            best_time = 0
            allocated_tids = []
        else:
            for t_time in avail_events:
                combo = find_combo(t_time)
                if combo:
                    best_time = t_time
                    allocated_tids = combo
                    break
                    
            if not allocated_tids:
                # Fallback if group size is larger than entire restaurant
                best_time = avail_events[-1] + avg_time
                if tables_avail:
                    allocated_tids = list(tables_avail.keys())[:1] # Just assign some table to block it
            
        estimated_mins = int(best_time)
        
        # Book these tables for this turn
        for tid in allocated_tids:
            tables_avail[tid] = best_time + avg_time
            
        await db["tokens"].update_one(
            {"_id": tk["_id"]},
            {"$set": {"position": new_position, "estimated_time_mins": estimated_mins}}
        )
        tk["position"] = new_position
        tk["estimated_time_mins"] = estimated_mins
        updated_tokens.append(tk)
    
    return updated_tokens

# ─── HELPER: Get current serving info ───
async def get_serving_info(restaurant_id: str):
    """Get all current serving tokens and next tokens"""
    db = get_db()
    current_tokens = await db["tokens"].find(
        {"restaurant_id": restaurant_id, "status": {"$in": ["called", "dining"]}}
    ).sort("position", 1).to_list(10)
    
    next_tokens = await db["tokens"].find(
        {"restaurant_id": restaurant_id, "status": "waiting"}
    ).sort("position", 1).limit(5).to_list(5)
    
    for t in next_tokens:
        t["_id"] = str(t["_id"])
    for t in current_tokens:
        t["_id"] = str(t["_id"])
    
    return {"current": current_tokens, "next": next_tokens}


# ─── GRACE PERIOD BACKGROUND TASK ───
async def handle_grace_period(token_id: str, restaurant_id: str):
    """
    Grace period logic:
    0-10 min  → Grace period (warnings at 5 min)
    10-20 min → Move customer down in queue
    20+ min   → Cancel token automatically
    """
    db = get_db()
    
    # Phase 1: Wait warning interval, then send warning
    await asyncio.sleep(settings.GRACE_WARNING_INTERVAL) 
    token = await db["tokens"].find_one({"_id": ObjectId(token_id)})
    if not token or token["status"] != "called":
        return  # Customer already arrived or cancelled
    
    sms_service.send_five_min_warning(token["customer_phone"], token["customer_name"])
    
    # Phase 2: Wait until move down threshold
    await asyncio.sleep(settings.GRACE_MOVE_DOWN_AFTER - settings.GRACE_WARNING_INTERVAL)
    token = await db["tokens"].find_one({"_id": ObjectId(token_id)})
    if not token or token["status"] != "called":
        return
    
    # Move to delayed status (pushed down in queue)
    await db["tokens"].update_one(
        {"_id": ObjectId(token_id)},
        {"$set": {"status": "delayed"}}
    )
    sms_service.send_moved_down(token["customer_phone"], token["customer_name"])
    
    # Recalculate queue
    await recalculate_queue(restaurant_id)
    
    await manager.broadcast_to_restaurant(restaurant_id, {
        "event": "status_update",
        "data": {"id": token_id, "status": "delayed", "message": "Customer moved down"}
    })
    
    # Phase 3: Wait until cancel threshold
    await asyncio.sleep(settings.GRACE_CANCEL_AFTER - settings.GRACE_MOVE_DOWN_AFTER)
    token = await db["tokens"].find_one({"_id": ObjectId(token_id)})
    if not token or token["status"] not in ["called", "delayed"]:
        return
    
    # Auto-cancel / no-show
    await db["tokens"].update_one(
        {"_id": ObjectId(token_id)},
        {"$set": {"status": "no_show", "completed_at": datetime.utcnow()}}
    )
    sms_service.send_token_cancelled(token["customer_phone"], token["customer_name"], token["token_number"])
    
    # Recalculate queue
    await recalculate_queue(restaurant_id)
    
    await manager.broadcast_to_restaurant(restaurant_id, {
        "event": "status_update",
        "data": {"id": token_id, "status": "no_show", "message": "Customer no-show, token cancelled"}
    })


# ─── JOIN QUEUE ───
@router.post("/join")
async def join_queue(token_data: TokenCreate, bt: BackgroundTasks):
    db = get_db()
    
    # Check if customer already has an active token at this restaurant
    existing = await db["tokens"].find_one({
        "restaurant_id": token_data.restaurant_id,
        "customer_phone": token_data.customer_phone,
        "status": {"$in": ["waiting", "called", "delayed"]}
    })
    if existing:
        existing["_id"] = str(existing["_id"])
        return existing  # Return existing token instead of creating duplicate
    
    # Count current waiting tokens for position
    count = await db["tokens"].count_documents(
        {"restaurant_id": token_data.restaurant_id, "status": {"$in": ["waiting", "called", "delayed"]}}
    )
    
    # Generate sequential token number for today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_count = await db["tokens"].count_documents({
        "restaurant_id": token_data.restaurant_id,
        "created_at": {"$gte": today_start}
    })
    
    position = count + 1
    
    token_dict = token_data.dict()
    token_dict["token_number"] = f"T-{today_count + 1:03d}"
    token_dict["status"] = "waiting"
    token_dict["position"] = position
    token_dict["created_at"] = datetime.utcnow()
    token_dict["estimated_time_mins"] = 0
    
    result = await db["tokens"].insert_one(token_dict)
    token_dict["_id"] = str(result.inserted_id)
    
    # Recalculate to get an accurate estimation
    updated_queue = await recalculate_queue(token_data.restaurant_id)
    for tk in updated_queue:
        if str(tk["_id"]) == token_dict["_id"]:
            token_dict["estimated_time_mins"] = tk["estimated_time_mins"]
            break
    
    # Broadcast to restaurant
    await manager.broadcast_to_restaurant(token_data.restaurant_id, {
        "event": "new_token",
        "data": token_dict
    })
    
    # Notify owner via Telegram
    restaurant = await db["restaurants"].find_one({"_id": ObjectId(token_data.restaurant_id)})
    if restaurant:
        owner = await db["users"].find_one({"_id": ObjectId(restaurant["owner_id"])})
        if owner and owner.get("telegram_chat_id"):
            telegram_service.send_message(
                owner["telegram_chat_id"],
                f"🔔 <b>New Token!</b>\n{token_data.customer_name} joined with {token_data.group_size} guests.\nToken: <b>{token_dict['token_number']}</b>"
            )

    # Send SMS confirmation
    track_url = f"http://localhost:5173/live-tracking/{token_dict['_id']}"
    sms_service.send_token_created(
        token_data.customer_phone,
        token_data.customer_name,
        token_dict["token_number"],
        token_dict["estimated_time_mins"],
        track_url
    )

    return token_dict


# ─── GET TOKEN ───
@router.get("/token/{token_id}")
async def get_token(token_id: str):
    db = get_db()
    token = await db["tokens"].find_one({"_id": ObjectId(token_id)})
    if not token:
        raise HTTPException(status_code=404, detail="Token not found")
    token["_id"] = str(token["_id"])
    return token


# ─── GET ALL QUEUE FOR RESTAURANT ───
@router.get("/restaurant/{restaurant_id}")
async def get_queue(restaurant_id: str):
    db = get_db()
    tokens = await db["tokens"].find(
        {"restaurant_id": restaurant_id, "status": {"$in": ["waiting", "called", "delayed"]}}
    ).sort("position", 1).to_list(200)
    for t in tokens:
        t["_id"] = str(t["_id"])
    return tokens


# ─── GET ALL TOKENS (including completed) FOR RESTAURANT ───
@router.get("/restaurant/{restaurant_id}/all")
async def get_all_tokens(restaurant_id: str):
    db = get_db()
    tokens = await db["tokens"].find(
        {"restaurant_id": restaurant_id}
    ).sort("created_at", -1).to_list(200)
    for t in tokens:
        t["_id"] = str(t["_id"])
    return tokens


# ─── GET SERVING INFO (for public display) ───
@router.get("/restaurant/{restaurant_id}/serving")
async def get_serving(restaurant_id: str):
    return await get_serving_info(restaurant_id)


# ─── UPDATE TOKEN STATUS ───
@router.post("/{token_id}/status")
async def update_status(token_id: str, status: str, table_id: Optional[str] = None, bt: BackgroundTasks = None):
    db = get_db()
    token = await db["tokens"].find_one({"_id": ObjectId(token_id)})
    if not token:
        raise HTTPException(status_code=404, detail="Token not found")
    
    print(f"--- UPDATE STATUS START: token={token_id}, status={status}, table_id={table_id} ---")
    update_data = {"status": status}
    
    # ─── CALLED: Customer's turn, start grace period ───
    if status == "called":
        print(f"Calling token {token_id}")
        update_data["called_at"] = datetime.utcnow()
        try:
            sms_service.send_table_ready(token["customer_phone"], token["customer_name"], token["token_number"])
        except Exception as e:
            print(f"SMS Call failed: {e}")
        if bt:
            bt.add_task(handle_grace_period, token_id, token["restaurant_id"])
    
    # ─── DINING: Customer arrived, assign table(s) ───
    elif status == "dining":
        print(f"Starting dining for token {token_id}")
        update_data["dining_at"] = datetime.utcnow()
        group_size = token["group_size"]
        
        allocated_tables = []
        
        # 1. Manual Assignment
        if table_id:
            # table_id could be a comma-separated list of IDs if multiple tables are used
            t_ids = [ObjectId(tid.strip()) for tid in table_id.split(",") if tid.strip()]
            manual_tables = await db["tables"].find({"_id": {"$in": t_ids}}).to_list(len(t_ids))
            if manual_tables:
                allocated_tables = manual_tables
                print(f"Manual assignment: {len(allocated_tables)} tables")
        
        # 2. Automatic Assignment if not manual
        if not allocated_tables:
            empty_tables = await db["tables"].find({
                "restaurant_id": token["restaurant_id"],
                "status": "empty"
            }).to_list(100)
            
            empty_tables.sort(key=lambda x: x["seats"])
            
            # Single fit
            for t in empty_tables:
                if t["seats"] >= group_size:
                    allocated_tables = [t]
                    break
                    
            if not allocated_tables:
                print(f"No single table found for group {group_size}, searching for combo...")
                best_c = [None]
                def search(idx, current_combo, current_seats):
                    if current_seats >= group_size:
                        if best_c[0] is None:
                            best_c[0] = list(current_combo)
                        else:
                            best_seats = sum(t["seats"] for t in best_c[0])
                            if current_seats < best_seats:
                                best_c[0] = list(current_combo)
                            elif current_seats == best_seats and len(current_combo) < len(best_c[0]):
                                best_c[0] = list(current_combo)
                        return
                    if idx >= len(empty_tables): return
                    current_combo.append(empty_tables[idx])
                    search(idx + 1, current_combo, current_seats + empty_tables[idx]["seats"])
                    current_combo.pop()
                    if best_c[0] is None:
                        search(idx + 1, current_combo, current_seats)
                search(0, [], 0)
                if best_c[0]:
                    allocated_tables = best_c[0]
        
        if allocated_tables:
            table_ids = [t["_id"] for t in allocated_tables]
            table_ids_str = ",".join(str(tid) for tid in table_ids)
            table_numbers_str = ", ".join(str(t["number"]) for t in allocated_tables)
            print(f"Assigning tables {table_numbers_str} to token {token_id}")
            
            await db["tables"].update_many(
                {"_id": {"$in": table_ids}},
                {"$set": {"status": "full", "current_token_id": token_id}}
            )
            update_data["assigned_table_id"] = table_ids_str
            update_data["assigned_table_number"] = table_numbers_str
            
            try:
                sms_service.send_dining_started(token["customer_phone"], token["customer_name"], table_numbers_str)
            except Exception as e:
                print(f"SMS Dining failed: {e}")
            
            await manager.broadcast_to_restaurant(token["restaurant_id"], {
                "event": "table_assigned",
                "data": {
                    "token_id": token_id, 
                    "table_id": table_ids_str,
                    "table_number": table_numbers_str
                }
            })
        else:
            print("No tables available for assignment!")
            try:
                sms_service.send_dining_started(token["customer_phone"], token["customer_name"], "N/A")
            except Exception as e:
                print(f"SMS Dining (no tables) failed: {e}")
    
    # ─── COMPLETED: Dining finished ───
    elif status == "completed":
        print(f"Completing dining for token {token_id}")
        update_data["completed_at"] = datetime.utcnow()
        
        # Free the assigned table
        if token.get("assigned_table_id"):
            tids = [ObjectId(tid.strip()) for tid in str(token["assigned_table_id"]).split(",") if tid.strip()]
            await db["tables"].update_many(
                {"_id": {"$in": tids}},
                {"$set": {"status": "cleaning", "current_token_id": None}}
            )
            for tid in tids:
                await manager.broadcast_to_restaurant(token["restaurant_id"], {
                    "event": "table_update",
                    "data": {
                        "id": str(tid),
                        "status": "cleaning"
                    }
                })
    
    # ─── CANCELLED ───
    elif status == "cancelled":
        print(f"Cancelling token {token_id}")
        update_data["completed_at"] = datetime.utcnow()
        if token.get("assigned_table_id"):
            tids = [ObjectId(tid.strip()) for tid in str(token["assigned_table_id"]).split(",") if tid.strip()]
            await db["tables"].update_many(
                {"_id": {"$in": tids}},
                {"$set": {"status": "empty", "current_token_id": None}}
            )
    
    # ─── NO-SHOW ───
    elif status == "no_show":
        print(f"Marking token {token_id} as no-show")
        update_data["completed_at"] = datetime.utcnow()
        try:
            sms_service.send_token_cancelled(token["customer_phone"], token["customer_name"], token["token_number"])
        except Exception as e:
            print(f"SMS No-show failed: {e}")
    
    print(f"Updating DB for token {token_id} with data {update_data}")
    await db["tokens"].update_one({"_id": ObjectId(token_id)}, {"$set": update_data})
    
    # Recalculate positions for remaining queue
    print("Recalculating queue...")
    await recalculate_queue(token["restaurant_id"])
    
    # Get updated token
    updated_token = await db["tokens"].find_one({"_id": ObjectId(token_id)})
    updated_token["_id"] = str(updated_token["_id"])
    
    # Broadcast update
    await manager.broadcast_to_restaurant(token["restaurant_id"], {
        "event": "status_update",
        "data": updated_token
    })
    
    print(f"--- UPDATE STATUS END: token={token_id} ---")
    return updated_token


# ─── CUSTOMER CANCEL OWN TOKEN ───
@router.post("/{token_id}/cancel")
async def cancel_token(token_id: str):
    db = get_db()
    token = await db["tokens"].find_one({"_id": ObjectId(token_id)})
    if not token:
        raise HTTPException(status_code=404, detail="Token not found")
    
    if token["status"] not in ["waiting", "called", "delayed"]:
        raise HTTPException(status_code=400, detail="Cannot cancel - token is not in an active state")
    
    await db["tokens"].update_one(
        {"_id": ObjectId(token_id)},
        {"$set": {"status": "cancelled", "completed_at": datetime.utcnow()}}
    )
    
    # Free table if assigned
    if token.get("assigned_table_id"):
        tids = [ObjectId(tid.strip()) for tid in str(token["assigned_table_id"]).split(",") if tid.strip()]
        await db["tables"].update_many(
            {"_id": {"$in": tids}},
            {"$set": {"status": "empty", "current_token_id": None}}
        )
    
    # Recalculate queue
    await recalculate_queue(token["restaurant_id"])
    
    await manager.broadcast_to_restaurant(token["restaurant_id"], {
        "event": "token_cancelled",
        "data": {"id": token_id, "token_number": token["token_number"]}
    })
    
    return {"message": "Token cancelled successfully"}


# ─── WEBSOCKET ENDPOINT ───
@router.websocket("/ws/{restaurant_id}")
async def websocket_endpoint(websocket: WebSocket, restaurant_id: str):
    await manager.connect(websocket, restaurant_id)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, restaurant_id)
