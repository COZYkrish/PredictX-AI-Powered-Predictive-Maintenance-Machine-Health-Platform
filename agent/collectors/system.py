import time
import platform
from datetime import datetime, timezone
from typing import Dict, Any, List
import psutil

from .base import BaseCollector, CollectorResult

class SystemCollector(BaseCollector):
    name = "system"

    def check_capability(self) -> List[Dict[str, Any]]:
        now = datetime.now(timezone.utc).isoformat()
        return [{
            "metric_name": "uptime_seconds",
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
            boot_time = psutil.boot_time()
            uptime = time.time() - boot_time
            result.data["uptime_seconds"] = max(0.0, uptime)
            
            # System info for device record
            result.data["os"] = platform.system()
            result.data["os_version"] = platform.version()
            result.data["architecture"] = platform.machine()
            result.data["hostname"] = platform.node()
        except Exception as e:
            result.errors.append(f"Failed to get system info: {e}")
            result.status = "error"
            
        result.duration_ms = (time.time() - start_time) * 1000
        return result
