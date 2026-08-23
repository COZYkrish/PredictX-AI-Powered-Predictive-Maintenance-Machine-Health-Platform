import logging
import time
import uuid
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from backend.api.api_v1 import api_router
from backend.config import settings
from backend.db.session import engine
from sqlalchemy.orm import Session
from sqlalchemy import text
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])

app = FastAPI(
    title=settings.APP_NAME,
    openapi_url="/api/v1/openapi.json"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
if settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request.state.request_id = request_id
    
    start_time = time.time()
    try:
        response = await call_next(request)
        process_time = (time.time() - start_time) * 1000
        response.headers["X-Request-ID"] = request_id
        
        # Avoid logging sensitive routes fully
        if not request.url.path.startswith("/api/v1/auth"):
            logger.info(
                f"{request_id} {request.method} {request.url.path} "
                f"status={response.status_code} duration={process_time:.2f}ms"
            )
        return response
    except Exception as e:
        logger.error(f"{request_id} ERROR: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": {"code": "INTERNAL_SERVER_ERROR", "message": "An unexpected error occurred."}}
        )

app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/ready")
def readiness_check():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as e:
        logger.error(f"Readiness check failed: DB connection error - {e}")
        return JSONResponse(status_code=503, content={"status": "error", "message": "Database unavailable"})
        
    from backend.ml.adapter import ml_adapter
    if settings.ML_MODE == "real" and (not ml_adapter.predictor or not ml_adapter.anomaly_detector):
        return JSONResponse(status_code=503, content={"status": "error", "message": "ML models unavailable"})
        
    return {"status": "ready"}
