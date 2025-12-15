import asyncio
from database import engine, Base
from models import UserProfile, SessionLog

async def init_db():
    async with engine.begin() as conn:
        # Create tables that don't exist
        # We only want to create UserProfile and SessionLog if they don't exist
        # Base.metadata.create_all will check for existence
        await conn.run_sync(Base.metadata.create_all)
    
    print("Database initialized successfully!")

if __name__ == "__main__":
    asyncio.run(init_db())
