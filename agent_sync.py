import time
import requests
import uuid
import datetime
import json
from agent.main import PredictXAgent
from agent.config import config
from requests.auth import HTTPBasicAuth

# We'll use the API for PredictX backend
BASE_URL = "http://localhost:8000/api/v1"
INTERVAL = 2 # seconds

def sync():
    print("Starting PredictX Agent Sync to Backend...")
    agent = PredictXAgent()
    # agent.discover_capabilities() # Removed as it can cause deadlocks on startup
    
    sys_collector = agent.collectors[0] # SystemCollector is first
    sys_res = sys_collector.collect()
    
    device_data = {
        "device_id": config.device_id,
        "display_name": "PredictX Agent - " + config.device_id[:6],
        "model": "Windows Machine",
        "operating_system": sys_res.data.get("os", "Windows"),
        "os_version": sys_res.data.get("os_version", "10"),
        "architecture": sys_res.data.get("architecture", "AMD64"),
        "hostname": sys_res.data.get("hostname", "Local-PC"),
        "is_online": True
    }
    
    print(f"Registering device: {config.device_id}")
    # We can try to authenticate as admin to create it, or use a JWT
    # For now, let's just use the seed.py users to authenticate
    login_data = {
        "username": "admin@predictx.io",
        "password": "Admin123!"
    }
    
    # To run this properly, we first need to ensure seed data is there
    from scripts.seed import seed
    seed()

    # Login with retry in case backend is still starting
    max_retries = 30
    token = None
    for attempt in range(max_retries):
        try:
            resp = requests.post(f"{BASE_URL}/auth/login", data=login_data)
            if resp.status_code == 200:
                token = resp.json()["access_token"]
                break
            else:
                print(f"Login failed! Status: {resp.status_code}")
                return
        except requests.exceptions.ConnectionError:
            print(f"Backend not reachable, retrying in 2 seconds... ({attempt+1}/{max_retries})")
            time.sleep(2)
            
    if not token:
        print("Could not connect to backend.")
        return
    headers = {"Authorization": f"Bearer {token}"}
    
    # Register Device
    reg_resp = requests.post(f"{BASE_URL}/devices/", json=device_data, headers=headers)
    if reg_resp.status_code == 400: # 400 = already registered
        print("Device already registered, updating...")
        requests.put(f"{BASE_URL}/devices/{config.device_id}", json=device_data, headers=headers)
    elif reg_resp.status_code != 200:
        print("Failed to register device:", reg_resp.text)
    
    print("Agent Sync is running. Press Ctrl+C to stop.")
    while True:
        try:
            sample = agent.collect_sample()
            
            # Map TelemetrySample to TelemetryIn schema
            payload = {
                "samples": [
                    {
                        "sample_id": sample.sample_id,
                        "device_id": config.device_id,
                        "timestamp_utc": sample.timestamp_utc.isoformat(),
                        "sequence_number": sample.sequence_number,
                        "schema_version": sample.schema_version,
                        "agent_version": sample.agent_version,
                        "collection_duration_ms": int(sample.collection_duration_ms) if sample.collection_duration_ms else 0,
                        
                        "cpu_usage_percent": sample.performance.cpu_usage_percent,
                        "cpu_frequency_current_mhz": sample.performance.cpu_frequency_current_mhz,
                        
                        "memory_percent": sample.performance.memory_percent,
                        "memory_used_bytes": sample.performance.memory_used_bytes,
                        "memory_available_bytes": sample.performance.memory_available_bytes,
                        
                        "disk_usage_percent": sample.performance.disk_usage_percent,
                        "uptime_seconds": sample.performance.uptime_seconds,
                    }
                ]
            }
            
            res = requests.post(f"{BASE_URL}/telemetry/batch", json=payload, headers=headers)
            print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] Sent telemetry -> Status {res.status_code}")
            
        except Exception as e:
            print(f"Error syncing telemetry: {e}")
            
        time.sleep(INTERVAL)

if __name__ == "__main__":
    sync()
