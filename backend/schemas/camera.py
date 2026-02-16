from pydantic import BaseModel
from typing import Optional

class CameraBase(BaseModel):
    name: str # "Main Gate"
    source: str # "rtsp://..." or "0" for webcam
    zone: Optional[str] = "General"
    is_active: bool = True

class CameraCreate(CameraBase):
    pass

class Camera(CameraBase):
    id: str
