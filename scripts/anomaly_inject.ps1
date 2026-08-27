# PredictX — Anomaly Injection Test
# Purpose: Artificially stress memory to trigger the DETECT → ALERT → VERIFY → RESOLVE pipeline
# Usage: Run in PowerShell as Administrator (not required, but recommended)
#
# What this does:
# 1. Allocates configurable RAM amount for a configurable duration
# 2. Logs start/end timestamps so you can trace the PredictX pipeline
# 3. Prints expected system response at each stage

param(
    [int]$MemoryMB = 400,        # MB to allocate (default 400MB)
    [int]$DurationSeconds = 180,  # How long to hold memory (default 3 minutes)
    [switch]$DryRun = $false      # If set, just prints what would happen without running
)

$ThresholdPercent = 75  # Memory threshold that triggers MEMORY_PRESSURE issue

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PredictX Anomaly Injection Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Memory to allocate : $($MemoryMB) MB"
Write-Host "  Hold duration      : $($DurationSeconds) seconds"
Write-Host "  Alert threshold    : $($ThresholdPercent)% memory"
Write-Host ""

# Check current memory
$os = Get-CimInstance -ClassName Win32_OperatingSystem
$totalMB = [Math]::Round($os.TotalVisibleMemorySize / 1024)
$freeMB = [Math]::Round($os.FreePhysicalMemory / 1024)
$usedMB = $totalMB - $freeMB
$usedPct = [Math]::Round(($usedMB / $totalMB) * 100, 1)

Write-Host "Current system memory state:" -ForegroundColor White
Write-Host "  Total : $($totalMB) MB"
Write-Host "  Used  : $($usedMB) MB ($($usedPct)%)"
Write-Host "  Free  : $($freeMB) MB"
Write-Host ""

$afterPct = [Math]::Round((($usedMB + $MemoryMB) / $totalMB) * 100, 1)
Write-Host "After allocation: ~$($afterPct)% memory usage" -ForegroundColor $(if ($afterPct -gt $ThresholdPercent) { "Red" } else { "Yellow" })

if ($afterPct -lt $ThresholdPercent) {
    Write-Host ""
    Write-Host "WARNING: After allocating $($MemoryMB)MB, memory will be ~$($afterPct)%," -ForegroundColor Yellow
    Write-Host "         which is still below the $($ThresholdPercent)% threshold." -ForegroundColor Yellow
    Write-Host "         Consider increasing -MemoryMB to trigger a MEMORY_PRESSURE issue." -ForegroundColor Yellow
    Write-Host "         Required allocation to reach threshold: $(($ThresholdPercent/100 * $totalMB - $usedMB).ToString('N0')) MB" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Expected PredictX pipeline (timeline):" -ForegroundColor Green
Write-Host "  T+0s    : Memory allocation begins"
Write-Host "  T+10s   : Agent collects telemetry, memory spike detected"
Write-Host "  T+20s   : XGBoost classifies as WARNING"
Write-Host "  T+30s   : MEMORY_PRESSURE issue created in PostgreSQL"
Write-Host "  T+40s   : Alert created and visible in PredictX Alerts page"
Write-Host "  T+60s   : Dashboard shows Active Issues: 1, Risk: HIGH"
Write-Host "  T+${DurationSeconds}s: Memory released"
Write-Host "  T+$(${DurationSeconds}+30)s: Agent detects memory drop below threshold"
Write-Host "  T+$(${DurationSeconds}+120)s: Verification period completes → Issue RESOLVED"
Write-Host "  T+$(${DurationSeconds}+130)s: Dashboard back to Active Issues: 0"
Write-Host ""

if ($DryRun) {
    Write-Host "DRY RUN — no memory was allocated." -ForegroundColor Cyan
    exit 0
}

Write-Host "Press ENTER to start the test, or Ctrl+C to cancel..." -ForegroundColor Yellow
Read-Host

$startTime = Get-Date
Write-Host ""
Write-Host "[$(Get-Date -Format 'HH:mm:ss')] STARTING TEST — Allocating $($MemoryMB) MB..." -ForegroundColor Green
Write-Host ""
Write-Host "  -> Monitor PredictX Dashboard at http://localhost:3000/dashboard"
Write-Host "  -> Watch the Alerts page at http://localhost:3000/alerts"
Write-Host "  -> The 30-Minute Forecast should show Memory RISING"
Write-Host ""

# Allocate memory by creating a large byte array
$array = New-Object byte[] ($MemoryMB * 1024 * 1024)

# Touch the pages to ensure OS actually allocates physical memory
Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Memory allocated. Holding for $($DurationSeconds) seconds..." -ForegroundColor Yellow

# Check memory again after allocation
$os2 = Get-CimInstance -ClassName Win32_OperatingSystem
$freeMB2 = [Math]::Round($os2.FreePhysicalMemory / 1024)
$usedMB2 = $totalMB - $freeMB2
$usedPct2 = [Math]::Round(($usedMB2 / $totalMB) * 100, 1)
Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Confirmed memory: $($usedMB2) MB used ($($usedPct2)%)" -ForegroundColor Cyan

# Countdown
for ($i = $DurationSeconds; $i -gt 0; $i -= 10) {
    $remaining = if ($i -gt 10) { $i } else { 1 }
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Holding... $($remaining)s remaining" -ForegroundColor DarkGray
    Start-Sleep -Seconds (if ($i -gt 10) { 10 } else { $i })
}

Write-Host ""
Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Releasing memory..." -ForegroundColor Green
Remove-Variable array
[System.GC]::Collect()

$endTime = Get-Date
$duration = ($endTime - $startTime).TotalSeconds

Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Memory released. Test duration: $([Math]::Round($duration))s" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Check PredictX Alerts page — should show a MEMORY_PRESSURE alert"
Write-Host "  2. Click INVESTIGATE on the alert to see the diagnosis"
Write-Host "  3. Wait 2 minutes — the verification engine should auto-resolve the issue"
Write-Host "  4. Dashboard Active Issues count should return to 0"
Write-Host ""
Write-Host "If no alert appeared, check:" -ForegroundColor Red
Write-Host "  - Was memory above $($ThresholdPercent)% during the test? (was: $($usedPct2)%)"
Write-Host "  - Is the PredictX agent running? (check start_predictx.ps1 output)"
Write-Host "  - Is the backend running? (http://localhost:8000/docs)"
