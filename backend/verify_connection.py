import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys
import os

# Add the current directory to sys.path to import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings

async def verify_everything():
    print("--- NO2Q+ SYSTEM VERIFICATION ---")
    
    # 1. MongoDB Connection
    print("Checking MongoDB connection...")
    try:
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        # The ismaster command is cheap and does not require auth.
        await client.admin.command('ismaster')
        print("✅ MongoDB connection successful!")
        
        db = client[settings.DATABASE_NAME]
        
        # 2. Check Collections
        collections = await db.list_collection_names()
        required = ["users", "restaurants", "tables", "tokens"]
        for coll in required:
            if coll in collections:
                count = await db[coll].count_documents({})
                print(f"✅ Collection '{coll}' found. Document count: {count}")
            else:
                print(f"❌ Collection '{coll}' MISSING!")
        
        # 3. Verify Seed Data
        admin = await db["users"].find_one({"role": "admin"})
        if admin:
            print(f"✅ Admin user found: {admin.get('email')}")
        else:
            print("❌ Admin user NOT found! Did you run seed.py?")

        owner = await db["users"].find_one({"role": "owner"})
        if owner:
            print(f"✅ Owner user found: {owner.get('email')}")
        else:
            print("❌ Owner user NOT found!")

        restaurant = await db["restaurants"].find_one({})
        if restaurant:
            print(f"✅ Restaurant found: {restaurant.get('name')}")
        else:
            print("❌ No restaurants found!")

    except Exception as e:
        print(f"❌ Verification failed: {e}")
    finally:
        client.close()
        print("-------------------------------")

if __name__ == "__main__":
    asyncio.run(verify_everything())
