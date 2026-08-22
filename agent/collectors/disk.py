import psutil
import time
from datetime import datetime, timezone
from typing import Dict, Any, List

from .base import BaseCollector, CollectorResult
from .rate_calculator import RateCalculator

class DiskCollector(BaseCollector):
    name = "disk"
    
    def __init__(self, rate_calculator: RateCalculator):
        self.rate_calc = rate_calculator

    def check_capability(self) -> List[Dict[str, Any]]:
        caps = []
        now = datetime.now(timezone.utc).isoformat()
        
        try:
            psutil.disk_usage(psutil.disk_partitions()[0].mountpoint)
            caps.append({
                "metric_name": "disk_usage_percent",
                "category": "performance",
                "available": True,
                "source": "psutil",
                "last_checked_utc": now,
                "reason": ""
            })
        except Exception as e:
            caps.append({
                "metric_name": "disk_usage_percent",
                "category": "performance",
                "available": False,
                "source": "psutil",
                "last_checked_utc": now,
                "reason": str(e)
            })
            
        try:
            psutil.disk_io_counters()
            for metric in ["disk_read_bytes_per_sec", "disk_write_bytes_per_sec"]:
                caps.append({
                    "metric_name": metric,
                    "category": "performance",
                    "available": True,
                    "source": "psutil",
                    "last_checked_utc": now,
                    "reason": ""
                })
        except Exception as e:
            for metric in ["disk_read_bytes_per_sec", "disk_write_bytes_per_sec"]:
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
            # We will use the system drive (usually C:\) for overall usage for Phase 1
            # Or get max usage across all drives
            partitions = psutil.disk_partitions()
            max_usage = 0.0
            for p in partitions:
                if 'cdrom' in p.opts or p.fstype == '':
                    continue
                try:
                    usage = psutil.disk_usage(p.mountpoint).percent
                    max_usage = max(max_usage, usage)
                except Exception:
                    pass
            result.data["disk_usage_percent"] = max_usage
        except Exception as e:
            result.errors.append(f"Failed to get disk usage: {e}")
            result.status = "partial"
            
        try:
            io = psutil.disk_io_counters()
            if io:
                r_rate = self.rate_calc.calculate_rate("disk_read", io.read_bytes)
                w_rate = self.rate_calc.calculate_rate("disk_write", io.write_bytes)
                if r_rate is not None:
                    result.data["disk_read_bytes_per_sec"] = r_rate
                if w_rate is not None:
                    result.data["disk_write_bytes_per_sec"] = w_rate
        except Exception as e:
            result.errors.append(f"Failed to get disk IO: {e}")
            result.status = "partial"
            
        if not result.data and result.errors:
            result.status = "error"
            
        result.duration_ms = (time.time() - start_time) * 1000
        return result
