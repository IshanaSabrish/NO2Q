from fastapi import APIRouter, HTTPException
from app.core.database import get_db
from app.services.websocket import manager
from bson import ObjectId

router = APIRouter()

@router.get("/restaurant/{restaurant_id}")
async def get_tables(restaurant_id: str):
    db = get_db()
    tables = await db["tables"].find({"restaurant_id": restaurant_id}).sort("number", 1).to_list(200)
    for t in tables:
        t["_id"] = str(t["_id"])
    return tables

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
