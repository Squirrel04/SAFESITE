from fastapi import APIRouter
from core.database import db

router = APIRouter()

from api.websocket import manager

@router.get("/")
async def get_stats():
    total_alerts = await db.alerts.count_documents({})
    total_db_cameras = await db.cameras.count_documents({})
    
    # Active streaming feeds
    active_cameras = len(manager.camera_connections)
    
    # Total depends on active cameras or configured cameras
    total_cameras = max(total_db_cameras, active_cameras)
    if total_db_cameras == 0:
        total_cameras = max(4, active_cameras) # fallback to 4 known cameras in system
    
    return {
        "total_alerts": total_alerts,
        "active_cameras": active_cameras,
        "total_cameras": total_cameras,
        "system_status": "98%",
        "personnel": 24, # Mock
        "recent_alerts": [] # Could fetch recent
    }
