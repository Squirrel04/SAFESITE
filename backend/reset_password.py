import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from core.security import get_password_hash
from core.config import settings

async def main():
    client = AsyncIOMotorClient(settings.MONGO_URL)
    db = client[settings.DB_NAME]
    
    # Hash the new password
    new_password = "password123"
    hashed_pw = get_password_hash(new_password)
    
    # Update the user safesite03
    result = await db.users.update_one(
        {"username": "safesite03"},
        {"$set": {"hashed_password": hashed_pw}}
    )
    
    if result.modified_count > 0:
        print(f"Successfully reset password for safesite03 to: {new_password}")
    else:
        print("Failed to update password. User might not exist.")
        
if __name__ == "__main__":
    asyncio.run(main())
