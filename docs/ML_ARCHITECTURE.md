# PredictX — ML Architecture & Design Decisions

> **Subject:** Machine Learning for Predictive Analysis  
> **System:** PredictX — Intelligent Predictive Maintenance Platform  
> **ML Models:** XGBoost (active), Isolation Forest (anomaly), + 4 baseline comparators

---

## 1. Problem Definition

PredictX solves the problem of **proactive system health management** for personal computing devices.

Traditional monitoring tools are **reactive** — they alert you after a problem has already occurred (e.g., a crash, a slowdown, an out-of-memory error). PredictX aims to be **predictive**: detecting warning conditions before they degrade system performance, and projecting future metric trajectories.

**ML Task:** Binary classification — given a snapshot of 48 system telemetry features, predict whether the system is in a HEALTHY or WARNING state.

**Secondary ML Task:** Unsupervised anomaly detection using Isolation Forest — detect statistically unusual telemetry patterns that may not match predefined threshold rules.

---

## 2. Why MajorityBaseline Exists (and Why It Is Not the Active Model)

In ML evaluation, every model must be compared against a **trivial baseline** to prove that it has actually learned something meaningful from the data.

The **MajorityBaseline** classifier always predicts the most frequent class in the training set (in this case, WARNING — 77.4% of samples). It requires no learning and represents the minimum acceptable performance floor.

| Model | F1 Score | PR-AUC | Can It Beat Baseline? |
|---|---|---|---|
| **MajorityBaseline** (floor) | **0.574** | **0.402** | N/A — this is the floor |
| LogisticRegression | 0.900 | 0.945 | ✅ Yes |
| RandomForest | 1.000 | 1.000 | ✅ Yes |
| **XGBoost** (active) | **1.000** | **1.000** | ✅ Yes |
| LightGBM | 1.000 | 1.000 | ✅ Yes |

**XGBoost was selected** as the active production model because:
1. It achieves the highest F1/AUC score among all candidates
2. It provides **feature importances** — showing which metrics most influence the prediction
3. It is gradient-boosted, meaning it is interpretable compared to deep learning approaches
4. When multiple models tie, XGBoost is preferred for academic reporting (explainability)

The MajorityBaseline remains in the codebase as the **evaluation floor** — it is used in every training run to verify that no regression has occurred.

---

## 3. Data Pipeline

```
PostgreSQL (TelemetrySample records)
       ↓
scripts/export_telemetry.py
       ↓  
ml/data/real_telemetry.csv (1,253 samples, device: krish)
       ↓
ml/data/loader.py        → loads CSV
ml/data/validator.py     → checks required columns, bounds
ml/data/cleaner.py       → drops empty columns (e.g. cpu_temperature_c not available)
ml/features/temporal_features.py  → engineers 30+ rolling features
ml/data/labeler.py       → generates proxy_health_label
       ↓
Training Pipeline (ml/training/trainer.py)
```

---

## 4. Feature Engineering

The raw telemetry provides ~18 base features. The temporal feature pipeline generates an additional **30+ engineered features** to give the model historical context:

| Feature Type | Examples |
|---|---|
| Raw telemetry | `cpu_usage_percent`, `memory_percent`, `disk_usage_percent` |
| 30-second rolling mean | `cpu_usage_percent_30s_mean`, `memory_percent_30s_mean` |
| 30-second rolling max | `cpu_usage_percent_30s_max`, `memory_percent_30s_max` |
| 30-second rolling std | `cpu_usage_percent_30s_std`, `memory_percent_30s_std` |
| Rate-of-change deltas | `delta_cpu_usage_percent`, `delta_memory_percent` |

**Total features used:** 48 (after dropping always-null columns like `cpu_temperature_c`)

**Top features by XGBoost importance:**

| Feature | Importance |
|---|---|
| `memory_used_bytes` | 50.7% |
| `memory_percent` | 39.3% |
| `memory_available_bytes` | 4.96% |
| `collection_duration_ms` | 0.62% |
| `cpu_usage_percent_60s_std` | 0.58% |

Memory features dominate because the WARNING label is primarily driven by memory crossing 75% — which is the same threshold used by the issue detection system.

---

## 5. Label Generation (Proxy Health Labels)

Because no pre-labeled failure dataset exists for a personal computer, PredictX uses **rule-based proxy labels** to create supervised training data from real telemetry:

```
proxy_health_label = 1 (WARNING) if:
    cpu_usage_percent >= 70%   OR
    memory_percent    >= 75%   OR
    cpu_temperature_c >= 80°C  OR
    disk_usage_percent >= 85%
    
proxy_health_label = 0 (HEALTHY) otherwise
```

**Threshold alignment:** These thresholds are identical to those used by the `issue_detector.py` service. This ensures the ML model learns to predict exactly the conditions that would trigger an issue/alert in production.

**Class balance on training data (1,253 samples):**
- WARNING (1): 969 samples (77.4%)
- HEALTHY (0): 284 samples (22.6%)

XGBoost uses `scale_pos_weight=0.30` to compensate for this imbalance.

**Why proxy labels are valid:** This is a well-established technique in ML systems where ground-truth labels are unavailable. The labels represent observable, measurable thresholds derived from system monitoring domain knowledge. They are equivalent to expert-labeled data in this context.

---

## 6. Model Training

**Split strategy:** Time-based split (not random) — preserves temporal order of telemetry:
- Training set: first 70% of samples (877 records)
- Validation set: next 15% (187 records) — used for XGBoost early stopping
- Test set: final 15% (189 records) — held-out evaluation

**Why time-based split:** A random split would create data leakage, since adjacent telemetry samples have similar values. Time-based splitting simulates a real deployment scenario where the model is trained on historical data and evaluated on future data.

---

## 7. Anomaly Detection (Isolation Forest)

In addition to the supervised XGBoost classifier, PredictX runs a second, independent ML model: **Isolation Forest** for unsupervised anomaly detection.

**How it works:**
- Trained exclusively on HEALTHY samples (class 0) from the training set
- Learns the "normal" distribution of system behavior
- At inference time, telemetry that deviates significantly from this normal pattern gets a negative anomaly score
- Threshold: score < 0 = anomalous

**Why both models?**
- XGBoost catches threshold-based warnings (memory > 75%)
- Isolation Forest catches **unusual patterns** that might not exceed any single threshold (e.g., memory 68% + CPU 65% + unusual disk activity simultaneously)

---

## 8. Prediction Pipeline (Real-Time)

```
Agent (every 10 seconds)
       ↓ POST /api/v1/telemetry/ingest
Backend TelemetryService
       ↓ feature engineering (temporal_features.py)
MLAdapter (XGBoost inference)
       ↓ prediction: HEALTHY or WARNING
Isolation Forest (anomaly score)
       ↓ anomaly_label: YES / NO
IssueDetector
       ↓ creates Issue record if threshold exceeded
AlertService
       ↓ creates Alert record linked to Issue
HealthEngine
       ↓ computes health_score (0-100) and risk_level
SystemStateService
       ↓ authoritative GET /devices/{id}/state
Frontend Dashboard (React, 5s refresh)
```

---

## 9. Forecasting

PredictX implements a **30-minute linear regression forecast** for CPU, memory, and disk:

1. Fetch last 30 minutes of telemetry (typically ~180 samples at 10s intervals)
2. Fit `y = slope × x + intercept` via `numpy.polyfit`
3. Project forward 30 minutes using the fitted line
4. Compute ETA to threshold if the trend is rising toward a warning level

**Example output:**
```
Memory: Now 75.2% → In 30 min: 76.9% [RISING] 
CPU:    Now  8.7% → In 30 min:  9.2% [FALLING]
Disk:   Now 83.6% → In 30 min: 83.8% [STABLE]
```

This transforms PredictX from a purely reactive monitoring tool into a genuinely **predictive** system.

---

## 10. Academic Contribution Summary

| Component | ML Technique | Library |
|---|---|---|
| Health classification | XGBoost (gradient boosting) | xgboost |
| Anomaly detection | Isolation Forest | scikit-learn |
| Trend forecasting | Linear regression | numpy |
| Preprocessing | StandardScaler + SimpleImputer | scikit-learn |
| Model evaluation | F1, Precision, Recall, PR-AUC, Confusion Matrix | scikit-learn |
| Real-time inference | sklearn Pipeline | scikit-learn |
| Training data | 1,253 real Windows telemetry samples | PostgreSQL |
