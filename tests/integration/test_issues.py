import pytest
from datetime import datetime, timezone
from backend.models.prediction import Prediction
from backend.models.telemetry import TelemetrySample
from backend.models.issue import Issue, IssueStatusEnum
from backend.models.alert import Alert, AlertStatusEnum
from backend.models.device import Device
from backend.services.alert_service import evaluate_prediction_for_alerts

def test_alert_deduplication(db_session):
    # Create device
    test_device = Device(
        id="dev-123",
        device_id="test-dedup-dev",
        hostname="dedup-host",
        operating_system="Windows",
        os_version="10",
        agent_version="1.0"
    )
    db_session.add(test_device)
    db_session.commit()
    
    # Create prediction
    now = datetime.now(timezone.utc)
    pred = Prediction(
        id="pred-123",
        device_id=test_device.device_id,
        sample_id="sample-123",
        timestamp_utc=now,
        prediction="ABNORMAL",
        prediction_probability=0.9,
        risk_level="HIGH",
        anomaly_label="YES",
        anomaly_score=-0.5,
        model_version="v1",
        created_at=now
    )
    db_session.add(pred)
    
    # Create sample that triggers CPU and Memory issues
    t1 = TelemetrySample(
        id="tel-1",
        sample_id="sample-123",
        device_id=test_device.device_id,
        timestamp_utc=now,
        cpu_usage_percent=95.0,
        memory_percent=95.0,
        disk_usage_percent=50.0,
        battery_percent=100.0,
    )
    db_session.add(t1)
    db_session.commit()
    
    # First evaluation
    evaluate_prediction_for_alerts(db_session, pred)
    
    # Should have 2 issues (CPU and Mem) + Anomaly (but anomaly doesn't duplicate CPU/Mem if it's separate, actually the detector creates Anomaly and CPU and Mem)
    issues = db_session.query(Issue).filter(Issue.device_id == test_device.device_id).all()
    assert len(issues) >= 2
    
    cpu_issue = next(i for i in issues if i.issue_type == "HIGH_CPU_USAGE")
    alerts = db_session.query(Alert).filter(Alert.issue_id == cpu_issue.id).all()
    assert len(alerts) == 1
    
    # Second evaluation with same conditions
    t2 = TelemetrySample(
        id="tel-2",
        sample_id="sample-124",
        device_id=test_device.device_id,
        timestamp_utc=now,
        cpu_usage_percent=96.0,
        memory_percent=96.0,
        disk_usage_percent=50.0,
        battery_percent=100.0,
    )
    db_session.add(t2)
    db_session.commit()
    
    pred2 = Prediction(
        id="pred-124",
        device_id=test_device.device_id,
        sample_id="sample-124",
        timestamp_utc=now,
        prediction="ABNORMAL",
        prediction_probability=0.9,
        risk_level="HIGH",
        anomaly_label="YES",
        anomaly_score=-0.5,
        model_version="v1",
        created_at=now
    )
    db_session.add(pred2)
    db_session.commit()
    
    evaluate_prediction_for_alerts(db_session, pred2)
    
    # Assert issues did not duplicate (count is the same)
    issues_after = db_session.query(Issue).filter(Issue.device_id == test_device.device_id).all()
    assert len(issues) == len(issues_after)
    
    # Assert CPU issue was updated
    db_session.refresh(cpu_issue)
    assert cpu_issue.current_value == 96.0
    
    # Assert no new alerts
    alerts_after = db_session.query(Alert).filter(Alert.issue_id == cpu_issue.id).all()
    assert len(alerts_after) == 1
