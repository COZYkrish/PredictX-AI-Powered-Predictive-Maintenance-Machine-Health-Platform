import uuid
import random
from datetime import datetime, timezone
from backend.db.session import SessionLocal
from backend.models.user import User, RoleEnum
from backend.models.device import Device
from backend.models.user_device import UserDevice, AccessRoleEnum
from backend.repositories.user import pwd_context

def seed():
    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(User).filter_by(email="admin@predictx.io").first():
            print("Database already seeded.")
            return

        print("Seeding database...")
        
        # 1. Create Users
        admin = User(
            id=str(uuid.uuid4()),
            email="admin@predictx.io",
            password_hash=pwd_context.hash("Admin123!"),
            full_name="Admin User",
            role=RoleEnum.ADMIN
        )
        engineer = User(
            id=str(uuid.uuid4()),
            email="engineer@predictx.io",
            password_hash=pwd_context.hash("Engineer123!"),
            full_name="Systems Engineer",
            role=RoleEnum.ENGINEER
        )
        db.add_all([admin, engineer])
        
        # 2. Create Devices
        dev1 = Device(
            id=str(uuid.uuid4()),
            device_id="DEV-M-001",
            display_name="Manufacturing Floor PC 1",
            model="Dell OptiPlex 7090",
            operating_system="Windows 11",
            is_online=True
        )
        dev2 = Device(
            id=str(uuid.uuid4()),
            device_id="DEV-S-105",
            display_name="Server Room Kiosk",
            model="HP EliteDesk 800",
            operating_system="Windows 10",
            is_online=False,
            last_seen_at=datetime.now(timezone.utc)
        )
        db.add_all([dev1, dev2])
        db.flush() # flush to get IDs if needed
        
        # 3. Create User Device access
        ud1 = UserDevice(
            id=str(uuid.uuid4()),
            user_id=engineer.id,
            device_id=dev1.id,
            access_role=AccessRoleEnum.ENGINEER
        )
        db.add(ud1)
        
        db.commit()
        print("Seeding complete.")
        print("Admin: admin@predictx.io / Admin123!")
        print("Engineer: engineer@predictx.io / Engineer123!")
        
    except Exception as e:
        print(f"Error seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
