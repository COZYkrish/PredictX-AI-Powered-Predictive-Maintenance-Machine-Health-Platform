from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from pydantic import ValidationError

from backend.config import settings
from backend.db.session import get_db
from backend.models.user import User, RoleEnum
from backend.repositories.user import user as user_repo
from backend.repositories.device import device as device_repo
from backend.schemas.auth import TokenPayload

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"/api/v1/auth/login"
)

def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(reusable_oauth2)
) -> User:
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    user_obj = user_repo.get(db, id=token_data.sub)
    if not user_obj:
        raise HTTPException(status_code=404, detail="User not found")
    if not user_obj.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user_obj

def get_current_active_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="The user doesn't have enough privileges"
        )
    return current_user

class DeviceAccessChecker:
    def __init__(self, check_admin: bool = True):
        self.check_admin = check_admin

    def __call__(
        self, device_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
    ):
        if self.check_admin and current_user.role == RoleEnum.ADMIN:
            return True
            
        has_access = device_repo.user_has_access(db, user_id=current_user.id, device_id=device_id)
        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions to access this device"
            )
        return True
