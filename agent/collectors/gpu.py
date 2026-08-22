import time
from datetime import datetime, timezone
from typing import Dict, Any, List

from .base import BaseCollector, CollectorResult
from ..windows.cim import query_cim

class GpuCollector(BaseCollector):
    name = "gpu"

    def check_capability(self) -> List[Dict[str, Any]]:
        caps = []
        now = datetime.now(timezone.utc).isoformat()
        
        # Level 1: GPU Identity (Can we get it from CIM?)
        try:
            controllers = query_cim("root\\cimv2", "SELECT * FROM Win32_VideoController")
            available = len(controllers) > 0
            caps.append({
                "metric_name": "gpu_identity",
                "category": "health",
                "available": available,
                "source": "wmi_VideoController",
                "last_checked_utc": now,
                "reason": "" if available else "No Win32_VideoController found"
            })
        except Exception as e:
            caps.append({
                "metric_name": "gpu_identity",
                "category": "health",
                "available": False,
                "source": "wmi_VideoController",
                "last_checked_utc": now,
                "reason": str(e)
            })
            
        # We assume usage and temp are unavailable natively without external libs for Phase 1.
        # Fallback will return None and mark partial/unavailable.
        for metric in ["gpu_usage_percent", "gpu_temperature_c", "gpu_memory_used_bytes", "gpu_memory_total_bytes"]:
            caps.append({
                "metric_name": metric,
                "category": "health",
                "available": False,
                "source": "native",
                "last_checked_utc": now,
                "reason": "Hardware specific, not implemented natively in Phase 1"
            })
            
        return caps

    def collect(self) -> CollectorResult:
        start_time = time.time()
        result = CollectorResult()
        
        # We just return partial since most GPU metrics are unavailable without vendor SDKs
        result.status = "partial"
        result.warnings.append("GPU telemetry relies on vendor SDKs which are not implemented in Phase 1 natively.")
        
        result.duration_ms = (time.time() - start_time) * 1000
        return result
