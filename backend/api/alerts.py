from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from schemas.alert import Alert, AlertCreate
from schemas.user import User
from api.auth import get_current_user
from core.database import db
from datetime import datetime

router = APIRouter()

@router.get("/", response_model=List[Alert])
async def get_alerts(skip: int = 0, limit: int = 100, current_user: User = Depends(get_current_user)):
    alerts_cursor = db.alerts.find().sort("timestamp", -1).skip(skip).limit(limit)
    alerts = await alerts_cursor.to_list(length=limit)
    # Convert ObjectId to str
    for alert in alerts:
        alert["id"] = str(alert["_id"])
    return alerts

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
