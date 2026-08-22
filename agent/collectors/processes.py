import psutil
import time
from datetime import datetime, timezone
from typing import Dict, Any, List

from .base import BaseCollector, CollectorResult

class ProcessesCollector(BaseCollector):
    name = "processes"

    def check_capability(self) -> List[Dict[str, Any]]:
        now = datetime.now(timezone.utc).isoformat()
        return [{
            "metric_name": "process_count",
            "category": "performance",
            "available": True,
            "source": "psutil",
            "last_checked_utc": now,
            "reason": ""
        }]

    def collect(self) -> CollectorResult:
        start_time = time.time()
        result = CollectorResult()
        
        try:
            # We don't store full process info per privacy rules, just count
            pids = psutil.pids()
            result.data["process_count"] = len(pids)
        except Exception as e:
            result.errors.append(f"Failed to get processes: {e}")
            result.status = "error"
            
        result.duration_ms = (time.time() - start_time) * 1000
        return result
