from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from backend.realtime.manager import realtime_manager
from backend.security.deps import get_current_user
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.websocket("/dashboard")
async def websocket_dashboard(websocket: WebSocket):
    # In a real app we'd extract token from query param or headers and authenticate here
    await realtime_manager.connect_dashboard(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        realtime_manager.disconnect(websocket)
        logger.info("Dashboard websocket disconnected")

@router.websocket("/devices/{device_id}")
async def websocket_device(websocket: WebSocket, device_id: str):
    await realtime_manager.connect_device(websocket, device_id)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        realtime_manager.disconnect(websocket, device_id)
        logger.info(f"Device websocket {device_id} disconnected")
