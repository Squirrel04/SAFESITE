import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from core.security import get_password_hash
from core.config import settings

async def main():
    client = AsyncIOMotorClient(settings.MONGO_URL)
    db = client[settings.DB_NAME]
    
    hashed_pw = get_password_hash("password123")
    
    result = await db.users.update_one(
        {"username": "safesite03"},
        {"$set": {"hashed_password": hashed_pw}},
        upsert=True
    )
    
    print("Successfully set username 'safesite03' with password 'password123'")

if __name__ == "__main__":
    asyncio.run(main())
