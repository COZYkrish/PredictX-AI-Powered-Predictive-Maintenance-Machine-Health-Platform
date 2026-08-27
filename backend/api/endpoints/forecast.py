"""
forecast.py — API endpoint for 30-minute metric trend forecasts.
"""
from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.db.session import get_db
from backend.security.deps import get_current_user
from backend.models.user import User
from backend.services.forecast_service import forecast_device_metrics

router = APIRouter()


class MetricForecast(BaseModel):
    metric: str
    label: str
    unit: str
    threshold: float
    current: Optional[float]
    forecast_30min: Optional[float]
    trend: str
    slope_per_minute: Optional[float]
    will_breach_threshold: bool
    eta_threshold_minutes: Optional[float]
    data_points: int
    window_minutes: float


class ForecastResponse(BaseModel):
    device_id: str
    forecasts: List[MetricForecast]
    has_warnings: bool


@router.get("/devices/{device_id}/forecast", response_model=ForecastResponse)
def get_device_forecast(
    device_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Returns 30-minute linear regression trend forecasts for CPU, memory, and disk.
    Uses the last 30 minutes of real telemetry data.
    """
    forecasts = forecast_device_metrics(db, device_id)
    if not forecasts:
        raise HTTPException(status_code=404, detail="No telemetry data available for forecast")

    has_warnings = any(f.get("will_breach_threshold") for f in forecasts)

    return ForecastResponse(
        device_id=device_id,
        forecasts=[MetricForecast(**f) for f in forecasts],
        has_warnings=has_warnings,
    )
