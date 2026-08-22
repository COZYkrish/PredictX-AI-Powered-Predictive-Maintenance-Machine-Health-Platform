import time
from datetime import datetime, timezone
from typing import Dict, Any, List

from .base import BaseCollector, CollectorResult
from ..windows.cim import query_cim

class TemperatureCollector(BaseCollector):
    name = "temperature"

    def check_capability(self) -> List[Dict[str, Any]]:
        caps = []
        now = datetime.now(timezone.utc).isoformat()
        
        try:
            # MSAcpi_ThermalZoneTemperature requires admin and often returns generic/fake data 
            # Win32_TemperatureProbe is almost always empty.
            # Thus, typically false.
            zones = query_cim("root\\wmi", "SELECT * FROM MSAcpi_ThermalZoneTemperature")
            available = len(zones) > 0
            caps.append({
                "metric_name": "cpu_temperature_c",
                "category": "health",
                "available": available,
                "source": "wmi_MSAcpi",
                "last_checked_utc": now,
                "reason": "" if available else "No thermal zones exposed by driver"
            })
        except Exception as e:
            caps.append({
                "metric_name": "cpu_temperature_c",
                "category": "health",
                "available": False,
                "source": "wmi_MSAcpi",
                "last_checked_utc": now,
                "reason": str(e)
            })
            
        caps.append({
            "metric_name": "storage_temperature_c",
            "category": "health",
            "available": False,
            "source": "native",
            "last_checked_utc": now,
            "reason": "SMART not natively available without admin/smartctl"
        })
            
        return caps

    def collect(self) -> CollectorResult:
        start_time = time.time()
        result = CollectorResult()
        
        try:
            zones = query_cim("root\\wmi", "SELECT * FROM MSAcpi_ThermalZoneTemperature")
            if zones:
                # Value is in tenths of degrees Kelvin
                tk = zones[0].CurrentTemperature
                if tk:
                    tc = (tk / 10.0) - 273.15
                    if 0 < tc < 150: # basic sanity check
                        result.data["cpu_temperature_c"] = tc
            else:
                result.status = "unavailable"
        except Exception as e:
            result.errors.append(f"Failed to get temperature: {e}")
            result.status = "unavailable"
            
        result.duration_ms = (time.time() - start_time) * 1000
        return result
