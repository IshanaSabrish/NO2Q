from fastapi import APIRouter, HTTPException
from app.core.database import get_db
from app.services.websocket import manager
from bson import ObjectId
from typing import Optional

router = APIRouter()

@router.get("/restaurant/{restaurant_id}")
async def get_tables(restaurant_id: str):
    db = get_db()
    tables = await db["tables"].find({"restaurant_id": restaurant_id}).sort("number", 1).to_list(200)
    for t in tables:
        t["_id"] = str(t["_id"])
    return tables

@router.get("/restaurant/{restaurant_id}/availability")
async def get_availability(restaurant_id: str, group_size: int = 1):
    """Return table availability + whether group_size can be seated right now."""
    db = get_db()
    tables = await db["tables"].find({"restaurant_id": restaurant_id}).sort("number", 1).to_list(200)
    for t in tables:
        t["_id"] = str(t["_id"])

    empty_tables = [t for t in tables if t["status"] == "empty"]
    total_available_seats = sum(t["seats"] for t in empty_tables)

    can_seat_now = False
    if group_size <= total_available_seats:
        for t in sorted(empty_tables, key=lambda x: x["seats"]):
            if t["seats"] >= group_size:
                can_seat_now = True
                break
        if not can_seat_now:
            running = 0
            for t in sorted(empty_tables, key=lambda x: x["seats"]):
                running += t["seats"]
                if running >= group_size:
                    can_seat_now = True
                    break

    # Calculate an accurate estimate for the frontend based on the monotonic queue
    estimated_wait_mins = 0
    if not can_seat_now:
        last_token = await db["tokens"].find_one(
            {"restaurant_id": restaurant_id, "status": {"$in": ["waiting", "called", "delayed"]}},
            sort=[("position", -1)]
        )
        if last_token and "estimated_time_mins" in last_token:
            estimated_wait_mins = last_token["estimated_time_mins"] + 2
        else:
            estimated_wait_mins = 15

    return {
        "tables": tables,
        "total_tables": len(tables),
        "empty_count": len(empty_tables),
        "total_available_seats": total_available_seats,
        "can_seat_now": can_seat_now,
        "group_size": group_size,
        "estimated_wait_mins": estimated_wait_mins,
    }

@router.post("/add")
async def add_table(table_data: dict):
    db = get_db()
    table_data["status"] = "empty"
    table_data["current_token_id"] = None
    result = await db["tables"].insert_one(table_data)
    table_data["_id"] = str(result.inserted_id)
    
    await manager.broadcast_to_restaurant(table_data["restaurant_id"], {
        "event": "new_table",
        "data": table_data
    })
    return table_data

@router.delete("/{table_id}")
async def delete_table(table_id: str):
    db = get_db()
    table = await db["tables"].find_one({"_id": ObjectId(table_id)})
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    if table["status"] == "full":
        raise HTTPException(status_code=400, detail="Cannot delete a table that is currently occupied")
    
    await db["tables"].delete_one({"_id": ObjectId(table_id)})
    
    await manager.broadcast_to_restaurant(table["restaurant_id"], {
        "event": "table_deleted",
        "data": {"id": table_id, "number": table["number"]}
    })
    return {"message": "Table deleted"}

@router.post("/{table_id}/status")
async def update_table_status(table_id: str, status: str):
    db = get_db()
    table = await db["tables"].find_one({"_id": ObjectId(table_id)})
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    update_data = {"status": status}
    
    # If marking as empty, clear the current token
    if status == "empty":
        update_data["current_token_id"] = None
        
    await db["tables"].update_one(
        {"_id": ObjectId(table_id)},
        {"$set": update_data}
    )
    
    # Broadcast to owner interface and displays
    await manager.broadcast_to_restaurant(table["restaurant_id"], {
        "event": "table_update",
        "data": {"id": table_id, "status": status, "number": table["number"], "seats": table["seats"]}
    })
    
    return {"message": "Status updated", "status": status}
