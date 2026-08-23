from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from backend.models.prediction import Prediction
from backend.repositories.alert import alert as alert_repo
from backend.repositories.alert import AlertCreate
from backend.config import settings

def evaluate_prediction_for_alerts(db: Session, prediction: Prediction):
    """
    Evaluates ML prediction results and creates deduplicated alerts if necessary.
    """
    if prediction.prediction in ["WARNING", "CRITICAL"]:
        severity = prediction.prediction # Re-using prediction label as severity
        
        # Check cooldown / active alert
        active_alert = alert_repo.get_active_for_device(
            db, device_id=prediction.device_id, alert_type="SYSTEM_HEALTH"
        )
        
        if active_alert:
            # Check if cooldown has passed to trigger again, or just let it be.
            # For phase 3, we deduplicate by just not creating a new one if OPEN.
            return
            
        # Create alert
        alert_in = AlertCreate(
            device_id=prediction.device_id,
            prediction_id=prediction.id,
            alert_type="SYSTEM_HEALTH",
            severity=severity,
            title=f"System Health {severity}",
            message=f"Device {prediction.device_id} detected a {severity} risk condition with score {prediction.health_score}."
        )
        
        alert_repo.create(db, obj_in=alert_in)
        
        # We can broadcast the alert via WebSocket in the prediction_worker
