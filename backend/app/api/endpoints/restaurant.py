from fastapi import APIRouter, HTTPException
from typing import List
from pydantic import BaseModel
from app.core.database import get_db
from app.models.restaurant import RestaurantCreate, RestaurantModel
from bson import ObjectId
from datetime import datetime

router = APIRouter()

class SetupTables(BaseModel):
    owner_id: str
    table_config: List[dict]

@router.post("/setup")
async def setup_tables(setup: SetupTables):
    db = get_db()
    restaurant = await db["restaurants"].find_one({"owner_id": setup.owner_id})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    # Clear existing tables first
    await db["tables"].delete_many({"restaurant_id": str(restaurant["_id"])})
        
    tables = []
    table_count = 1
    for t in setup.table_config:
        for _ in range(t["qty"]):
            tables.append({
                "restaurant_id": str(restaurant["_id"]),
                "number": table_count,
                "seats": t["seats"],
                "status": "empty"
            })
            table_count += 1
            
    if tables:
        await db["tables"].insert_many(tables)
    return {"message": "Tables setup successfully", "count": len(tables)}

@router.post("/register")
async def register_restaurant(rest: RestaurantCreate):
    db = get_db()
    rest_dict = rest.dict()
    rest_dict["approved"] = False
    rest_dict["disabled"] = False
    rest_dict["created_at"] = datetime.utcnow()
    result = await db["restaurants"].insert_one(rest_dict)
    rest_dict["_id"] = str(result.inserted_id)
    return {"message": "Restaurant pending admin approval", "restaurant": rest_dict}

@router.get("/")
async def get_all_restaurants(approved_only: bool = True, owner_id: str = None):
    db = get_db()
    if owner_id:
        query = {"owner_id": owner_id}
    elif approved_only:
        query = {"approved": True, "disabled": {"$ne": True}}
    else:
        query = {}
    
    restaurants = await db["restaurants"].find(query).to_list(100)
    
    for r in restaurants:
        r["_id"] = str(r["_id"])
        # Add live queue count and table info
        queue_count = await db["tokens"].count_documents({
            "restaurant_id": r["_id"],
            "status": {"$in": ["waiting", "called", "delayed"]}
        })
        r["active_queue"] = queue_count
        
        empty_tables = await db["tables"].count_documents({
            "restaurant_id": r["_id"], "status": "empty"
        })
        total_tables = await db["tables"].count_documents({
            "restaurant_id": r["_id"]
        })
        r["empty_tables"] = empty_tables
        r["total_tables"] = total_tables
        
    return restaurants

@router.get("/{restaurant_id}")
async def get_restaurant(restaurant_id: str):
    db = get_db()
    restaurant = await db["restaurants"].find_one({"_id": ObjectId(restaurant_id)})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    restaurant["_id"] = str(restaurant["_id"])
    
    # Add live stats
    queue_count = await db["tokens"].count_documents({
        "restaurant_id": restaurant["_id"],
        "status": {"$in": ["waiting", "called", "delayed"]}
    })
    restaurant["active_queue"] = queue_count
    
    empty_tables = await db["tables"].count_documents({
        "restaurant_id": restaurant["_id"], "status": "empty"
    })
    total_tables = await db["tables"].count_documents({
        "restaurant_id": restaurant["_id"]
    })
    restaurant["empty_tables"] = empty_tables
    restaurant["total_tables"] = total_tables
    
    return restaurant

@router.get("/by-owner/{owner_id}")
async def get_by_owner(owner_id: str):
    db = get_db()
    restaurant = await db["restaurants"].find_one({"owner_id": owner_id})
    if not restaurant:
         raise HTTPException(status_code=404, detail="Restaurant not found")
    restaurant["_id"] = str(restaurant["_id"])
    return restaurant

@router.get("/qr/{qr_code}")
async def get_restaurant_by_qr(qr_code: str):
    db = get_db()
    restaurant = await db["restaurants"].find_one({"qr_code": qr_code})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    restaurant["_id"] = str(restaurant["_id"])
    return restaurant

# ─── CONTENT MANAGEMENT ───
@router.post("/{restaurant_id}/photos")
async def add_photo(restaurant_id: str, url: str):
    """Add a photo to restaurant gallery"""
    db = get_db()
    await db["restaurants"].update_one(
        {"_id": ObjectId(restaurant_id)},
        {"$push": {"images": url}}
    )
    return {"message": "Photo added"}

@router.delete("/{restaurant_id}/photos")
async def remove_photo(restaurant_id: str, url: str):
    """Remove a photo from restaurant gallery"""
    db = get_db()
    await db["restaurants"].update_one(
        {"_id": ObjectId(restaurant_id)},
        {"$pull": {"images": url}}
    )
    return {"message": "Photo removed"}

@router.post("/{restaurant_id}/menu-images")
async def add_menu_image(restaurant_id: str, url: str):
    """Add a menu image"""
    db = get_db()
    await db["restaurants"].update_one(
        {"_id": ObjectId(restaurant_id)},
        {"$push": {"menu_images": url}}
    )
    return {"message": "Menu image added"}

@router.delete("/{restaurant_id}/menu-images")
async def remove_menu_image(restaurant_id: str, url: str):
    """Remove a menu image"""
    db = get_db()
    await db["restaurants"].update_one(
        {"_id": ObjectId(restaurant_id)},
        {"$pull": {"menu_images": url}}
    )
    return {"message": "Menu image removed"}

@router.put("/{restaurant_id}/menu-url")
async def update_menu_url(restaurant_id: str, url: str):
    """Update menu PDF URL"""
    db = get_db()
    await db["restaurants"].update_one(
        {"_id": ObjectId(restaurant_id)},
        {"$set": {"menu_url": url}}
    )
    return {"message": "Menu URL updated"}

# ─── ANALYTICS ───
@router.get("/{restaurant_id}/analytics")
async def get_analytics(restaurant_id: str):
    db = get_db()
    
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Today's tokens
    today_tokens = await db["tokens"].count_documents({
        "restaurant_id": restaurant_id,
        "created_at": {"$gte": today_start}
    })
    
    # Completed tokens
    completed_tokens = await db["tokens"].count_documents({
        "restaurant_id": restaurant_id,
        "status": "completed"
    })
    
    # No-shows today
    no_shows = await db["tokens"].count_documents({
        "restaurant_id": restaurant_id,
        "status": "no_show",
        "created_at": {"$gte": today_start}
    })
    
    # Average wait time calculation
    pipeline = [
        {"$match": {
            "restaurant_id": restaurant_id, 
            "status": "completed",
            "dining_at": {"$exists": True},
            "created_at": {"$exists": True}
        }},
        {"$project": {
            "wait_time": {"$subtract": ["$dining_at", "$created_at"]}
        }},
        {"$group": {
            "_id": None, 
            "avgWait": {"$avg": "$wait_time"}
        }}
    ]
    cursor = db["tokens"].aggregate(pipeline)
    results = await cursor.to_list(1)
    
    avg_minutes = 0
    if results and results[0].get("avgWait"):
        avg_minutes = round(results[0]["avgWait"] / 60000)
    
    # Peak hours (simple hour-based grouping)
    peak_pipeline = [
        {"$match": {"restaurant_id": restaurant_id}},
        {"$group": {
            "_id": {"$hour": "$created_at"},
            "count": {"$sum": 1}
        }},
        {"$sort": {"count": -1}},
        {"$limit": 3}
    ]
    peak_cursor = db["tokens"].aggregate(peak_pipeline)
    peak_results = await peak_cursor.to_list(3)
    
    peak_hours = "N/A"
    if peak_results:
        hours = [f"{r['_id']}:00" for r in peak_results[:2]]
        peak_hours = " - ".join(hours)
    
    # Current queue
    active_queue = await db["tokens"].count_documents({
        "restaurant_id": restaurant_id,
        "status": {"$in": ["waiting", "called", "delayed"]}
    })
    
    # Basic sales estimate (e.g. $25 per completed token guest)
    sales_pipeline = [
        {"$match": {
            "restaurant_id": restaurant_id, 
            "status": "completed"
        }},
        {"$group": {
            "_id": None, 
            "totalGuests": {"$sum": "$group_size"}
        }}
    ]
    sales_cursor = db["tokens"].aggregate(sales_pipeline)
    sales_results = await sales_cursor.to_list(1)
    
    total_sales = 0
    if sales_results and sales_results[0].get("totalGuests"):
        total_sales = sales_results[0]["totalGuests"] * 25 # Assuming $25 avg per guest
    
    return {
        "today_tokens": today_tokens,
        "completed_tokens": completed_tokens,
        "no_shows": no_shows,
        "average_wait_time": avg_minutes,
        "peak_hours": peak_hours,
        "active_queue": active_queue,
        "total_sales_estimate": total_sales
    }
