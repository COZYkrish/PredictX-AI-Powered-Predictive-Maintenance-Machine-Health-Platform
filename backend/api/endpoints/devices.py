from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from backend.db.session import get_db
from backend.schemas.device import DeviceCreate, DeviceOut, DeviceUpdate, CapabilityOut
from backend.repositories.device import device as device_repo
from backend.security.deps import get_current_user
from backend.models.user import User
from backend.models.prediction import Prediction
from backend.models.device_capability import DeviceCapability, CapabilityStatusEnum
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


class CapabilityIn(BaseModel):
    metric_name: str
    category: Optional[str] = None
    status: str  # AVAILABLE | UNAVAILABLE | ERROR | NOT_APPLICABLE
    source: Optional[str] = None
    reason: Optional[str] = None


from backend.services.health_engine import calculate_health_and_risk

def _enrich_device_with_prediction(db: Session, device) -> dict:
    """Add health_score and risk_level from the health engine."""
    out = {}
    for col in device.__table__.columns:
        out[col.name] = getattr(device, col.name)

    health_data = calculate_health_and_risk(db, device.device_id)
    out["health_score"] = health_data["health_score"]
    out["risk_level"] = health_data["risk_level"]
    out["last_prediction_at"] = health_data["last_prediction_at"]
    return out


@router.post("/", response_model=DeviceOut)
def register_device(
    *,
    db: Session = Depends(get_db),
    device_in: DeviceCreate,
    current_user: User = Depends(get_current_user)
) -> Any:
    dev = device_repo.get_by_device_id(db, device_id=device_in.device_id)
    if dev:
        raise HTTPException(status_code=400, detail="Device already registered")
    return _enrich_device_with_prediction(db, device_repo.create(db, obj_in=device_in))


@router.get("/", response_model=List[DeviceOut])
def get_devices(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    devices = device_repo.get_multi(db, skip=skip, limit=limit)
    # Only return devices that have a real hostname (exclude seeded test devices)
    real_devices = [d for d in devices if d.hostname]
    return [_enrich_device_with_prediction(db, d) for d in real_devices]


@router.get("/{device_id}", response_model=DeviceOut)
def get_device(
    device_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    dev = device_repo.get_by_device_id(db, device_id=device_id)
    if not dev:
        raise HTTPException(status_code=404, detail="Device not found")
    return _enrich_device_with_prediction(db, dev)


@router.put("/{device_id}", response_model=DeviceOut)
def update_device(
    device_id: str,
    device_in: DeviceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    dev = device_repo.get_by_device_id(db, device_id=device_id)
    if not dev:
        raise HTTPException(status_code=404, detail="Device not found")
    updated = device_repo.update(db, db_obj=dev, obj_in=device_in)
    return _enrich_device_with_prediction(db, updated)


@router.get("/{device_id}/capabilities", response_model=List[CapabilityOut])
def get_device_capabilities(
    device_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    caps = (
        db.query(DeviceCapability)
        .filter(DeviceCapability.device_id == device_id)
        .all()
    )
    return caps


@router.post("/{device_id}/capabilities", response_model=CapabilityOut)
def upsert_device_capability(
    device_id: str,
    cap_in: CapabilityIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Upsert a capability record for a device (called by agent_sync)."""
    from datetime import datetime, timezone
    # Upsert: update if exists, insert if not
    existing = (
        db.query(DeviceCapability)
        .filter(
            DeviceCapability.device_id == device_id,
            DeviceCapability.metric_name == cap_in.metric_name
        )
        .first()
    )

    try:
        status_enum = CapabilityStatusEnum(cap_in.status)
    except ValueError:
        status_enum = CapabilityStatusEnum.NOT_APPLICABLE

    if existing:
        existing.status = status_enum
        existing.source = cap_in.source
        existing.reason = cap_in.reason
        existing.last_checked_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(existing)
        return existing
    else:
        new_cap = DeviceCapability(
            id=str(uuid.uuid4()),
            device_id=device_id,
            metric_name=cap_in.metric_name,
            category=cap_in.category,
            status=status_enum,
            source=cap_in.source,
            reason=cap_in.reason,
        )
        db.add(new_cap)
        db.commit()
        db.refresh(new_cap)
        return new_cap
