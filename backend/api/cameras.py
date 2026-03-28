from fastapi import APIRouter, Depends, HTTPException
from typing import List
from schemas.camera import Camera, CameraCreate
from schemas.user import User
from api.auth import get_current_user
from core.database import db
from api.websocket import manager

router = APIRouter()

MUTED_VIOLATIONS = {} # Format: {camera_id: {label: expiration_timestamp}}

@router.get("/{camera_id}/status")
async def get_camera_status(camera_id: str):
    import time
    connected_clients = len(manager.client_connections.get(camera_id, []))
    
    # Clean up expired and collect active mutes
    muted_labels = []
    current_time = time.time()
    if camera_id in MUTED_VIOLATIONS:
        active_mutes = {}
        for label, exp_time in MUTED_VIOLATIONS[camera_id].items():
            if exp_time > current_time:
                active_mutes[label] = exp_time
                muted_labels.append(label)
        MUTED_VIOLATIONS[camera_id] = active_mutes

    return {
        "active": connected_clients > 0,
        "muted_labels": muted_labels
    }

@router.get("/", response_model=List[Camera])
async def get_cameras(current_user: User = Depends(get_current_user)):
    cameras_cursor = db.cameras.find()
    cameras = await cameras_cursor.to_list(length=100)
    for cam in cameras:
        cam["id"] = str(cam["_id"])
    return cameras

@router.post("/", response_model=Camera)
async def create_camera(camera: CameraCreate, current_user: User = Depends(get_current_user)):
    result = await db.cameras.insert_one(camera.dict())
    created_camera = await db.cameras.find_one({"_id": result.inserted_id})
    created_camera["id"] = str(created_camera["_id"])
    return created_camera

@router.delete("/{camera_id}")
async def delete_camera(camera_id: str, current_user: User = Depends(get_current_user)):
    # Need ObjectId handling if using real mongo IDs, but here we assume string IDs or handle conversion
    from bson import ObjectId
    result = await db.cameras.delete_one({"_id": ObjectId(camera_id)})
    if result.deleted_count == 1:
        return {"msg": "Camera deleted"}
    raise HTTPException(status_code=404, detail="Camera not found")
