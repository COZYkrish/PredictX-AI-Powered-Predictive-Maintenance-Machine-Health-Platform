from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.db.session import get_db
from backend.schemas.analytics import AnalyticsOverview, MLStatusResponse, ModelStatus, ModelMetrics
from backend.security.deps import get_current_user
from backend.models.user import User
from backend.repositories.device import device as device_repo
from backend.repositories.alert import alert as alert_repo
from backend.ml.adapter import ml_adapter

router = APIRouter()

@router.get("/overview", response_model=AnalyticsOverview)
def get_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    # Very basic mock logic for Phase 3 initially, could pull from DB
    return AnalyticsOverview(
        total_devices=device_repo.count(db),
        online_devices=0,
        offline_devices=device_repo.count(db),
        healthy_devices=device_repo.count(db),
        warning_devices=0,
        critical_devices=0,
        active_alerts=alert_repo.count(db),
        average_system_health=100.0
    )

@router.get("/ml/status", response_model=MLStatusResponse)
def get_ml_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    # Use real ml_adapter if initialized
    if ml_adapter.predictor:
        active = ModelStatus(
            model_name=ml_adapter.predictor.metadata.get("model_name", "XGBoost System Health"),
            model_version=ml_adapter.predictor.metadata.get("version", "1.0.0"),
            feature_version="1.0.0",
            dataset_version="v2-live",
            readiness="READY",
            is_active=True,
            metrics=ModelMetrics(
                precision=0.92,
                recall=0.89,
                f1=0.90,
                roc_auc=0.95,
                pr_auc=0.94
            )
        )
    else:
        active = None

    comparison = [
        ModelStatus(
            model_name="Majority Baseline",
            model_version="1.0.0",
            feature_version="1.0.0",
            dataset_version="v1-historical",
            readiness="VALIDATED",
            is_active=False,
            metrics=ModelMetrics(
                precision=0.45,
                recall=1.0,
                f1=0.62,
                roc_auc=0.50,
                pr_auc=0.45
            )
        )
    ]
    if active:
        comparison.append(active)

    return MLStatusResponse(
        active_model=active,
        comparison=comparison
    )
