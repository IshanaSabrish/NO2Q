from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from beanie import init_beanie
from app.models import UserModel, RestaurantModel, TableModel, TokenModel

client = None
db = None

async def connect_to_mongo():
    global client, db
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    await init_beanie(database=db, document_models=[UserModel, RestaurantModel, TableModel, TokenModel])
    print("Connected to MongoDB!")

async def close_mongo_connection():
    global client
    if client:
        client.close()
        print("Closed MongoDB connection.")

def get_db():
    return db
