# PredictX - Windows Agent (Phase 1)

PredictX Phase 1 is a robust, privacy-conscious Windows desktop agent designed to continuously collect system-health telemetry, validate it, and store it locally. It acts as the foundational data-collection tier for future Machine Learning and predictive maintenance phases.

## Phase 1 Scope
This phase strictly focuses on **Telemetry Collection**. It does **not** include ML predictions, dashboards, cloud synchronization, or remote alerts. It safely collects metrics using native Windows mechanisms and outputs them to SQLite, JSON, and CSV for downstream consumption.

## Supported Telemetry
Telemetry is explicitly divided into two categories:

### 1. Performance Telemetry
- **CPU**: Usage percentage, frequency (MHz)
- **Memory**: Usage percentage, used/available bytes
- **Disk**: Usage percentage, Read/Write bytes per second
- **Network**: Upload/Download bytes per second
- **System**: Uptime, process count

### 2. Hardware Health Telemetry
*Note: Hardware health telemetry availability varies heavily by vendor, driver, and Windows version.*
- **Battery**: Percentage (Laptops only)
- **GPU**: Identity (Usage, Memory, and Temperature are heavily driver-dependent and gracefully fall back to unavailable if unsupported natively).
- **Temperatures**: CPU & Storage temperatures (if exposed via WMI thermal zones without third-party vendor SDKs).

> **Important Limitation**: PredictX does not claim that high performance utilization (e.g., 95% CPU) proves physical hardware failure. It also acknowledges that certain hardware sensors (like GPU temperature on desktop cards) are completely inaccessible via standard Windows WMI/PDH APIs without proprietary drivers. These will be marked as `UNAVAILABLE` rather than fabricating data.

## Capability Detection
The agent performs capability detection on startup or when running `--diagnostic`. If a sensor is unavailable, the agent will gracefully record it as such in the `device_capabilities` table, and the metric will be recorded as `null` in the telemetry sample. A single missing sensor will **never** crash the agent.

## Privacy
PredictX is built with privacy in mind. By default, it **does not** collect:
- Usernames or Windows accounts
- Hardware serial numbers (unless explicitly configured)
- Full process paths or command-line arguments
- Browser history, keystrokes, screenshots, or personal files
- Cloud sync (everything is kept completely local in Phase 1)

## Architecture
- **PDH (Performance Data Helper)**: The primary mechanism used to query Windows Performance Counters efficiently.
- **WMI/CIM**: Used for hardware metadata and system capability probing.
- **SQLite**: Local structured storage containing `devices`, `telemetry_samples`, `collector_status`, and `device_capabilities`.

## Requirements
- Windows 10 or 11
- Python 3.11+

## Installation

```powershell
# 1. Clone or copy the PredictX directory
cd PredictX

# 2. Create a virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# 3. Install requirements
pip install -r requirements.txt
```

## Usage

### Continuous Monitoring
Collects telemetry continuously at the specified interval (minimum 1 second, default recommended 10 seconds). The scheduler automatically accounts for collection overhead to prevent drift.
```powershell
python -m agent.main --interval 10
```

### Diagnostic Mode
Probes the system for available hardware sensors and performance counters, explaining why certain metrics might be unsupported on this specific hardware.
```powershell
python -m agent.main --diagnostic
```

### Single Sample
Collects exactly one telemetry sample, saves it to the database, and exits.
```powershell
python -m agent.main --once
```

### Output to JSON
Outputs the single most recent telemetry sample directly to the console as formatted JSON, which is useful for Phase 2 pipeline integrations.
```powershell
python -m agent.main --json
```

### Export to CSV
Exports all collected historical telemetry from the local SQLite database into a CSV file in the `data/exports/` directory.
```powershell
python -m agent.main --export-csv
```

## Future Phase 2 Integration
The SQLite database and JSON outputs are strongly versioned using `schema_version`. All cumulative metrics are stored both as raw values and derived rates (e.g., bytes per second) to assist feature engineering for ML pipelines.