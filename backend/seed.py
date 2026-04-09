import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.core.security import get_password_hash
from datetime import datetime

async def seed_db():
    print("Connecting to DB...")
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]

    print("Clearing collections...")
    await db["users"].delete_many({})
    await db["restaurants"].delete_many({})
    await db["tokens"].delete_many({})
    await db["tables"].delete_many({})
    await db["otps"].delete_many({})

    print("Seeding Users...")
    admin_user = {
        "name": "Admin Manager",
        "phone": "9999999999",
        "email": "admin@no2q.com",
        "role": "admin",
        "password": get_password_hash("admin123"),
        "status": "approved"
    }
    owner_user = {
        "name": "Rajesh Kumar",
        "phone": "8888888888",
        "email": "owner@paradise.com",
        "role": "owner",
        "password": get_password_hash("owner123"),
        "status": "approved"
    }
    owner_user_2 = {
        "name": "Priya Sharma",
        "phone": "8888888877",
        "email": "owner@biryanihouse.com",
        "role": "owner",
        "password": get_password_hash("owner123"),
        "status": "pending"
    }
    customer_user = {
        "name": "John Doe",
        "phone": "7777777777",
        "role": "customer",
        "status": "approved"
    }
    customer_user_2 = {
        "name": "Jane Smith",
        "phone": "6666666666",
        "role": "customer",
        "status": "approved"
    }
    
    admin_result = await db["users"].insert_one(admin_user)
    owner_result = await db["users"].insert_one(owner_user)
    owner_result_2 = await db["users"].insert_one(owner_user_2)
    cust_result = await db["users"].insert_one(customer_user)
    cust_result_2 = await db["users"].insert_one(customer_user_2)

    print("Seeding Restaurants...")
    restaurant_1 = {
        "name": "Paradise Biryani",
        "location": "Road No. 1, Banjara Hills, Hyderabad",
        "owner_id": str(owner_result.inserted_id),
        "approved": True,
        "disabled": False,
        "images": [
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80"
        ],
        "menu_url": "",
        "menu_images": [
            "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80"
        ],
        "fssai": "https://example.com/fssai.pdf",
        "gst": "https://example.com/gst.pdf",
        "fssai_number": "FSSAI-123456789012",
        "gst_number": "29ABCDE1234F1Z5",
        "qr_code": "no2q-paradise-123",
        "created_at": datetime.utcnow()
    }
    
    restaurant_2 = {
        "name": "Royal Biryani House",
        "location": "MG Road, Bangalore",
        "owner_id": str(owner_result_2.inserted_id),
        "approved": False,
        "disabled": False,
        "images": [
            "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80"
        ],
        "menu_url": "",
        "menu_images": [],
        "fssai": "https://example.com/fssai2.pdf",
        "gst": "",
        "fssai_number": "FSSAI-987654321012",
        "gst_number": "",
        "qr_code": None,
        "created_at": datetime.utcnow()
    }
    
    rest_result = await db["restaurants"].insert_one(restaurant_1)
    rest_result_2 = await db["restaurants"].insert_one(restaurant_2)

    print("Seeding Tables...")
    tables = [
        {"restaurant_id": str(rest_result.inserted_id), "number": 1, "seats": 2, "status": "empty", "current_token_id": None},
        {"restaurant_id": str(rest_result.inserted_id), "number": 2, "seats": 2, "status": "empty", "current_token_id": None},
        {"restaurant_id": str(rest_result.inserted_id), "number": 3, "seats": 4, "status": "empty", "current_token_id": None},
        {"restaurant_id": str(rest_result.inserted_id), "number": 4, "seats": 4, "status": "full", "current_token_id": None},
        {"restaurant_id": str(rest_result.inserted_id), "number": 5, "seats": 6, "status": "empty", "current_token_id": None},
        {"restaurant_id": str(rest_result.inserted_id), "number": 6, "seats": 6, "status": "cleaning", "current_token_id": None},
        {"restaurant_id": str(rest_result.inserted_id), "number": 7, "seats": 8, "status": "empty", "current_token_id": None},
        {"restaurant_id": str(rest_result.inserted_id), "number": 8, "seats": 2, "status": "empty", "current_token_id": None},
    ]
    await db["tables"].insert_many(tables)

    print("\n" + "=" * 50)
    print("Database Seeded Successfully!")
    print("=" * 50)
    print("\nLogin Credentials:")
    print("-" * 40)
    print("Admin:    admin@no2q.com / admin123")
    print("Owner:    owner@paradise.com / owner123")
    print("Customer: 7777777777 / no password")
    print("-" * 40)
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_db())
