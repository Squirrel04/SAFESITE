from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class AlertBase(BaseModel):
    camera_id: str
    alert_type: str  # PPE, Fall, Zone, etc.
    severity: str    # Low, Medium, High
    message: str
    timestamp: datetime = datetime.utcnow()
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    is_resolved: bool = False
    source: Optional[str] = "YOLO"  # YOLO or LLM
    confidence: Optional[float] = 0.0
    reasoning: Optional[str] = None
    recommendation: Optional[str] = None

class AlertCreate(AlertBase):
    pass

class Alert(AlertBase):
    id: str
