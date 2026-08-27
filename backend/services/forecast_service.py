"""
forecast_service.py — Linear regression trend forecast for system metrics.

Uses the last 30 minutes of real telemetry to project the next 30 minutes.
Returns: current value, forecast, trend direction, and ETA to threshold.

No fabricated data. All values come from actual TelemetrySample records.
"""
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session

from backend.models.telemetry import TelemetrySample

logger = logging.getLogger(__name__)

# Metric definitions: DB column, threshold for WARNING, label
METRICS = {
    "cpu_usage_percent": {
        "label": "CPU Usage",
        "threshold": 70.0,
        "unit": "%",
        "column": "cpu_usage_percent",
    },
    "memory_percent": {
        "label": "Memory Usage",
        "threshold": 75.0,
        "unit": "%",
        "column": "memory_percent",
    },
    "disk_usage_percent": {
        "label": "Disk Usage",
        "threshold": 85.0,
        "unit": "%",
        "column": "disk_usage_percent",
    },
}


def forecast_device_metrics(
    db: Session,
    device_id: str,
    window_minutes: int = 30,
    horizon_minutes: int = 30,
) -> List[Dict[str, Any]]:
    """
    For each key metric, fetch the last `window_minutes` of telemetry,
    fit a linear regression, and project `horizon_minutes` ahead.

    Returns a list of forecast dicts, one per metric.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=window_minutes)
    samples = (
        db.query(TelemetrySample)
        .filter(
            TelemetrySample.device_id == device_id,
            TelemetrySample.timestamp_utc >= cutoff,
        )
        .order_by(TelemetrySample.timestamp_utc.asc())
        .all()
    )

    if not samples:
        return []

    results = []
    for metric_key, meta in METRICS.items():
        result = _forecast_single(
            samples=samples,
            metric_attr=meta["column"],
            threshold=meta["threshold"],
            label=meta["label"],
            unit=meta["unit"],
            horizon_minutes=horizon_minutes,
        )
        result["metric"] = metric_key
        results.append(result)

    return results


def _forecast_single(
    samples: List[TelemetrySample],
    metric_attr: str,
    threshold: float,
    label: str,
    unit: str,
    horizon_minutes: int,
) -> Dict[str, Any]:
    """Fit linear regression on time series and project forward."""
    try:
        import numpy as np

        # Extract (x=seconds_elapsed, y=metric_value) pairs
        t0 = samples[0].timestamp_utc
        xs = []
        ys = []
        for s in samples:
            val = getattr(s, metric_attr, None)
            if val is None:
                continue
            elapsed = (s.timestamp_utc - t0).total_seconds()
            xs.append(elapsed)
            ys.append(float(val))

        if len(xs) < 3:
            return _no_data_result(label, unit, threshold)

        xs = np.array(xs)
        ys = np.array(ys)

        # Linear regression: y = slope * x + intercept
        slope, intercept = np.polyfit(xs, ys, 1)

        current_val = ys[-1]
        horizon_seconds = horizon_minutes * 60
        forecast_val = float(slope * (xs[-1] + horizon_seconds) + intercept)

        # Clamp to valid range
        forecast_val = max(0.0, min(100.0, forecast_val))

        # Trend direction
        slope_per_min = slope * 60
        if abs(slope_per_min) < 0.05:
            trend = "STABLE"
        elif slope_per_min > 0:
            trend = "RISING"
        else:
            trend = "FALLING"

        # ETA to threshold (if rising toward threshold)
        eta_minutes: Optional[float] = None
        will_breach = False
        if trend == "RISING" and current_val < threshold and forecast_val >= threshold:
            will_breach = True
            # Time to threshold: t = (threshold - intercept) / slope - xs[-1]
            if abs(slope) > 1e-9:
                t_breach = (threshold - intercept) / slope
                eta_sec = t_breach - xs[-1]
                if 0 < eta_sec < horizon_seconds * 2:
                    eta_minutes = round(eta_sec / 60, 1)
        elif trend == "RISING" and forecast_val >= threshold:
            will_breach = True

        return {
            "label": label,
            "unit": unit,
            "threshold": threshold,
            "current": round(current_val, 1),
            "forecast_30min": round(forecast_val, 1),
            "trend": trend,
            "slope_per_minute": round(slope_per_min, 3),
            "will_breach_threshold": will_breach,
            "eta_threshold_minutes": eta_minutes,
            "data_points": len(xs),
            "window_minutes": round((xs[-1] - xs[0]) / 60, 1),
        }

    except Exception as e:
        logger.warning(f"Forecast failed for {metric_attr}: {e}")
        return _no_data_result(label, unit, threshold)


def _no_data_result(label: str, unit: str, threshold: float) -> Dict[str, Any]:
    return {
        "label": label,
        "unit": unit,
        "threshold": threshold,
        "current": None,
        "forecast_30min": None,
        "trend": "UNKNOWN",
        "slope_per_minute": None,
        "will_breach_threshold": False,
        "eta_threshold_minutes": None,
        "data_points": 0,
        "window_minutes": 0,
    }
