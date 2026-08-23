from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.repositories.base import CRUDBase
from backend.models.device import Device
from backend.models.user_device import UserDevice
from backend.schemas.device import DeviceCreate, DeviceUpdate
import uuid

class CRUDDevice(CRUDBase[Device, DeviceCreate, DeviceUpdate]):
    def get_by_device_id(self, db: Session, *, device_id: str) -> Optional[Device]:
        return db.query(Device).filter(Device.device_id == device_id).first()

    def create(self, db: Session, *, obj_in: DeviceCreate, extra_data: dict = None) -> Device:
        obj_in_data = obj_in.model_dump(exclude_unset=True)
        db_obj = Device(
            id=str(uuid.uuid4()),
            **obj_in_data
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_multi_active(self, db: Session, *, skip: int = 0, limit: int = 100) -> Tuple[List[Device], int]:
        query = db.query(Device).filter(Device.is_active == True)
        total = query.count()
        devices = query.offset(skip).limit(limit).all()
        return devices, total

    def user_has_access(self, db: Session, *, user_id: str, device_id: str) -> bool:
        user_dev = db.query(UserDevice).join(Device, UserDevice.device_id == Device.id).filter(
            UserDevice.user_id == user_id,
            Device.device_id == device_id
        ).first()
        return user_dev is not None

device = CRUDDevice(Device)
