import os
import asyncio
from datetime import datetime, timedelta
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

async def cleanup_telemetry(db_url: str, days: int):
    engine = create_async_engine(db_url)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    print(f"Cleaning telemetry older than {cutoff_date.isoformat()}")
    
    async with async_session() as session:
        # Note: Depending on the ORM models, we can use raw SQL for performance
        query = text("DELETE FROM telemetry WHERE timestamp_utc < :cutoff")
        result = await session.execute(query, {"cutoff": cutoff_date})
        await session.commit()
        print(f"Deleted {result.rowcount} records.")

def main():
    load_dotenv()
    db_url = os.getenv("DATABASE_URL")
    retention_days = int(os.getenv("TELEMETRY_RETENTION_DAYS", "90"))
    
    if not db_url:
        print("DATABASE_URL not set.")
        exit(1)
    
    # Replace posgresql:// with postgresql+asyncpg:// if needed
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        
    asyncio.run(cleanup_telemetry(db_url, retention_days))

if __name__ == "__main__":
    main()
