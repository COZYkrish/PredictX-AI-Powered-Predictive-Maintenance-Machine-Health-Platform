from pydantic import BaseModel
from typing import List, Dict, Optional

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

class ModelMetrics(BaseModel):
    precision: float
    recall: float
    f1: float
    roc_auc: float
    pr_auc: float

class ModelStatus(BaseModel):
    model_name: str
    model_version: str
    feature_version: str
    dataset_version: str
    readiness: str  # VALIDATED | READY | BLOCKED | NOT_TRAINED
    is_active: bool
    metrics: Optional[ModelMetrics] = None

class MLStatusResponse(BaseModel):
    active_model: Optional[ModelStatus] = None
    comparison: List[ModelStatus] = []
