# PredictX — Anomaly Injection Test Results

> **Date:** 2026-08-27  
> **Device:** krish (Windows 11)  
> **Test type:** Memory stress injection  
> **Script:** `scripts/anomaly_inject.ps1`

---

## Pre-Test Baseline

| Metric | Value |
|---|---|
| Memory before test | ~75% |
| CPU usage | ~16% |
| Active Issues | 1 (VERIFYING) |
| Active Alerts | 1 (OPEN) |
| System Health | 80/100 |
| Risk Level | HIGH |

---

## Test Procedure

Run the following in PowerShell:

```powershell
# Check what will happen without running
.\scripts\anomaly_inject.ps1 -MemoryMB 500 -DurationSeconds 180 -DryRun

# Run the actual test (3 minutes, 500MB allocation)
.\scripts\anomaly_inject.ps1 -MemoryMB 500 -DurationSeconds 180
```

**Expected memory after allocation:** `~75% + (500 / RAM_total * 100)%`

On the test machine (16GB RAM): `75% + 3.1% = ~78.1%` → **above the 75% WARNING threshold**

---

## Expected Pipeline Sequence

```
T+0s    Memory array allocated (500MB)
T+10s   PredictX agent collects telemetry → memory spike recorded in PostgreSQL
T+20s   XGBoost classifies telemetry as WARNING (memory_percent > 75%)
T+30s   IssueDetector creates MEMORY_PRESSURE issue in DB
T+40s   AlertService creates OPEN alert linked to issue
T+50s   Dashboard: Active Issues +1, Risk → HIGH (if not already)
T+60s   Alerts page shows new MEMORY_PRESSURE alert
T+180s  Memory released → [GC]::Collect() forces immediate deallocation
T+190s  Agent collects post-release telemetry → memory drops below 75%
T+310s  Verification period (120s) completes → Issue status → RESOLVED
T+320s  Alert status → RESOLVED → Dashboard Active Issues -1
```

---

## Verification Steps

After running the test, verify the pipeline at each stage:

### Stage 1 — During Memory Load
- [ ] Open `http://localhost:3000/dashboard`
- [ ] **30-Minute Forecast** shows Memory RISING with orange warning
- [ ] Memory current value matches system Task Manager

### Stage 2 — Alert Created
- [ ] Open `http://localhost:3000/alerts`
- [ ] New `MEMORY_PRESSURE` alert appears with OPEN status
- [ ] Click INVESTIGATE — recommendation shows actual memory % and process names

### Stage 3 — After Memory Released
- [ ] 30-Minute Forecast shows Memory FALLING or STABLE
- [ ] After 2 minutes: Alert status changes to RESOLVED
- [ ] Dashboard Active Issues count decreases

---

## Evidence To Capture

For your report, take screenshots of:

1. **Dashboard** showing the spike in memory during load
2. **Alerts page** showing the MEMORY_PRESSURE alert (OPEN status)
3. **Investigation page** showing evidence and recommendation with actual process names
4. **Dashboard** after resolution showing Active Issues: 0

---

## How to Run the Dry-Run First

```powershell
# Preview what the test will do without allocating memory
cd D:\Desktop\PredictX
.\scripts\anomaly_inject.ps1 -DryRun

# Sample output:
# Configuration:
#   Memory to allocate : 400 MB
#   Hold duration      : 180 seconds
#   Alert threshold    : 75% memory
# Current system memory state:
#   Total : 16384 MB
#   Used  : 12288 MB (75.0%)
#   Free  : 4096 MB
# After allocation: ~77.4% memory usage
# [RISING — will breach 75% threshold]
```
