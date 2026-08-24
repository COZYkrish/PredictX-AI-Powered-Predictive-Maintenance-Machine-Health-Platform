from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.db.session import get_db
from backend.schemas.device import DeviceCreate, DeviceOut, DeviceUpdate
from backend.repositories.device import device as device_repo
from backend.security.deps import get_current_user
from backend.models.user import User

router = APIRouter()

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
    return device_repo.create(db, obj_in=device_in)

@router.get("/", response_model=list[DeviceOut])
def get_devices(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    # In a full system, filter by user access
    devices = device_repo.get_multi(db, skip=skip, limit=limit)
    return devices

@router.get("/{device_id}", response_model=DeviceOut)
def get_device(
    device_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    # We would add DeviceAccessChecker here typically
    dev = device_repo.get_by_device_id(db, device_id=device_id)
    if not dev:
        raise HTTPException(status_code=404, detail="Device not found")
    return dev

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
    return device_repo.update(db, db_obj=dev, obj_in=device_in)
