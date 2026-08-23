from typing import Dict, List, Any
from fastapi import WebSocket
import logging
import json

logger = logging.getLogger(__name__)

class RealtimeManager:
    """Interface for Realtime Manager"""
    async def connect_dashboard(self, websocket: WebSocket):
        pass
        
    async def connect_device(self, websocket: WebSocket, device_id: str):
        pass
        
    def disconnect(self, websocket: WebSocket, device_id: str = None):
        pass
        
    def broadcast_prediction(self, prediction: Any):
        pass
        
    def broadcast_alert(self, alert: Any):
        pass

class InMemoryRealtimeManager(RealtimeManager):
    def __init__(self):
        self.dashboard_connections: List[WebSocket] = []
        self.device_connections: Dict[str, List[WebSocket]] = {}
        
    async def connect_dashboard(self, websocket: WebSocket):
        await websocket.accept()
        self.dashboard_connections.append(websocket)
        logger.info(f"Dashboard WebSocket connected. Total: {len(self.dashboard_connections)}")
        
    async def connect_device(self, websocket: WebSocket, device_id: str):
        await websocket.accept()
        if device_id not in self.device_connections:
            self.device_connections[device_id] = []
        self.device_connections[device_id].append(websocket)
        logger.info(f"Device WebSocket connected for {device_id}. Total: {len(self.device_connections[device_id])}")
        
    def disconnect(self, websocket: WebSocket, device_id: str = None):
        if device_id:
            if device_id in self.device_connections:
                if websocket in self.device_connections[device_id]:
                    self.device_connections[device_id].remove(websocket)
                if not self.device_connections[device_id]:
                    del self.device_connections[device_id]
        else:
            if websocket in self.dashboard_connections:
                self.dashboard_connections.remove(websocket)
                
    async def _broadcast_to_list(self, connections: List[WebSocket], message: dict):
        dead_connections = []
        for connection in connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.debug(f"Failed to send to websocket: {e}")
                dead_connections.append(connection)
                
        for dead in dead_connections:
            if dead in connections:
                connections.remove(dead)

    def broadcast_prediction(self, prediction: Any):
        import asyncio
        message = {
            "event": "prediction.completed",
            "device_id": prediction.device_id,
            "timestamp_utc": prediction.timestamp_utc.isoformat() if prediction.timestamp_utc else None,
            "payload": {
                "risk_level": prediction.risk_level,
                "health_score": prediction.health_score,
                "prediction": prediction.prediction
            }
        }
        
        # Broadcast to dashboard
        asyncio.create_task(self._broadcast_to_list(self.dashboard_connections, message))
        
        # Broadcast to specific device
        if prediction.device_id in self.device_connections:
            asyncio.create_task(self._broadcast_to_list(self.device_connections[prediction.device_id], message))
            
    def broadcast_alert(self, alert: Any):
        import asyncio
        message = {
            "event": "alert.created",
            "device_id": alert.device_id,
            "timestamp_utc": alert.created_at.isoformat() if alert.created_at else None,
            "payload": {
                "severity": alert.severity,
                "alert_type": alert.alert_type,
                "title": alert.title
            }
        }
        
        asyncio.create_task(self._broadcast_to_list(self.dashboard_connections, message))
        
        if alert.device_id in self.device_connections:
            asyncio.create_task(self._broadcast_to_list(self.device_connections[alert.device_id], message))

realtime_manager = InMemoryRealtimeManager()
