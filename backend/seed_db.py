import asyncio
from app.core.security import get_password_hash
from app.models import UserModel, RestaurantModel
from app.core.database import connect_to_mongo, close_mongo_connection

async def seed():
    await connect_to_mongo()

    # Check if admin exists
    admin = await UserModel.find_one(UserModel.email == "admin@no2q.com")
    if not admin:
        print("Creating admin user...")
        admin = UserModel(
            email="admin@no2q.com",
            password_hash=get_password_hash("admin123"),
            role="admin",
            name="Super Admin",
            status="approved",
            phone="0000000000"
        )
        await admin.insert()
    
    # Check if owner exists
    owner = await UserModel.find_one(UserModel.email == "owner@paradise.com")
    if not owner:
        print("Creating owner user...")
        owner = UserModel(
            email="owner@paradise.com",
            password_hash=get_password_hash("owner123"),
            role="owner",
            name="John Paradise",
            status="approved",
            phone="9999999999"
        )
        await owner.insert()
        
        # Create restaurant
        print("Creating restaurant...")
        restaurant = RestaurantModel(
            owner_id=str(owner.id),
            name="Paradise Biryani",
            location="Hyderabad, IND",
            approved=True,
            qr_code="no2q-paradise123",
            images=[],
            menu_images=[],
            status="active"
        )
        await restaurant.insert()
    
    # Check for customer
    customer = await UserModel.find_one(UserModel.phone == "7777777777")
    if not customer:
        print("Creating customer user...")
        customer = UserModel(
            phone="7777777777",
            role="customer",
            name="John Doe",
            status="approved"
        )
        await customer.insert()

    print("Seeding complete!")
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(seed())
