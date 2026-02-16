from fastapi import APIRouter
from core.database import db

router = APIRouter()

@router.get("/")
async def get_stats():
    total_alerts = await db.alerts.count_documents({})
    # Mocking other stats for now or counting users
    # personnel = await db.users.count_documents({})
    
    return {
        "total_alerts": total_alerts,
        "active_cameras": 1, # Hardcoded for now based on active streaming
        "system_status": "98%",
        "personnel": 24, # Mock
        "recent_alerts": [] # Could fetch recent
    }
