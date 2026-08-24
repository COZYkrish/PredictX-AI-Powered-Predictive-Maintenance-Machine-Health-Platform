"""
agent_sync.py — Bridges the local Windows agent to the PredictX backend.

Changes:
- Sends capability flags after device registration based on telemetry field availability.
- Preserves all telemetry fields (process_count, battery, disk I/O, network, etc.)
- Sends every 10s (not every 2s) to avoid overwhelming prediction jobs.
"""

import time
import requests
import datetime
from agent.main import PredictXAgent
from agent.config import config

BASE_URL = "http://localhost:8000/api/v1"
INTERVAL = 10  # seconds between telemetry uploads

# ── Capability definitions ────────────────────────────────────────────────────
# Maps field names to human-readable capability names. Availability is
# determined by whether the field is non-None in the first telemetry sample.
CAPABILITY_DEFINITIONS = [
    ("cpu_usage_percent",          "cpu_usage",          "performance"),
    ("memory_percent",             "memory",             "performance"),
    ("disk_usage_percent",         "disk_capacity",      "storage"),
    ("disk_read_bytes_per_sec",    "disk_io",            "storage"),
    ("disk_write_bytes_per_sec",   "disk_io_write",      "storage"),
    ("network_upload_bytes_per_sec",   "network_upload",     "network"),
    ("network_download_bytes_per_sec", "network_download",   "network"),
    ("battery_percent",            "battery",            "power"),
    ("gpu_usage_percent",          "gpu_usage",          "gpu"),
    ("cpu_temperature_c",          "cpu_temperature",    "thermal"),
    ("gpu_temperature_c",          "gpu_temperature",    "thermal"),
    ("process_count",              "process_count",      "system"),
    ("uptime_seconds",             "uptime",             "system"),
]


def _get_token(login_data: dict) -> str | None:
    """Login with retry and return bearer token."""
    max_retries = 30
    for attempt in range(max_retries):
        try:
            resp = requests.post(f"{BASE_URL}/auth/login", data=login_data, timeout=5)
            if resp.status_code == 200:
                return resp.json()["access_token"]
            else:
                print(f"Login failed — status {resp.status_code}: {resp.text[:100]}")
                return None
        except requests.exceptions.ConnectionError:
            print(f"Backend not reachable, retrying... ({attempt + 1}/{max_retries})")
            time.sleep(2)
    print("Could not connect to backend after retries.")
    return None


def _post_capabilities(headers: dict, sample, device_id: str):
    """
    Derive capabilities from actual telemetry fields and POST them to backend.
    A field is AVAILABLE if it has a non-None value in the latest sample.
    """
    perf = sample.performance

    caps = []
    for attr, metric_name, category in CAPABILITY_DEFINITIONS:
        value = getattr(perf, attr, None)
        # Some fields are on sample root
        if value is None:
            value = getattr(sample, attr, None)
        status = "AVAILABLE" if value is not None else "UNAVAILABLE"
        caps.append({
            "metric_name": metric_name,
            "category": category,
            "status": status,
            "source": "agent_sync",
        })

    for cap in caps:
        try:
            requests.post(
                f"{BASE_URL}/devices/{device_id}/capabilities",
                json=cap,
                headers=headers,
                timeout=5
            )
        except Exception as e:
            print(f"Warning: Could not post capability {cap['metric_name']}: {e}")

    available = sum(1 for c in caps if c["status"] == "AVAILABLE")
    print(f"Reported {len(caps)} capabilities ({available} available)")


def _build_payload(sample, device_id: str) -> dict:
    """Map agent TelemetrySample to backend TelemetryIn schema."""
    perf = sample.performance
    return {
        "samples": [
            {
                "sample_id": sample.sample_id,
                "device_id": device_id,
                "timestamp_utc": sample.timestamp_utc.isoformat(),
                "sequence_number": sample.sequence_number,
                "schema_version": sample.schema_version,
                "agent_version": sample.agent_version,
                "collection_duration_ms": int(sample.collection_duration_ms) if sample.collection_duration_ms else 0,

                # CPU
                "cpu_usage_percent": perf.cpu_usage_percent,
                "cpu_frequency_current_mhz": perf.cpu_frequency_current_mhz,

                # Memory
                "memory_percent": perf.memory_percent,
                "memory_used_bytes": perf.memory_used_bytes,
                "memory_available_bytes": perf.memory_available_bytes,

                # Disk
                "disk_usage_percent": perf.disk_usage_percent,
                "disk_read_bytes_per_sec": getattr(perf, "disk_read_bytes_per_sec", None),
                "disk_write_bytes_per_sec": getattr(perf, "disk_write_bytes_per_sec", None),
                "disk_latency_ms": getattr(perf, "disk_latency_ms", None),

                # Network
                "network_upload_bytes_per_sec": getattr(perf, "network_upload_bytes_per_sec", None),
                "network_download_bytes_per_sec": getattr(perf, "network_download_bytes_per_sec", None),

                # Battery
                "battery_percent": getattr(perf, "battery_percent", None),
                "battery_plugged": getattr(perf, "battery_plugged", None),

                # System
                "process_count": getattr(perf, "process_count", None),
                "uptime_seconds": perf.uptime_seconds,
            }
        ]
    }


def sync():
    print("Starting PredictX Agent Sync...")
    agent = PredictXAgent()

    # Collect one sample for device registration
    sys_collector = agent.collectors[0]
    sys_res = sys_collector.collect()

    device_data = {
        "device_id": config.device_id,
        "display_name": f"PredictX - {sys_res.data.get('hostname', config.device_id[:8])}",
        "model": "Windows Machine",
        "operating_system": sys_res.data.get("os", "Windows"),
        "os_version": sys_res.data.get("os_version", ""),
        "architecture": sys_res.data.get("architecture", "AMD64"),
        "hostname": sys_res.data.get("hostname", "Local-PC"),
    }

    # Seed + login
    from scripts.seed import seed
    seed()

    login_data = {"username": "admin@predictx.io", "password": "Admin123!"}
    token = _get_token(login_data)
    if not token:
        return

    headers = {"Authorization": f"Bearer {token}"}

    # Register / update device
    reg_resp = requests.post(f"{BASE_URL}/devices/", json=device_data, headers=headers, timeout=10)
    if reg_resp.status_code == 400:
        print("Device already registered — updating metadata...")
        requests.put(f"{BASE_URL}/devices/{config.device_id}", json=device_data, headers=headers, timeout=10)
    elif reg_resp.status_code not in (200, 201):
        print("Device registration failed:", reg_resp.text[:200])

    print(f"Device: {config.device_id} ready.")

    # Post capabilities (first sample)
    try:
        first_sample = agent.collect_sample()
        _post_capabilities(headers, first_sample, config.device_id)
    except Exception as e:
        print(f"Capability discovery error (non-fatal): {e}")

    # ── Main telemetry loop ───────────────────────────────────────────────────
    print(f"Sending telemetry every {INTERVAL}s. Press Ctrl+C to stop.")
    while True:
        try:
            sample = agent.collect_sample()
            payload = _build_payload(sample, config.device_id)

            res = requests.post(
                f"{BASE_URL}/telemetry/batch",
                json=payload,
                headers=headers,
                timeout=10
            )
            ts = datetime.datetime.now().strftime("%H:%M:%S")
            print(f"[{ts}] Telemetry sent -> {res.status_code}")

            if res.status_code == 401:
                # Token expired — re-login
                print("Token expired, re-logging in...")
                token = _get_token(login_data)
                if token:
                    headers = {"Authorization": f"Bearer {token}"}

        except Exception as e:
            print(f"Error sending telemetry: {e}")

        time.sleep(INTERVAL)


if __name__ == "__main__":
    sync()
