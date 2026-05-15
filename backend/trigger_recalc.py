import asyncio
from app.api.endpoints.queue import recalculate_queue
from app.core.database import connect_to_mongo, close_mongo_connection, get_db

async def main():
    await connect_to_mongo()
    db = get_db()
    restaurants = await db["restaurants"].find({}).to_list(100)
    for r in restaurants:
        r_id = str(r["_id"])
        print(f"Recalculating for restaurant {r_id}")
        await recalculate_queue(r_id)
    print("Done!")
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(main())
