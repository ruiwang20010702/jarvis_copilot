from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- User Schemas ---
class UserProfileBase(BaseModel):
    username: str
    role: str
    level: str = "L0"
    tags: List[str] = []

class UserProfileCreate(UserProfileBase):
    pass

class UserProfile(UserProfileBase):
    id: int
    total_reading_time: int
    vocab_mastered_count: int
    surgery_completed_count: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Article Schemas ---
class ArticleBase(BaseModel):
    title: str
    content: str
    genre: Optional[str] = None
    specific_topic: Optional[str] = None

class Article(ArticleBase):
    id: int
    grading_data: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True

# --- Session Schemas ---
class SessionLogCreate(BaseModel):
    session_id: str
    user_id: int
    article_id: int
    version_id: int
    reading_speed: Optional[int] = None
    looked_up_words: List[str] = []
    quiz_results: List[Dict[str, Any]] = []
    response_rate: float = 0.0

class SessionLog(SessionLogCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- AI Request Schemas ---
class AIRequest(BaseModel):
    prompt: str
    system_prompt: Optional[str] = None
    model: Optional[str] = None # "zhipu" or "gemini"

class AIResponse(BaseModel):
    text: str
    model_used: str
