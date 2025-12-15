from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, List

from database import get_db
from models import UserProfile

router = APIRouter(prefix="/api/users", tags=["users"])


class UserCreateRequest(BaseModel):
    username: str
    role: str = "student"  # student or coach
    level: str = "L0"
    tags: Optional[List[str]] = None


class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    level: str
    tags: Optional[List[str]] = None
    total_reading_time: int = 0
    vocab_mastered_count: int = 0
    surgery_completed_count: int = 0

    class Config:
        from_attributes = True


@router.get("/{username}", response_model=UserResponse)
async def get_user(username: str, db: AsyncSession = Depends(get_db)):
    """获取用户信息"""
    result = await db.execute(
        select(UserProfile).where(UserProfile.username == username)
    )
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user


@router.post("/", response_model=UserResponse)
async def create_user(request: UserCreateRequest, db: AsyncSession = Depends(get_db)):
    """创建新用户"""
    # 检查用户名是否已存在
    result = await db.execute(
        select(UserProfile).where(UserProfile.username == request.username)
    )
    existing = result.scalars().first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # 创建新用户
    user = UserProfile(
        username=request.username,
        role=request.role,
        level=request.level,
        tags=request.tags,
    )
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    return user
