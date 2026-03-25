import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def check_db():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.safesite
    
    print("--- USERS ---")
    async for user in db.users.find({}, {"username": 1, "role": 1}):
        print(f"User: {user.get('username')}, Role: {user.get('role')}")
        
    print("\n--- ALERTS COUNT ---")
    count = await db.alerts.count_documents({})
    print(f"Total Alerts: {count}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_db())
