from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List
import asyncio

class ConnectionManager:
    def __init__(self):
        # camera_id -> WebSocket (The source streaming the video)
        self.camera_connections: Dict[str, WebSocket] = {}
        # camera_id -> List[WebSocket] (Clients watching the stream)
        self.client_connections: Dict[str, List[WebSocket]] = {}

    async def connect_source(self, websocket: WebSocket, camera_id: str):
        await websocket.accept()
        self.camera_connections[camera_id] = websocket
        if camera_id not in self.client_connections:
            self.client_connections[camera_id] = []
        print(f"Camera source {camera_id} connected.")

    def disconnect_source(self, camera_id: str):
        if camera_id in self.camera_connections:
            del self.camera_connections[camera_id]
        print(f"Camera source {camera_id} disconnected.")

    async def connect_client(self, websocket: WebSocket, camera_id: str):
        await websocket.accept()
        if camera_id not in self.client_connections:
            self.client_connections[camera_id] = []
        self.client_connections[camera_id].append(websocket)
        print(f"Client connected to camera {camera_id}.")

    def disconnect_client(self, websocket: WebSocket, camera_id: str):
        if camera_id in self.client_connections:
            self.client_connections[camera_id].remove(websocket)
            print(f"Client disconnected from camera {camera_id}.")

    async def broadcast(self, message: bytes, camera_id: str):
        if camera_id in self.client_connections:
            for connection in self.client_connections[camera_id]:
                try:
                    await connection.send_bytes(message)
                except Exception as e:
                    print(f"Error broadcasting to client: {e}")
                    # Could remove dead connection here

manager = ConnectionManager()
