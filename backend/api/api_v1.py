from fastapi import APIRouter
from .endpoints import auth, devices, telemetry, predictions, alerts, websockets, analytics, maintenance, issues, forecast

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(devices.router, prefix="/devices", tags=["devices"])
api_router.include_router(telemetry.router, prefix="/telemetry", tags=["telemetry"])
api_router.include_router(predictions.router, prefix="/predictions", tags=["predictions"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
api_router.include_router(issues.router, prefix="/issues", tags=["issues"])
api_router.include_router(websockets.router, prefix="/ws", tags=["websockets"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(maintenance.router, prefix="/maintenance", tags=["maintenance"])
api_router.include_router(forecast.router, tags=["forecast"])
