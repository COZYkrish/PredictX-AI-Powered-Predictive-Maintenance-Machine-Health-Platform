import argparse
import sys
import uuid
from datetime import datetime, timezone
import time

from .config import config
from .logger import logger
from .scheduler import Scheduler
from .models.telemetry import TelemetrySample, PerformanceTelemetry, HealthTelemetry
from .storage.sqlite_store import SQLiteStore
from .storage.csv_store import export_to_csv
from .storage.json_store import to_json
from .collectors import (
    RateCalculator, CpuCollector, MemoryCollector, DiskCollector,
    NetworkCollector, BatteryCollector, GpuCollector, TemperatureCollector,
    ProcessesCollector, SystemCollector
)

class PredictXAgent:
    def __init__(self):
        self.store = SQLiteStore(config.db_path)
        self.rate_calc = RateCalculator()
        
        # Initialize collectors
        self.collectors = [
            SystemCollector(),
            CpuCollector(),
            MemoryCollector(),
            DiskCollector(self.rate_calc),
            NetworkCollector(self.rate_calc),
            BatteryCollector(),
            GpuCollector(),
            TemperatureCollector(),
            ProcessesCollector()
        ]
        
        self.sequence_number = 1
        
    def discover_capabilities(self):
        logger.info("Discovering device capabilities...")
        for c in self.collectors:
            try:
                caps = c.check_capability()
                for cap in caps:
                    self.store.save_capability(config.device_id, cap)
            except Exception as e:
                logger.error(f"Error checking capabilities for {c.name}: {e}")

    def collect_sample(self) -> TelemetrySample:
        sample_id = str(uuid.uuid4())
        start_time = time.time()
        
        perf = PerformanceTelemetry()
        health = HealthTelemetry()
        
        successful = 0
        failed = 0
        unavailable = 0
        partial = 0
        
        for c in self.collectors:
            try:
                res = c.collect()
                if res.status == "success":
                    successful += 1
                elif res.status == "partial":
                    partial += 1
                elif res.status == "unavailable":
                    unavailable += 1
                else:
                    failed += 1
                    
                for k, v in res.data.items():
                    # Set on perf or health based on schema
                    if hasattr(perf, k):
                        setattr(perf, k, v)
                    elif hasattr(health, k):
                        setattr(health, k, v)
                        
                for err in res.errors:
                    logger.error(f"Collector {c.name} error: {err}")
                    self.store.save_collector_status(datetime.now(timezone.utc).isoformat(), c.name, "error", err)
                    
            except Exception as e:
                logger.error(f"Collector {c.name} crashed: {e}")
                failed += 1
                self.store.save_collector_status(datetime.now(timezone.utc).isoformat(), c.name, "error", str(e))
                
        duration = (time.time() - start_time) * 1000
        
        # Update device info if available
        device_data = {
            "device_id": config.device_id,
            "agent_version": config.agent_version,
            "first_seen_utc": datetime.now(timezone.utc).isoformat() # SQLite will handle ignore if exists
        }
        if hasattr(perf, "os"):
            # They are in res.data but not in Telemetry models, let's extract them from system collector
            pass # Handle better below

        sample = TelemetrySample(
            schema_version=config.schema_version,
            agent_version=config.agent_version,
            sample_id=sample_id,
            sequence_number=self.sequence_number,
            timestamp_utc=datetime.now(timezone.utc),
            device_id=config.device_id,
            collection_duration_ms=duration,
            performance=perf,
            health=health
        )
        
        self.sequence_number += 1
        return sample

def main():
    parser = argparse.ArgumentParser(description="PredictX Windows Agent - Phase 1")
    parser.add_argument("--once", action="store_true", help="Collect one sample and exit")
    parser.add_argument("--interval", type=int, help="Continuous collection interval in seconds (min 1)")
    parser.add_argument("--diagnostic", action="store_true", help="Run diagnostic capability check")
    parser.add_argument("--json", action="store_true", help="Output latest sample as JSON")
    parser.add_argument("--export-csv", action="store_true", help="Export database to CSV")
    
    args = parser.parse_args()
    agent = PredictXAgent()
    
    if args.export_csv:
        export_to_csv(config.db_path, "data/exports")
        return
        
    if args.diagnostic:
        print("=================================================")
        print("PredictX Windows Agent - Diagnostic Mode")
        print("=================================================")
        print(f"Device ID: {config.device_id}")
        print(f"Agent Version: {config.agent_version}")
        print("\nCapabilities:")
        for c in agent.collectors:
            try:
                caps = c.check_capability()
                for cap in caps:
                    status = "AVAILABLE" if cap['available'] else "UNAVAILABLE"
                    print(f"{cap['metric_name']:<30} {status}")
                    if not cap['available'] and cap.get('reason'):
                        print(f"  Reason: {cap['reason']}")
            except Exception as e:
                print(f"{c.name}: ERROR - {e}")
        return
        
    # Standard startup discovery
    agent.discover_capabilities()
    
    # Run once to get baseline for device and system info
    sys_collector = agent.collectors[0]
    sys_res = sys_collector.collect()
    device_data = {
        "device_id": config.device_id,
        "agent_version": config.agent_version,
        "last_seen_utc": datetime.now(timezone.utc).isoformat(),
        "first_seen_utc": datetime.now(timezone.utc).isoformat()
    }
    if "os" in sys_res.data:
        device_data["operating_system"] = sys_res.data["os"]
        device_data["os_version"] = sys_res.data["os_version"]
        device_data["architecture"] = sys_res.data["architecture"]
        device_data["hostname"] = sys_res.data["hostname"]
    agent.store.update_device(device_data)

    if args.once:
        sample = agent.collect_sample()
        agent.store.save_sample(sample)
        print("Collected and saved one sample.")
        return
        
    if args.json:
        sample = agent.collect_sample()
        print(to_json(sample))
        return
        
    if args.interval:
        if args.interval < 1:
            print("Error: Minimum allowed collection interval is 1 second")
            sys.exit(1)
            
        scheduler = Scheduler(args.interval)
        def task():
            s = agent.collect_sample()
            agent.store.save_sample(s)
            
            # Real-time console update
            print("\033[H\033[J", end="") # Clear console
            print("=================================================")
            print("PredictX Windows Agent")
            print("=================================================")
            print(f"Device: {config.device_id}")
            print(f"CPU: {s.performance.cpu_usage_percent or 0}%")
            print(f"RAM: {s.performance.memory_percent or 0}%")
            print(f"Disk: {s.performance.disk_usage_percent or 0}%")
            print(f"Last Updated: {s.timestamp_utc.isoformat()}Z")
            
        scheduler.run(task)
        return
        
    parser.print_help()

if __name__ == "__main__":
    main()
