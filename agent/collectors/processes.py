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
        }, {
            "metric_name": "top_processes",
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
            pids = psutil.pids()
            result.data["process_count"] = len(pids)
            
            processes = []
            for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
                try:
                    info = proc.info
                    if info['name'] and info['name'].lower() not in ["system idle process", "system", "registry"]:
                        processes.append({
                            "process_name": info['name'],
                            "pid": info['pid'],
                            "cpu_percent": info['cpu_percent'] or 0.0,
                            "memory_percent": info['memory_percent'] or 0.0
                        })
                except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                    continue
                    
            top_cpu = sorted(processes, key=lambda p: p["cpu_percent"], reverse=True)[:5]
            top_mem = sorted(processes, key=lambda p: p["memory_percent"], reverse=True)[:5]
            combined = {p["pid"]: p for p in (top_cpu + top_mem)}
            
            result.data["top_processes"] = list(combined.values())

        except Exception as e:
            result.errors.append(f"Failed to get processes: {e}")
            result.status = "error"
            
        result.duration_ms = (time.time() - start_time) * 1000
        return result
