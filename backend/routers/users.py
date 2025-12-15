from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from database import get_db
from models import UserProfile
from schemas import UserProfileCreate, UserProfile as UserProfileSchema

router = APIRouter(prefix="/api/users", tags=["users"])

@router.post("/", response_model=UserProfileSchema)
async def create_user(user: UserProfileCreate, db: AsyncSession = Depends(get_db)):
    # Check if user exists
    result = await db.execute(select(UserProfile).where(UserProfile.username == user.username))
    existing_user = result.scalars().first()
    if existing_user:
        return existing_user # Return existing for simplicity in this MVP

    new_user = UserProfile(
        username=user.username,
        role=user.role,
        level=user.level,
        tags=user.tags
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

@router.get("/{username}", response_model=UserProfileSchema)
async def get_user(username: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UserProfile).where(UserProfile.username == username))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
