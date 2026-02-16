from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from api.auth import router as auth_router
from api.alerts import router as alerts_router
from api.cameras import router as cameras_router

app = FastAPI(title=settings.PROJECT_NAME, version="1.0.0")

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(alerts_router, prefix="/alerts", tags=["alerts"])
app.include_router(cameras_router, prefix="/cameras", tags=["cameras"])
from api.stats import router as stats_router
app.include_router(stats_router, prefix="/stats", tags=["stats"])

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

@app.websocket("/ws/stream/client/{camera_id}")
async def websocket_endpoint_client(websocket: WebSocket, camera_id: str):
    await manager.connect_client(websocket, camera_id)
    try:
        while True:
            # Keep connection alive, maybe wait for commands from client?
            # For now just sleep or listen for close
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
