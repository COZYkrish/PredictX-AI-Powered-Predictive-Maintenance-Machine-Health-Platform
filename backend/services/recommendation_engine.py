import logging
from sqlalchemy.orm import Session
from backend.models.issue import Issue

logger = logging.getLogger(__name__)

def generate_recommendation(db: Session, issue: Issue) -> None:
    """
    Map issue types to specific, actionable resolution steps.
    Provides verification targets (e.g., Target: Memory < 75%).
    """
    
    if issue.issue_type == "HIGH_CPU_USAGE":
        issue.recommendation = (
            "1. Open Task Manager.\n"
            "2. Sort by CPU.\n"
            "3. Identify sustained high-CPU processes.\n"
            "4. Close unnecessary applications.\n"
            "5. Wait for utilization to settle.\n"
            "6. Start verification."
        )
        issue.verification_metric = "cpu_usage_percent"
        issue.verification_operator = "<"
        issue.verification_target = 75.0
        issue.verification_duration_seconds = 60
        issue.verification_required_consecutive_samples = 3
        
    elif issue.issue_type == "MEMORY_PRESSURE":
        issue.recommendation = (
            "1. Open Windows Task Manager.\n"
            "2. Open Processes.\n"
            "3. Sort by Memory.\n"
            "4. Identify the largest consumers.\n"
            "5. Close applications you do not need.\n"
            "6. Wait 1-2 minutes.\n"
            "7. Return to PredictX.\n"
            "8. Start verification."
        )
        issue.verification_metric = "memory_percent"
        issue.verification_operator = "<"
        issue.verification_target = 75.0
        issue.verification_duration_seconds = 120
        issue.verification_required_consecutive_samples = 3
        
    elif "DISK_CAPACITY" in issue.issue_type:
        issue.recommendation = (
            "1. Open Windows Storage settings.\n"
            "2. Review large files/applications.\n"
            "3. Remove safe temporary data.\n"
            "4. Empty Recycle Bin if appropriate.\n"
            "5. Recheck storage capacity and Start verification."
        )
        issue.verification_metric = "disk_usage_percent"
        issue.verification_operator = "<"
        issue.verification_target = 80.0
        issue.verification_duration_seconds = 30
        issue.verification_required_consecutive_samples = 1
        
    elif "BATTERY" in issue.issue_type:
        issue.recommendation = (
            "1. Connect the device to a power source.\n"
            "2. Start verification."
        )
        issue.verification_metric = "battery_plugged"
        issue.verification_operator = "=="
        issue.verification_target = 1.0  # representing True
        issue.verification_duration_seconds = 10
        issue.verification_required_consecutive_samples = 1

    elif issue.issue_type == "ANOMALY_DETECTED":
        issue.recommendation = (
            "1. Review recent telemetry.\n"
            "2. Compare current behavior with historical baseline.\n"
            "3. Review CPU/RAM/disk/network changes.\n"
            "4. Review process activity where available.\n"
            "5. Check recent software/system changes.\n"
            "6. Continue monitoring.\n"
            "7. Start verification."
        )
        issue.verification_metric = "anomaly_label"
        issue.verification_operator = "=="
        issue.verification_target = 0.0 # representing "NO"
        issue.verification_duration_seconds = 60
        issue.verification_required_consecutive_samples = 2
        
    else:
        issue.recommendation = (
            "1. Review active applications.\n"
            "2. Reduce system workload.\n"
            "3. Start verification."
        )
        issue.verification_metric = None

    # We do not call db.commit() here; the caller manages the transaction.
