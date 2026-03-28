from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from schemas.alert import Alert, AlertCreate
from schemas.user import User
from api.auth import get_current_user
from core.database import db
from datetime import datetime
import os

def delete_associated_files(alert_dict: dict):
    for key in ["image_url", "video_url"]:
        url = alert_dict.get(key)
        if url and "/media/" in url:
            try:
                filename = url.split("/media/")[-1]
                file_path = os.path.join("media", filename)
                if os.path.exists(file_path):
                    os.remove(file_path)
            except Exception as e:
                print(f"Failed to delete {url}: {e}")

router = APIRouter()

@router.get("/", response_model=List[Alert])
async def get_alerts(skip: int = 0, limit: int = 10000, current_user: User = Depends(get_current_user)):
    alerts_cursor = db.alerts.find().sort("timestamp", -1).skip(skip).limit(limit)
    alerts = await alerts_cursor.to_list(length=limit)
    # Convert ObjectId to str
    for alert in alerts:
        alert["id"] = str(alert["_id"])
    return alerts

from api.websocket import manager

@router.post("/", response_model=Alert)
async def create_alert(alert: AlertCreate):
    # This endpoint might be called by the AI service, so we might need a separate auth mechanism (API Key) 
    # or just use the same JWT if the AI service logs in. For simplicity, let's assume it's open/protected by network or shared secret later.
    # For now, we'll allow it without user auth for the AI service, or we can use a dependency that checks for a special token.
    
    alert_dict = alert.dict()
    alert_dict["timestamp"] = datetime.utcnow()
    result = await db.alerts.insert_one(alert_dict)
    created_alert = await db.alerts.find_one({"_id": result.inserted_id})
    created_alert["id"] = str(created_alert["_id"])
    
    # Broadcast to dashboard
    try:
        await manager.broadcast_notification(created_alert)
    except Exception as e:
        print(f"Failed to broadcast alert: {e}")
        
    return created_alert

@router.get("/{alert_id}", response_model=Alert)
async def get_alert(alert_id: str, current_user: User = Depends(get_current_user)):
    from bson import ObjectId
    try:
        alert = await db.alerts.find_one({"_id": ObjectId(alert_id)})
    except:
        raise HTTPException(status_code=404, detail="Invalid ID format")
        
    if alert:
        alert["id"] = str(alert["_id"])
        return alert
    raise HTTPException(status_code=404, detail="Alert not found")

@router.patch("/{alert_id}", response_model=Alert)
async def update_alert(alert_id: str, update_data: dict):
    from bson import ObjectId
    from api.cameras import MUTED_VIOLATIONS
    import time
    try:
        # Filter out keys that are None or not meant to be updated through this endpoint
        allowed_keys = ["image_url", "video_url", "is_resolved", "message"]
        filtered_data = {k: v for k, v in update_data.items() if k in allowed_keys and v is not None}
        
        if not filtered_data:
            raise HTTPException(status_code=400, detail="No valid update data provided")

        result = await db.alerts.update_one(
            {"_id": ObjectId(alert_id)},
            {"$set": filtered_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Alert not found")
            
        updated_alert = await db.alerts.find_one({"_id": ObjectId(alert_id)})
        updated_alert["id"] = str(updated_alert["_id"])
        
        # Logic to mute violation if it's resolved
        if filtered_data.get("is_resolved") is True:
            camera_id = updated_alert.get("camera_id")
            message = updated_alert.get("message", "")
            if camera_id and message.startswith("Detected: "):
                # Extract exact label to mute
                label = message.replace("Detected: ", "")
                if camera_id not in MUTED_VIOLATIONS:
                    MUTED_VIOLATIONS[camera_id] = {}
                # Mute for 5 minutes (300 seconds)
                MUTED_VIOLATIONS[camera_id][label] = time.time() + 300
                print(f"Muted violation '{label}' for camera {camera_id} for 5 minutes.")

        # Broadcast the updated alert so frontend processes the video payload dynamically!
        from api.websocket import manager
        try:
            await manager.broadcast_notification(updated_alert)
        except Exception as e:
            pass

        return updated_alert
    except Exception as e:
        print(f"Error updating alert: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{alert_id}")
async def delete_alert(alert_id: str):
    from bson import ObjectId
    try:
        if not ObjectId.is_valid(alert_id):
            print(f"DEBUG: Invalid alert_id format: {alert_id}")
            raise HTTPException(status_code=400, detail="Invalid alert ID format")
            
        alert = await db.alerts.find_one({"_id": ObjectId(alert_id)})
        if alert:
            delete_associated_files(alert)
            
        result = await db.alerts.delete_one({"_id": ObjectId(alert_id)})
        if result.deleted_count == 0:
            print(f"DEBUG: Alert not found for deletion: {alert_id}")
            raise HTTPException(status_code=404, detail="Alert not found")
        return {"message": "Successfully deleted alert"}
    except Exception as e:
        print(f"DEBUG: Exception during delete_alert: {str(e)}")
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/delete-bulk")
async def delete_alerts_bulk(alert_ids: List[str]):
    from bson import ObjectId
    try:
        obj_ids = [ObjectId(aid) for aid in alert_ids]
        alerts = await db.alerts.find({"_id": {"$in": obj_ids}}).to_list(length=None)
        for alert in alerts:
            delete_associated_files(alert)
        
        result = await db.alerts.delete_many({"_id": {"$in": obj_ids}})
        return {"message": f"Successfully deleted {result.deleted_count} alerts"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/clear")
async def clear_alerts():
    try:
        result = await db.alerts.delete_many({})
        if os.path.exists("media"):
            import shutil
            for filename in os.listdir("media"):
                file_path = os.path.join("media", filename)
                try:
                    if os.path.isfile(file_path) or os.path.islink(file_path):
                        os.unlink(file_path)
                except Exception as e:
                    print(f'Failed to delete {file_path}. Reason: {e}')
                    
        return {"message": f"Successfully cleared all {result.deleted_count} alerts"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
