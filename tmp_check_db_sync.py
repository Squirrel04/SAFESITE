from pymongo import MongoClient
import os

def check_db():
    try:
        client = MongoClient("mongodb://localhost:27017")
        db = client.safesite
        
        print("--- USERS ---")
        for user in db.users.find({}, {"username": 1, "role": 1}):
            print(f"User: {user.get('username')}, Role: {user.get('role')}")
            
        print("\n--- ALERTS COUNT ---")
        count = db.alerts.count_documents({})
        print(f"Total Alerts: {count}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    check_db()
