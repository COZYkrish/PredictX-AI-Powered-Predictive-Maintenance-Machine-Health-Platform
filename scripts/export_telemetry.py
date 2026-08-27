"""
Export real telemetry samples from PostgreSQL to CSV for ML retraining.
Exports all feature columns that the ML pipeline expects.
"""
import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pandas as pd
from pathlib import Path
from backend.db.session import SessionLocal
from backend.models.telemetry import TelemetrySample
from backend.models.device import Device

OUTPUT_PATH = Path("ml/data/real_telemetry.csv")

def export():
    db = SessionLocal()
    
    # Get the main real device (has hostname)
    devices = db.query(Device).filter(Device.hostname != None, Device.hostname != '').all()
    device_ids = [d.device_id for d in devices]
    print(f"Exporting telemetry for {len(device_ids)} device(s): {[d.hostname for d in devices]}")
    
    samples = (
        db.query(TelemetrySample)
        .filter(TelemetrySample.device_id.in_(device_ids))
        .order_by(TelemetrySample.timestamp_utc.asc())
        .all()
    )
    
    print(f"Total samples: {len(samples)}")
    
    rows = []
    for idx, s in enumerate(samples):
        rows.append({
            # Identity — validator requires sample_id and sequence_number
            "id": s.id,
            "sample_id": s.sample_id or s.id,
            "sequence_number": idx,
            "device_id": s.device_id,
            "timestamp_utc": s.timestamp_utc,
            "collection_duration_ms": s.collection_duration_ms,

            # CPU
            "cpu_usage_percent": s.cpu_usage_percent,
            "cpu_frequency_current_mhz": s.cpu_frequency_current_mhz,
            "cpu_temperature_c": s.cpu_temperature_c,

            # Memory
            "memory_percent": s.memory_percent,
            "memory_used_bytes": s.memory_used_bytes,
            "memory_available_bytes": s.memory_available_bytes,

            # Disk
            "disk_usage_percent": s.disk_usage_percent,
            "disk_read_bytes_per_sec": s.disk_read_bytes_per_sec,
            "disk_write_bytes_per_sec": s.disk_write_bytes_per_sec,

            # Network
            "network_upload_bytes_per_sec": s.network_upload_bytes_per_sec,
            "network_download_bytes_per_sec": s.network_download_bytes_per_sec,

            # System
            "process_count": s.process_count,
            "system_uptime_seconds": s.uptime_seconds,

            # Battery
            "battery_percent": s.battery_percent,
            "battery_plugged": s.battery_plugged,
        })
    
    df = pd.DataFrame(rows)
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUTPUT_PATH, index=False)
    
    print(f"Exported {len(df)} rows to {OUTPUT_PATH}")
    print()
    
    # Show class distribution preview with new thresholds
    cpu_warn = (df['cpu_usage_percent'] > 70).sum()
    mem_warn = (df['memory_percent'] > 75).sum()
    disk_warn = (df['disk_usage_percent'] > 85).sum()
    any_warn = ((df['cpu_usage_percent'] > 70) | (df['memory_percent'] > 75) | (df['disk_usage_percent'] > 85)).sum()
    
    print("=== PREDICTED LABEL DISTRIBUTION (with new thresholds) ===")
    print(f"Samples with CPU > 70%:    {cpu_warn:4d} / {len(df)}")
    print(f"Samples with Memory > 75%: {mem_warn:4d} / {len(df)}")
    print(f"Samples with Disk > 85%:   {disk_warn:4d} / {len(df)}")
    print(f"Total WARNING class:       {any_warn:4d} / {len(df)} ({any_warn/len(df)*100:.1f}%)")
    print(f"Total HEALTHY class:       {len(df)-any_warn:4d} / {len(df)} ({(len(df)-any_warn)/len(df)*100:.1f}%)")
    
    db.close()
    return df

if __name__ == "__main__":
    export()
