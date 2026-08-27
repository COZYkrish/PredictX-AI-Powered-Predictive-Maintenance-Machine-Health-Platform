import logging
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import statistics

from backend.models.issue import Issue, EvidenceLevelEnum
from backend.models.telemetry import TelemetrySample

logger = logging.getLogger(__name__)

def investigate_issue(db: Session, issue: Issue, telemetry_window: List[TelemetrySample]) -> None:
    """
    Take a new Issue and historical telemetry to generate an evidence-based diagnosis.
    Sets likely_causes, evidence_level, and updates the explanation with baseline comparison.
    """
    if not telemetry_window:
        issue.evidence_level = EvidenceLevelEnum.UNKNOWN
        return

    metric_attr = ""
    if issue.issue_type == "HIGH_CPU_USAGE":
        metric_attr = "cpu_usage_percent"
    elif issue.issue_type == "MEMORY_PRESSURE":
        metric_attr = "memory_percent"
    elif "DISK" in issue.issue_type:
        metric_attr = "disk_usage_percent"
    elif "BATTERY" in issue.issue_type:
        metric_attr = "battery_percent"

    # 1. Baseline Comparison
    if metric_attr:
        values = [getattr(t, metric_attr) for t in telemetry_window if getattr(t, metric_attr) is not None]
        if values:
            baseline = sum(values) / len(values)
            peak = max(values)
            issue.baseline_value = baseline
            diff = issue.current_value - baseline
            
            # Append baseline comparison to explanation
            issue.explanation += (
                f"\n\nEVIDENCE:\n"
                f"Current: {issue.current_value:.1f}%\n"
                f"Peak: {peak:.1f}%\n"
                f"Recent Baseline: {baseline:.1f}%\n"
                f"Difference: {diff:+.1f} percentage points"
            )

    # 2. Likely Causes & Evidence Level
    causes = []
    evidence_level = EvidenceLevelEnum.UNKNOWN
    
    # Extract top processes if available
    latest_telemetry = telemetry_window[-1] if telemetry_window else None
    top_processes = latest_telemetry.top_processes if latest_telemetry and getattr(latest_telemetry, "top_processes", None) else None
    
    if issue.issue_type == "HIGH_CPU_USAGE":
        if top_processes:
            cpu_procs = sorted(top_processes, key=lambda p: p.get('cpu_percent', 0), reverse=True)[:3]
            proc_details = "\n".join([f"{p.get('process_name', 'Unknown')}: {p.get('cpu_percent', 0)}%" for p in cpu_procs if p.get('cpu_percent', 0) > 5])
            if proc_details:
                issue.explanation += f"\n\nTOP CPU CONSUMERS:\n{proc_details}"
                causes.append("High CPU consumption by specific processes")
                evidence_level = EvidenceLevelEnum.CONFIRMED_BY_TELEMETRY
            else:
                causes.append("Intensive application workload")
                evidence_level = EvidenceLevelEnum.POSSIBLE
        else:
            process_counts = [t.process_count for t in telemetry_window if t.process_count is not None]
            if process_counts and max(process_counts) > 200:
                causes.append("High number of background processes")
                evidence_level = EvidenceLevelEnum.SUPPORTED
            else:
                causes.append("Intensive application workload")
                evidence_level = EvidenceLevelEnum.POSSIBLE
            
    elif issue.issue_type == "MEMORY_PRESSURE":
        if top_processes:
            mem_procs = sorted(top_processes, key=lambda p: p.get('memory_percent', 0), reverse=True)[:3]
            proc_details = "\n".join([f"{p.get('process_name', 'Unknown')}: {p.get('memory_percent', 0)}%" for p in mem_procs if p.get('memory_percent', 0) > 5])
            if proc_details:
                issue.explanation += f"\n\nTOP MEMORY CONSUMERS:\n{proc_details}"
                causes.append("High memory consumption by specific processes")
                evidence_level = EvidenceLevelEnum.CONFIRMED_BY_TELEMETRY
            else:
                causes.append("High-memory application (e.g. Browser, IDE)")
                causes.append("Potential memory leak in active process")
                evidence_level = EvidenceLevelEnum.POSSIBLE
        else:
            process_counts = [t.process_count for t in telemetry_window if t.process_count is not None]
            if process_counts and max(process_counts) > 200:
                causes.append("Numerous background processes consuming RAM")
                evidence_level = EvidenceLevelEnum.SUPPORTED
            else:
                causes.append("High-memory application (e.g. Browser, IDE)")
                causes.append("Potential memory leak in active process")
                evidence_level = EvidenceLevelEnum.POSSIBLE
            
    elif issue.issue_type == "DISK_CAPACITY_CRITICAL":
        causes.append("Large temporary files or application data")
        causes.append("Log file accumulation")
        evidence_level = EvidenceLevelEnum.CONFIRMED_BY_TELEMETRY

    elif issue.issue_type == "BATTERY_CRITICAL":
        causes.append("Device unplugged with heavy workload")
        evidence_level = EvidenceLevelEnum.CONFIRMED_BY_TELEMETRY
        
    elif issue.issue_type in ("ANOMALY_DETECTED", "ABNORMAL_SYSTEM_BEHAVIOR"):
        # Build causes from actual telemetry values at detection time
        latest = telemetry_window[-1] if telemetry_window else None
        if latest:
            cpu = latest.cpu_usage_percent
            mem = latest.memory_percent
            disk = latest.disk_usage_percent

            specific_causes = []
            if cpu is not None and cpu > 70:
                specific_causes.append(f"Elevated CPU usage at detection: {cpu:.1f}%")
            if mem is not None and mem > 75:
                specific_causes.append(f"Elevated memory usage at detection: {mem:.1f}%")
            if disk is not None and disk > 85:
                specific_causes.append(f"High disk usage at detection: {disk:.1f}%")

            # Top processes
            procs = getattr(latest, "top_processes", None) or []
            cpu_procs = sorted(procs, key=lambda p: p.get("cpu_percent", 0), reverse=True)
            mem_procs = sorted(procs, key=lambda p: p.get("memory_percent", 0), reverse=True)

            heavy_cpu = [p for p in cpu_procs[:3] if p.get("cpu_percent", 0) > 5.0]
            heavy_mem = [p for p in mem_procs[:3] if p.get("memory_percent", 0) > 3.0]

            if heavy_cpu:
                names = ", ".join(p.get("process_name", "Unknown") for p in heavy_cpu)
                specific_causes.append(f"High-CPU processes at detection: {names}")
            if heavy_mem:
                names = ", ".join(p.get("process_name", "Unknown") for p in heavy_mem)
                specific_causes.append(f"High-memory processes at detection: {names}")

            if specific_causes:
                causes.extend(specific_causes)
                evidence_level = EvidenceLevelEnum.SUPPORTED

                # Add telemetry snapshot to explanation
                snap_lines = ["\n\nSYSTEM SNAPSHOT AT DETECTION:"]
                if cpu is not None:
                    snap_lines.append(f"CPU:    {cpu:.1f}%")
                if mem is not None:
                    snap_lines.append(f"Memory: {mem:.1f}%")
                if disk is not None:
                    snap_lines.append(f"Disk:   {disk:.1f}%")
                if heavy_cpu:
                    snap_lines.append("Top CPU: " + ", ".join(
                        f"{p.get('process_name','?')} ({p.get('cpu_percent',0):.1f}%)" for p in heavy_cpu
                    ))
                if heavy_mem:
                    snap_lines.append("Top RAM: " + ", ".join(
                        f"{p.get('process_name','?')} ({p.get('memory_percent',0):.1f}%)" for p in heavy_mem
                    ))
                if issue.explanation:
                    issue.explanation += "\n".join(snap_lines)
                else:
                    issue.explanation = "\n".join(snap_lines)
            else:
                # Metrics were all normal at detection — truly subtle anomaly
                causes.append("Unusual pattern in combined metrics (subtle — no single metric spiked)")
                causes.append("Possible brief workload burst that already subsided")
                evidence_level = EvidenceLevelEnum.POSSIBLE
        else:
            causes.append("Unusual workload pattern")
            causes.append("Unexpected background task (e.g., update, backup)")
            evidence_level = EvidenceLevelEnum.SUPPORTED
        
    else:
        causes.append("System resource limits reached")
        evidence_level = EvidenceLevelEnum.POSSIBLE

    issue.likely_causes = causes
    issue.evidence_level = evidence_level
    
    # We don't call db.commit() here; the caller (alert_service) manages the transaction.
