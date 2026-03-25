from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from api.auth import router as auth_router
from api.alerts import router as alerts_router
from api.cameras import router as cameras_router
import os
from fastapi.staticfiles import StaticFiles

app = FastAPI(title=settings.PROJECT_NAME, version="1.0.0")

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(alerts_router, prefix="/alerts", tags=["alerts"])
app.include_router(cameras_router, prefix="/cameras", tags=["cameras"])
from api.stats import router as stats_router
app.include_router(stats_router, prefix="/stats", tags=["stats"])

# Static files for media
MEDIA_DIR = "media"
if not os.path.exists(MEDIA_DIR):
    os.makedirs(MEDIA_DIR)
app.mount("/media", StaticFiles(directory=MEDIA_DIR), name="media")

from fastapi import File, UploadFile
import shutil

@app.post("/alerts/upload-evidence")
async def upload_evidence(file: UploadFile = File(...)):
    file_path = os.path.join(MEDIA_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"url": f"/media/{file.filename}"}

from fastapi import WebSocket, WebSocketDisconnect
from api.websocket import manager

@app.websocket("/ws/stream/upload/{camera_id}")
async def websocket_endpoint_upload(websocket: WebSocket, camera_id: str):
    await manager.connect_source(websocket, camera_id)
    try:
        while True:
            data = await websocket.receive_bytes()
            # Broadcast immediately to all clients listening to this camera
            await manager.broadcast(data, camera_id)
    except WebSocketDisconnect:
        manager.disconnect_source(camera_id)
    except Exception as e:
        print(f"Error in upload stream: {e}")
        manager.disconnect_source(camera_id)

@app.websocket("/ws/notifications")
async def websocket_endpoint_notifications(websocket: WebSocket):
    await manager.connect_notification(websocket)
    try:
        while True:
            await websocket.receive_text() # Keep alive
    except WebSocketDisconnect:
        manager.disconnect_notification(websocket)
    except Exception as e:
        print(f"Error in notifications WS: {e}")
        manager.disconnect_notification(websocket)

@app.websocket("/ws/stream/client/{camera_id}")
async def websocket_endpoint_client(websocket: WebSocket, camera_id: str):
    await manager.connect_client(websocket, camera_id)
    try:
        while True:
            await websocket.receive_text() 
    except WebSocketDisconnect:
        manager.disconnect_client(websocket, camera_id)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # TODO: Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Welcome to SafeSite API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
