import psutil
import time
from datetime import datetime, timezone
from typing import Dict, Any, List

from .base import BaseCollector, CollectorResult
from ..windows.performance_counters import query_counter

class CpuCollector(BaseCollector):
    name = "cpu"

    def check_capability(self) -> List[Dict[str, Any]]:
        caps = []
        now = datetime.now(timezone.utc).isoformat()
        
        # Usage
        try:
            psutil.cpu_percent()
            caps.append({
                "metric_name": "cpu_usage_percent",
                "category": "performance",
                "available": True,
                "source": "psutil",
                "last_checked_utc": now,
                "reason": ""
            })
        except Exception as e:
            caps.append({
                "metric_name": "cpu_usage_percent",
                "category": "performance",
                "available": False,
                "source": "psutil",
                "last_checked_utc": now,
                "reason": str(e)
            })
            
        # Frequency
        try:
            freq = psutil.cpu_freq()
            caps.append({
                "metric_name": "cpu_frequency_current_mhz",
                "category": "performance",
                "available": freq is not None,
                "source": "psutil",
                "last_checked_utc": now,
                "reason": "" if freq else "psutil.cpu_freq returned None"
            })
        except Exception as e:
            caps.append({
                "metric_name": "cpu_frequency_current_mhz",
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
            result.data["cpu_usage_percent"] = psutil.cpu_percent(interval=None)
        except Exception as e:
            result.errors.append(f"Failed to get CPU usage: {e}")
            result.status = "partial"
            
        try:
            freq = psutil.cpu_freq()
            if freq:
                result.data["cpu_frequency_current_mhz"] = freq.current
        except Exception as e:
            result.errors.append(f"Failed to get CPU freq: {e}")
            result.status = "partial"
            
        if not result.data and result.errors:
            result.status = "error"
            
        result.duration_ms = (time.time() - start_time) * 1000
        return result
