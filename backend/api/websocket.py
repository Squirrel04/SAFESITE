from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List
import asyncio

class ConnectionManager:
    def __init__(self):
        # camera_id -> WebSocket (The source streaming the video)
        self.camera_connections: Dict[str, WebSocket] = {}
        # camera_id -> List[WebSocket] (Clients watching the stream)
        self.client_connections: Dict[str, List[WebSocket]] = {}
        # List of WebSockets for dashboard notifications
        self.notification_sockets: List[WebSocket] = []

    async def connect_source(self, websocket: WebSocket, camera_id: str):
        # If there's an existing source for this camera, close it
        if camera_id in self.camera_connections:
            try:
                await self.camera_connections[camera_id].close()
            except Exception:
                pass

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
            try:
                self.client_connections[camera_id].remove(websocket)
            except ValueError:
                pass
            print(f"Client disconnected from camera {camera_id}.")

    async def broadcast(self, message: bytes, camera_id: str):
        if camera_id not in self.client_connections:
            return
        dead = []
        for connection in self.client_connections[camera_id]:
            try:
                await connection.send_bytes(message)
            except Exception:
                dead.append(connection)
        # Clean up dead connections
        for conn in dead:
            try:
                self.client_connections[camera_id].remove(conn)
            except ValueError:
                pass

    async def connect_notification(self, websocket: WebSocket):
        await websocket.accept()
        self.notification_sockets.append(websocket)
        print("Notification client connected.")

    def disconnect_notification(self, websocket: WebSocket):
        try:
            self.notification_sockets.remove(websocket)
            print("Notification client disconnected.")
        except ValueError:
            pass

    async def broadcast_notification(self, data: dict):
        import json
        message = json.dumps(data, default=str)
        dead = []
        for connection in list(self.notification_sockets):
            try:
                await connection.send_text(message)
            except Exception:
                dead.append(connection)
        # Clean up stale notification sockets immediately
        for conn in dead:
            try:
                self.notification_sockets.remove(conn)
            except ValueError:
                pass

manager = ConnectionManager()
