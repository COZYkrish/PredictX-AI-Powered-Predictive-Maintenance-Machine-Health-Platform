from pydantic import BaseModel
from typing import List, Dict

class AnalyticsOverview(BaseModel):
    total_devices: int
    online_devices: int
    offline_devices: int
    healthy_devices: int
    warning_devices: int
    critical_devices: int
    active_alerts: int
    average_system_health: float

class DeviceAnalytics(BaseModel):
    latest_health_score: int
    latest_risk: str
    latest_anomaly_result: str
    prediction_history: List[Dict]
    alert_history: List[Dict]
    
class RiskDistribution(BaseModel):
    healthy: int
    warning: int
    critical: int
