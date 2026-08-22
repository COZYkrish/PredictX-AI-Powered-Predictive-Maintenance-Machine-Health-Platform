import psutil
import time
from datetime import datetime, timezone
from typing import Dict, Any, List

from .base import BaseCollector, CollectorResult
from .rate_calculator import RateCalculator

class NetworkCollector(BaseCollector):
    name = "network"
    
    def __init__(self, rate_calculator: RateCalculator):
        self.rate_calc = rate_calculator

    def check_capability(self) -> List[Dict[str, Any]]:
        caps = []
        now = datetime.now(timezone.utc).isoformat()
        
        try:
            psutil.net_io_counters()
            for metric in ["network_upload_bytes_per_sec", "network_download_bytes_per_sec"]:
                caps.append({
                    "metric_name": metric,
                    "category": "performance",
                    "available": True,
                    "source": "psutil",
                    "last_checked_utc": now,
                    "reason": ""
                })
        except Exception as e:
            for metric in ["network_upload_bytes_per_sec", "network_download_bytes_per_sec"]:
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
            io = psutil.net_io_counters()
            if io:
                u_rate = self.rate_calc.calculate_rate("net_up", io.bytes_sent)
                d_rate = self.rate_calc.calculate_rate("net_down", io.bytes_recv)
                if u_rate is not None:
                    result.data["network_upload_bytes_per_sec"] = u_rate
                if d_rate is not None:
                    result.data["network_download_bytes_per_sec"] = d_rate
        except Exception as e:
            result.errors.append(f"Failed to get network IO: {e}")
            result.status = "error"
            
        result.duration_ms = (time.time() - start_time) * 1000
        return result
