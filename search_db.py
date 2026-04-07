import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def search_db():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["safesite"]
    collections = await db.list_collection_names()
    found = False
    
    for coll_name in collections:
        coll = db[coll_name]
        cursor = coll.find({})
        async for doc in cursor:
            doc_str = str(doc).lower()
            if "insforge" in doc_str:
                print(f"FOUND in collection {coll_name}, document ID {doc.get('_id')}")
                found = True
                
    if not found:
        print("Not found in database.")

if __name__ == "__main__":
    asyncio.run(search_db())
