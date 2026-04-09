from fastapi import WebSocket
from fastapi.encoders import jsonable_encoder
from typing import Dict, List

class ConnectionManager:
    def __init__(self):
        # Map restaurant_id to list of WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, restaurant_id: str):
        await websocket.accept()
        if restaurant_id not in self.active_connections:
            self.active_connections[restaurant_id] = []
        self.active_connections[restaurant_id].append(websocket)

    def disconnect(self, websocket: WebSocket, restaurant_id: str):
        if restaurant_id in self.active_connections:
            if websocket in self.active_connections[restaurant_id]:
                self.active_connections[restaurant_id].remove(websocket)
            if not self.active_connections[restaurant_id]:
                del self.active_connections[restaurant_id]

    async def broadcast_to_restaurant(self, restaurant_id: str, message: dict):
        if restaurant_id in self.active_connections:
            # Use jsonable_encoder to handle datetime and ObjectId conversion
            safe_message = jsonable_encoder(message)
            for connection in self.active_connections[restaurant_id]:
                try:
                    await connection.send_json(safe_message)
                except Exception as e:
                    # Connection might be stale
                    pass

manager = ConnectionManager()
