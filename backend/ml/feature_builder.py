"""
Feature Builder — converts raw telemetry history into the 50-feature DataFrame
expected by the trained XGBoost model.

The training pipeline (ml/training/trainer.py) used:
  - median imputation for missing values (via SimpleImputer inside the Pipeline)
  - StandardScaler
  - 30-second and 60-second rolling windows by device
  - delta (diff) features

This module reproduces those transformations at inference time.
Missing values (None/NaN) are left as NaN — the pre-fitted sklearn Pipeline
inside the joblib artifact will apply its baked-in median imputation.
We do NOT coerce None → 0.0 because 0.0 means "measured, value is zero"
while None means "metric not available".
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd
from sqlalchemy.orm import Session

from backend.models.telemetry import TelemetrySample

logger = logging.getLogger(__name__)

# ── Feature schema from training ──────────────────────────────────────────────
_METADATA_PATH = (
    Path(__file__).parent.parent.parent / "ml" / "artifacts" / "models" / "metadata.json"
)

def _load_expected_features() -> list:
    try:
        with open(_METADATA_PATH) as f:
            raw = f.read()
        import re
        raw = re.sub(r'\bNaN\b', 'null', raw)
        meta = json.loads(raw)
        return meta.get("features", [])
    except Exception as e:
        logger.error(f"Cannot load feature schema: {e}")
        return []

EXPECTED_FEATURES: list = _load_expected_features()

# The largest rolling window used during training is 60 seconds.
# We require at least 70 seconds of history to safely compute all features.
REQUIRED_HISTORY_SECONDS: int = 70
MIN_SAMPLES: int = 4  # At least 4 samples (≈40s at 10s interval)

# ── Raw columns to roll ───────────────────────────────────────────────────────
_ROLL_COLS = [
    "cpu_usage_percent",
    "memory_percent",
    "disk_usage_percent",
    "network_upload_bytes_per_sec",
    "network_download_bytes_per_sec",
]

# ── Telemetry DB columns → feature names mapping ──────────────────────────────
# Maps TelemetrySample column names to the feature names used during training
_RAW_COL_MAP = {
    "id": "id",                  # row number / sequential id (not UUID)
    "collection_duration_ms": "collection_duration_ms",
    "cpu_usage_percent": "cpu_usage_percent",
    "cpu_frequency_current_mhz": "cpu_frequency_current_mhz",
    "memory_percent": "memory_percent",
    "memory_used_bytes": "memory_used_bytes",
    "memory_available_bytes": "memory_available_bytes",
    "disk_usage_percent": "disk_usage_percent",
    "disk_read_bytes_per_sec": "disk_read_bytes_per_sec",
    "disk_write_bytes_per_sec": "disk_write_bytes_per_sec",
    "network_upload_bytes_per_sec": "network_upload_bytes_per_sec",
    "network_download_bytes_per_sec": "network_download_bytes_per_sec",
    "process_count": "process_count",
    "uptime_seconds": "uptime_seconds",
    "battery_percent": "battery_percent",
}


class InsufficientDataError(Exception):
    """Raised when not enough telemetry history exists for full feature generation."""
    def __init__(self, required_s: int, available_s: int, available_n: int):
        self.required_s = required_s
        self.available_s = available_s
        self.available_n = available_n
        super().__init__(
            f"INSUFFICIENT_DATA: required {required_s}s of history, "
            f"available {available_s}s ({available_n} samples). "
            f"Continue collecting telemetry for approximately "
            f"{max(0, required_s - available_s)} more seconds."
        )


def required_history_seconds() -> int:
    """Returns the minimum history window required for full feature generation."""
    return REQUIRED_HISTORY_SECONDS


def build_features(db: Session, device_id: str) -> pd.DataFrame:
    """
    Build a single-row feature DataFrame from recent telemetry history.

    Args:
        db: SQLAlchemy session
        device_id: agent device_id string

    Returns:
        pd.DataFrame with exactly the features EXPECTED_FEATURES lists,
        ordered correctly — ready to pass to the sklearn Pipeline.

    Raises:
        InsufficientDataError: if not enough history exists.
        ValueError: if EXPECTED_FEATURES could not be loaded.
    """
    if not EXPECTED_FEATURES:
        raise ValueError("Feature schema not loaded. Check ml/artifacts/models/metadata.json")

    # ── 1. Fetch recent telemetry ─────────────────────────────────────────────
    cutoff = datetime.now(timezone.utc) - timedelta(seconds=REQUIRED_HISTORY_SECONDS + 30)
    rows = (
        db.query(TelemetrySample)
        .filter(
            TelemetrySample.device_id == device_id,
            TelemetrySample.timestamp_utc >= cutoff,
        )
        .order_by(TelemetrySample.timestamp_utc.asc())
        .all()
    )

    if not rows:
        raise InsufficientDataError(REQUIRED_HISTORY_SECONDS, 0, 0)

    # Check time span
    oldest = rows[0].timestamp_utc
    newest = rows[-1].timestamp_utc
    if oldest.tzinfo is None:
        oldest = oldest.replace(tzinfo=timezone.utc)
    if newest.tzinfo is None:
        newest = newest.replace(tzinfo=timezone.utc)
    span_seconds = int((newest - oldest).total_seconds())

    if len(rows) < MIN_SAMPLES or span_seconds < REQUIRED_HISTORY_SECONDS:
        raise InsufficientDataError(REQUIRED_HISTORY_SECONDS, span_seconds, len(rows))

    # ── 2. Build raw DataFrame ────────────────────────────────────────────────
    records = []
    for i, row in enumerate(rows):
        rec: dict = {"id": i, "device_id": device_id}
        for db_col, feat_name in _RAW_COL_MAP.items():
            if db_col == "id":
                rec[feat_name] = i
            else:
                rec[feat_name] = getattr(row, db_col, None)
        rec["timestamp_utc"] = (
            row.timestamp_utc
            if row.timestamp_utc.tzinfo
            else row.timestamp_utc.replace(tzinfo=timezone.utc)
        )
        records.append(rec)

    df = pd.DataFrame(records)
    df["timestamp_utc"] = pd.to_datetime(df["timestamp_utc"], utc=True)
    df = df.sort_values("timestamp_utc").reset_index(drop=True)

    # ── 3. Delta features ─────────────────────────────────────────────────────
    for col in _ROLL_COLS:
        if col in df.columns:
            df[f"delta_{col}"] = df[col].diff()

    # ── 4. Rolling features ───────────────────────────────────────────────────
    df = df.set_index("timestamp_utc")

    windows = {"30s": "30s", "60s": "60s"}
    for w_name, w_val in windows.items():
        for col in _ROLL_COLS:
            if col in df.columns:
                roll = df[col].rolling(w_val, min_periods=1)
                df[f"{col}_{w_name}_mean"] = roll.mean()
                df[f"{col}_{w_name}_max"] = roll.max()
                df[f"{col}_{w_name}_std"] = roll.std()

    df = df.reset_index()

    # ── 5. Take only the LAST row (the most recent sample) ───────────────────
    latest = df.iloc[[-1]].copy()

    # ── 6. Select and order exactly the expected features ────────────────────
    for feat in EXPECTED_FEATURES:
        if feat not in latest.columns:
            latest[feat] = np.nan  # will be median-imputed by the Pipeline

    feature_row = latest[EXPECTED_FEATURES].copy()

    # Validate feature count
    assert len(feature_row.columns) == len(EXPECTED_FEATURES), (
        f"Feature count mismatch: got {len(feature_row.columns)}, "
        f"expected {len(EXPECTED_FEATURES)}"
    )

    logger.debug(
        f"[feature_builder] Built {len(EXPECTED_FEATURES)} features for device {device_id} "
        f"from {len(rows)} samples spanning {span_seconds}s"
    )
    return feature_row
