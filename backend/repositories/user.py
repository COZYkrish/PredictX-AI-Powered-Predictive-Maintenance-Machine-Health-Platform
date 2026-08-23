from typing import Optional
from sqlalchemy.orm import Session
from backend.repositories.base import CRUDBase
from backend.models.user import User
from backend.schemas.user import UserCreate, UserUpdate
from passlib.context import CryptContext
import uuid

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    def get_by_email(self, db: Session, *, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

    def create(self, db: Session, *, obj_in: UserCreate) -> User:
        db_obj = User(
            id=str(uuid.uuid4()),
            email=obj_in.email,
            password_hash=pwd_context.hash(obj_in.password),
            full_name=obj_in.full_name,
            role=obj_in.role
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def authenticate(self, db: Session, *, email: str, password: str) -> Optional[User]:
        user = self.get_by_email(db, email=email)
        if not user:
            return None
        if not pwd_context.verify(password, user.password_hash):
            return None
        return user
        
    def is_active(self, user: User) -> bool:
        return user.is_active

user = CRUDUser(User)
