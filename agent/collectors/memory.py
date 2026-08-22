import psutil
import time
from datetime import datetime, timezone
from typing import Dict, Any, List

from .base import BaseCollector, CollectorResult

class MemoryCollector(BaseCollector):
    name = "memory"

    def check_capability(self) -> List[Dict[str, Any]]:
        caps = []
        now = datetime.now(timezone.utc).isoformat()
        
        try:
            psutil.virtual_memory()
            for metric in ["memory_percent", "memory_used_bytes", "memory_available_bytes"]:
                caps.append({
                    "metric_name": metric,
                    "category": "performance",
                    "available": True,
                    "source": "psutil",
                    "last_checked_utc": now,
                    "reason": ""
                })
        except Exception as e:
            for metric in ["memory_percent", "memory_used_bytes", "memory_available_bytes"]:
                caps.append({
                    "metric_name": metric,
                    "category": "performance",
                    "available": False,
                    "source": "psutil",
                    "last_checked_utc": now,
                    "reason": str(e)
                })
        return caps

    def collect(self) -> CollectorResult:
        start_time = time.time()
        result = CollectorResult()
        
        try:
            mem = psutil.virtual_memory()
            result.data["memory_percent"] = mem.percent
            result.data["memory_used_bytes"] = mem.used
            result.data["memory_available_bytes"] = mem.available
        except Exception as e:
            result.errors.append(f"Failed to get memory: {e}")
            result.status = "error"
            
        result.duration_ms = (time.time() - start_time) * 1000
        return result
