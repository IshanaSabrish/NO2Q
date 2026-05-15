from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse, FileResponse, StreamingResponse
from app.core.database import get_db
from bson import ObjectId
import uuid
import os
import urllib.parse

router = APIRouter()

UPLOAD_DIR = "uploads"

@router.get("/documents/{restaurant_id}/{doc_type}")
async def get_restaurant_document(restaurant_id: str, doc_type: str):
    """Get the URL for a restaurant's FSSAI or GST document"""
    if doc_type not in ("fssai", "gst"):
        raise HTTPException(status_code=400, detail="doc_type must be 'fssai' or 'gst'")
    db = get_db()
    restaurant = await db["restaurants"].find_one({"_id": ObjectId(restaurant_id)})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    doc_url = restaurant.get(doc_type, "")
    if not doc_url:
        raise HTTPException(status_code=404, detail=f"No {doc_type.upper()} document uploaded")
    # Extract filename from URL to infer extension
    filename = doc_url.split("/")[-1]
    return {"url": doc_url, "doc_type": doc_type, "filename": filename}


@router.get("/download/{restaurant_id}/{doc_type}")
async def download_restaurant_document(restaurant_id: str, doc_type: str):
    """Stream / download a restaurant's FSSAI or GST document file"""
    if doc_type not in ("fssai", "gst"):
        raise HTTPException(status_code=400, detail="doc_type must be 'fssai' or 'gst'")
    db = get_db()
    restaurant = await db["restaurants"].find_one({"_id": ObjectId(restaurant_id)})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    doc_url = restaurant.get(doc_type, "")
    if not doc_url:
        raise HTTPException(status_code=404, detail=f"No {doc_type.upper()} document uploaded")

    # doc_url looks like http://localhost:8000/static/<uuid>.<ext>
    filename = doc_url.split("/")[-1]
    file_path = os.path.join(UPLOAD_DIR, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Document file not found on server")

    rest_name = restaurant.get("name", "restaurant").replace(" ", "_")
    ext = filename.rsplit(".", 1)[-1] if "." in filename else "pdf"
    download_name = f"{rest_name}_{doc_type.upper()}_document.{ext}"

    return FileResponse(
        path=file_path,
        filename=download_name,
        media_type="application/octet-stream",
    )

@router.get("/requests")
async def get_pending_requests():
    """Get all restaurants pending admin approval"""
    db = get_db()
    requests = await db["restaurants"].find({"approved": False, "disabled": {"$ne": True}}).to_list(100)
    
    # Enrich with owner info
    for r in requests:
        r["_id"] = str(r["_id"])
        owner = await db["users"].find_one({"_id": ObjectId(r["owner_id"])})
        if owner:
            r["owner_name"] = owner.get("name", "Unknown")
            r["owner_email"] = owner.get("email", "N/A")
            r["owner_phone"] = owner.get("phone", "N/A")
    return requests

@router.get("/active")
async def get_active_restaurants():
    """Get all approved and active restaurants"""
    db = get_db()
    restaurants = await db["restaurants"].find({"approved": True, "disabled": {"$ne": True}}).to_list(100)
    
    for r in restaurants:
        r["_id"] = str(r["_id"])
        owner = await db["users"].find_one({"_id": ObjectId(r["owner_id"])})
        if owner:
            r["owner_name"] = owner.get("name", "Unknown")
            r["owner_email"] = owner.get("email", "N/A")
            r["owner_phone"] = owner.get("phone", "N/A")
        
        # Get queue count
        queue_count = await db["tokens"].count_documents({
            "restaurant_id": r["_id"],
            "status": {"$in": ["waiting", "called", "delayed"]}
        })
        r["active_queue"] = queue_count
        
        # Get table stats
        total_tables = await db["tables"].count_documents({"restaurant_id": r["_id"]})
        empty_tables = await db["tables"].count_documents({"restaurant_id": r["_id"], "status": "empty"})
        r["total_tables"] = total_tables
        r["empty_tables"] = empty_tables
    
    return restaurants

@router.post("/approve/{restaurant_id}")
async def approve_restaurant(restaurant_id: str):
    """Approve a restaurant and generate QR code"""
    db = get_db()
    restaurant = await db["restaurants"].find_one({"_id": ObjectId(restaurant_id)})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
        
    qr_code_token = f"no2q-{uuid.uuid4().hex[:12]}"
    
    # Approve restaurant
    await db["restaurants"].update_one(
        {"_id": ObjectId(restaurant_id)},
        {"$set": {
            "approved": True,
            "disabled": False,
            "qr_code": qr_code_token,
            "rejection_reason": None
        }}
    )
    
    # Approve owner user
    await db["users"].update_one(
        {"_id": ObjectId(restaurant["owner_id"])},
        {"$set": {"status": "approved"}}
    )
    
    return {"message": "Restaurant approved successfully", "qr_code": qr_code_token}

@router.post("/reject/{restaurant_id}")
async def reject_restaurant(restaurant_id: str, reason: str = "Does not meet our standards"):
    """Reject a restaurant application with reason"""
    db = get_db()
    restaurant = await db["restaurants"].find_one({"_id": ObjectId(restaurant_id)})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    await db["restaurants"].update_one(
        {"_id": ObjectId(restaurant_id)},
        {"$set": {
            "approved": False,
            "disabled": True,
            "rejection_reason": reason
        }}
    )
    
    # Set owner status to rejected
    await db["users"].update_one(
        {"_id": ObjectId(restaurant["owner_id"])},
        {"$set": {"status": "rejected"}}
    )
    
    return {"message": "Restaurant rejected", "reason": reason}

@router.post("/disable/{restaurant_id}")
async def disable_restaurant(restaurant_id: str):
    """Disable an active restaurant"""
    db = get_db()
    restaurant = await db["restaurants"].find_one({"_id": ObjectId(restaurant_id)})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
         
    await db["restaurants"].update_one(
        {"_id": ObjectId(restaurant_id)},
        {"$set": {"approved": False, "disabled": True}}
    )
    
    return {"message": "Restaurant disabled"}

@router.post("/enable/{restaurant_id}")
async def enable_restaurant(restaurant_id: str):
    """Re-enable a disabled restaurant"""
    db = get_db()
    restaurant = await db["restaurants"].find_one({"_id": ObjectId(restaurant_id)})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    await db["restaurants"].update_one(
        {"_id": ObjectId(restaurant_id)},
        {"$set": {"approved": True, "disabled": False}}
    )
    
    await db["users"].update_one(
        {"_id": ObjectId(restaurant["owner_id"])},
        {"$set": {"status": "approved"}}
    )
    
    return {"message": "Restaurant re-enabled"}

@router.get("/stats")
async def get_system_stats():
    """Get overall system statistics"""
    db = get_db()
    
    total_restaurants = await db["restaurants"].count_documents({})
    active_restaurants = await db["restaurants"].count_documents({"approved": True, "disabled": {"$ne": True}})
    pending_requests = await db["restaurants"].count_documents({"approved": False, "disabled": {"$ne": True}})
    total_users = await db["users"].count_documents({})
    total_customers = await db["users"].count_documents({"role": "customer"})
    total_tokens_today = await db["tokens"].count_documents({})
    
    return {
        "total_restaurants": total_restaurants,
        "active_restaurants": active_restaurants,
        "pending_requests": pending_requests,
        "total_users": total_users,
        "total_customers": total_customers,
        "total_tokens": total_tokens_today
    }
