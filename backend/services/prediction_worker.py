"""
Prediction worker — runs as a FastAPI BackgroundTask.

Key changes from the original:
- Uses feature_builder.build_features() to produce all 50 ML features.
- Calls ml_adapter.run_prediction() which loads the real XGBoost artifact.
- Broadcasts via WebSocket using asyncio.run_coroutine_threadsafe() instead of
  asyncio.create_task() (which requires an already-running event loop in the
  calling thread — not available inside FastAPI BackgroundTasks).
- Stores anomaly_label and anomaly_score on the prediction record.
- Calls the issue detector to populate descriptive alerts.
- Writes explicit FAILED state with real error message when anything goes wrong.
"""

import logging
import asyncio
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from backend.repositories.prediction import prediction_job as prediction_job_repo
from backend.repositories.prediction import prediction as prediction_repo
from backend.repositories.prediction import PredictionCreate
from backend.ml.adapter import ml_adapter
from backend.ml.feature_builder import build_features, InsufficientDataError

logger = logging.getLogger(__name__)


def process_prediction_job(db: Session, job_id: str):
    """
    Synchronous background-task entry point called by FastAPI BackgroundTasks.
    """
    job = prediction_job_repo.get(db, id=job_id)
    if not job:
        logger.error(f"Job {job_id} not found")
        return

    if job.status != "PENDING":
        logger.warning(f"Job {job_id} status={job.status}, skipping.")
        return

    # ── PROCESSING ────────────────────────────────────────────────────────────
    job.status = "PROCESSING"
    job.started_at = datetime.now(timezone.utc)
    db.commit()

    try:
        # ── Feature engineering ───────────────────────────────────────────────
        feature_df = build_features(db, job.device_id)

        # ── ML inference ──────────────────────────────────────────────────────
        start_time = datetime.now()
        results, model_name, model_version = ml_adapter.run_prediction(feature_df)
        inference_ms = int((datetime.now() - start_time).total_seconds() * 1000)

        # ── Store prediction ──────────────────────────────────────────────────
        pred_in = PredictionCreate(
            device_id=job.device_id,
            sample_id=job.sample_id,
            timestamp_utc=datetime.now(timezone.utc),
            model_name=model_name,
            model_version=model_version,
            prediction=results["prediction"],
            prediction_probability=results["prediction_probability"],
            risk_level=results["risk_level"],
            health_score=results["health_score"],
        )
        prediction = prediction_repo.create(db, obj_in=pred_in)
        # Store anomaly fields separately (not in PredictionCreate schema)
        prediction.anomaly_label = results.get("anomaly_label")
        prediction.anomaly_score = results.get("anomaly_score")
        prediction.inference_duration_ms = inference_ms
        db.commit()

        # ── Mark job COMPLETED ────────────────────────────────────────────────
        job.status = "COMPLETED"
        job.completed_at = datetime.now(timezone.utc)
        job.model_name = model_name
        job.model_version = model_version
        db.commit()

        logger.info(
            f"[prediction_worker] Job {job_id} COMPLETED: "
            f"prediction={results['prediction']} risk={results['risk_level']} "
            f"health={results['health_score']} anomaly={results.get('anomaly_label')} "
            f"inference={inference_ms}ms"
        )

        # ── Alert evaluation ──────────────────────────────────────────────────
        try:
            from backend.services.alert_service import evaluate_prediction_for_alerts
            evaluate_prediction_for_alerts(db, prediction)
        except Exception as alert_err:
            logger.warning(f"Alert evaluation failed (non-fatal): {alert_err}")

        # ── WebSocket broadcast ───────────────────────────────────────────────
        # We're inside a sync BackgroundTask thread, so we can't call asyncio.create_task().
        # Instead we post a coroutine to the main event loop via run_coroutine_threadsafe.
        _broadcast_prediction(prediction)

    except InsufficientDataError as ide:
        job.status = "FAILED"
        job.error_message = str(ide)
        job.completed_at = datetime.now(timezone.utc)
        db.commit()
        logger.info(f"[prediction_worker] Job {job_id} INSUFFICIENT_DATA: {ide}")

    except RuntimeError as rte:
        # ML model unavailable
        job.status = "FAILED"
        job.error_message = str(rte)
        job.completed_at = datetime.now(timezone.utc)
        db.commit()
        logger.error(f"[prediction_worker] Job {job_id} FAILED (ML unavailable): {rte}")

    except Exception as e:
        job.status = "FAILED"
        job.error_message = f"{type(e).__name__}: {e}"
        job.completed_at = datetime.now(timezone.utc)
        db.commit()
        logger.exception(f"[prediction_worker] Job {job_id} FAILED: {e}")


def _broadcast_prediction(prediction):
    """
    Safe WebSocket broadcast from a sync thread.
    Finds the running asyncio event loop of the main thread and schedules
    the coroutine on it — avoiding the 'no running event loop' error.
    """
    try:
        from backend.realtime.manager import realtime_manager
        loop = _get_main_event_loop()
        if loop and loop.is_running():
            asyncio.run_coroutine_threadsafe(
                _async_broadcast(realtime_manager, prediction), loop
            )
        else:
            logger.debug("No running event loop found for WebSocket broadcast.")
    except Exception as e:
        logger.debug(f"WebSocket broadcast skipped: {e}")


async def _async_broadcast(manager, prediction):
    message = {
        "event": "prediction.completed",
        "device_id": prediction.device_id,
        "timestamp_utc": prediction.timestamp_utc.isoformat() if prediction.timestamp_utc else None,
        "payload": {
            "risk_level": prediction.risk_level,
            "health_score": prediction.health_score,
            "prediction": prediction.prediction,
            "anomaly_label": prediction.anomaly_label,
        }
    }
    connections = manager.device_connections.get(prediction.device_id, [])
    if connections:
        await manager._broadcast_to_list(list(connections), message)
    if manager.dashboard_connections:
        await manager._broadcast_to_list(list(manager.dashboard_connections), message)


def _get_main_event_loop():
    """
    Returns the event loop running in the main thread, or None if not found.
    FastAPI/uvicorn run their loop in the main thread.
    """
    import threading
    main_thread = threading.main_thread()
    # Python 3.10+ stores the loop on the thread object via _asyncio_running_loop
    try:
        loop = getattr(main_thread, "_asyncio_running_loop", None)
        if loop:
            return loop
    except Exception:
        pass

    # Fallback: try asyncio internals
    try:
        loop = asyncio._get_running_loop()
        return loop
    except Exception:
        pass

    # Final fallback: get event loop policy
    try:
        loop = asyncio.get_event_loop_policy().get_event_loop()
        if loop.is_running():
            return loop
    except Exception:
        pass

    return None
