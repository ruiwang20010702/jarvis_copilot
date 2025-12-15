from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List, Any
import json
import asyncio

router = APIRouter(tags=["websocket"])

class ConnectionManager:
    def __init__(self):
        # Map client_id -> WebSocket
        self.active_connections: Dict[str, WebSocket] = {}
        # Map client_id -> role
        self.client_roles: Dict[str, str] = {}
        # Room state (in-memory for MVP, could be Redis later)
        self.room_state: Dict[str, Any] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        print(f"✅ Client connected: {client_id}")
        
        # Send welcome message
        await websocket.send_json({
            "type": "WELCOME",
            "clientId": client_id,
            "connectedClients": len(self.active_connections),
            "timestamp": asyncio.get_event_loop().time()
        })
        
        # Sync full state if exists
        if self.room_state:
            await websocket.send_json({
                "type": "FULL_STATE",
                "payload": self.room_state,
                "timestamp": asyncio.get_event_loop().time()
            })

    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
        if client_id in self.client_roles:
            del self.client_roles[client_id]
        print(f"❌ Client disconnected: {client_id}")

    async def broadcast(self, message: dict, sender_id: str = None):
        for client_id, connection in self.active_connections.items():
            if client_id != sender_id:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"Error broadcasting to {client_id}: {e}")

    async def handle_message(self, client_id: str, data: dict):
        msg_type = data.get("type")
        payload = data.get("payload", {})
        role = data.get("role")

        # Update role whenever provided (not just first time)
        if role:
            if self.client_roles.get(client_id) != role:
                self.client_roles[client_id] = role
                print(f"🎭 {client_id} role set: {role}")

        if msg_type == "JOIN":
            # Client announcing their presence
            print(f"👋 {client_id} joined as {role}")
            # Role already set above
            return


        if msg_type == "STATE_UPDATE":
            # Update room state
            self.room_state.update(payload)
            print(f"📤 {client_id} broadcast: {list(payload.keys())}")
            
            # Broadcast to others
            await self.broadcast({
                "type": "STATE_UPDATE",
                "payload": payload,
                "senderId": client_id,
                "senderRole": role,
                "timestamp": asyncio.get_event_loop().time()
            }, sender_id=client_id)

        elif msg_type == "REQUEST_FULL_STATE":
            if client_id in self.active_connections:
                await self.active_connections[client_id].send_json({
                    "type": "FULL_STATE",
                    "payload": self.room_state,
                    "timestamp": asyncio.get_event_loop().time()
                })

        elif msg_type == "RESET_ROOM":
            print(f"🔄 {client_id} requested room reset")
            self.room_state = {}
            await self.broadcast({
                "type": "ROOM_RESET",
                "senderId": client_id,
                "senderRole": role,
                "timestamp": asyncio.get_event_loop().time()
            })

        elif msg_type == "WEBRTC_SIGNAL":
            # Forward WebRTC signaling messages (offer, answer, candidate) to other clients
            # Use stored role to ensure senderRole is always set
            stored_role = self.client_roles.get(client_id, role)
            print(f"📡 {client_id} signal: {payload.get('type')} (role: {stored_role})")
            await self.broadcast({
                "type": "WEBRTC_SIGNAL",
                "payload": payload,
                "senderId": client_id,
                "senderRole": stored_role,
                "timestamp": asyncio.get_event_loop().time()
            }, sender_id=client_id)


manager = ConnectionManager()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    # Generate a temporary client ID (in prod, maybe from query param or auth)
    import uuid
    client_id = str(uuid.uuid4())[:8]
    
    await manager.connect(websocket, client_id)
    
    try:
        while True:
            data = await websocket.receive_json()
            await manager.handle_message(client_id, data)
    except WebSocketDisconnect:
        manager.disconnect(client_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(client_id)
