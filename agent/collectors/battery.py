import psutil
import time
from datetime import datetime, timezone
from typing import Dict, Any, List

from .base import BaseCollector, CollectorResult

class BatteryCollector(BaseCollector):
    name = "battery"

    def check_capability(self) -> List[Dict[str, Any]]:
        caps = []
        now = datetime.now(timezone.utc).isoformat()
        
        try:
            battery = psutil.sensors_battery()
            available = battery is not None
            caps.append({
                "metric_name": "battery_percent",
                "category": "health",
                "available": available,
                "source": "psutil",
                "last_checked_utc": now,
                "reason": "" if available else "No battery detected (desktop?)"
            })
        except Exception as e:
            caps.append({
                "metric_name": "battery_percent",
                "category": "health",
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
            battery = psutil.sensors_battery()
            if battery:
                result.data["battery_percent"] = battery.percent
            else:
                result.status = "unavailable"
        except Exception as e:
            result.errors.append(f"Failed to get battery: {e}")
            result.status = "error"
            
        result.duration_ms = (time.time() - start_time) * 1000
        return result
