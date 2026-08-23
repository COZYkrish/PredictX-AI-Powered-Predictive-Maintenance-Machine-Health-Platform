from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.db.session import get_db
from backend.schemas.prediction import PredictionJobOut
from backend.repositories.prediction import prediction_job as job_repo
from backend.security.deps import get_current_user
from backend.models.user import User

router = APIRouter()

@router.get("/jobs/{job_id}", response_model=PredictionJobOut)
def get_prediction_job(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    job = job_repo.get(db, id=job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
