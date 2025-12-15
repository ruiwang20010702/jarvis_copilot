from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from database import get_db
from models import SessionLog
from schemas import SessionLogCreate, SessionLog as SessionLogSchema, AIRequest, AIResponse
from services.ai_service import ai_service

router = APIRouter(prefix="/api/sessions", tags=["sessions"])

@router.post("/", response_model=SessionLogSchema)
async def create_session_log(session: SessionLogCreate, db: AsyncSession = Depends(get_db)):
    new_session = SessionLog(
        session_id=session.session_id,
        user_id=session.user_id,
        article_id=session.article_id,
        version_id=session.version_id,
        reading_speed=session.reading_speed,
        looked_up_words=session.looked_up_words,
        quiz_results=session.quiz_results,
        response_rate=session.response_rate
    )
    db.add(new_session)
    await db.commit()
    await db.refresh(new_session)
    return new_session

@router.post("/ai/generate", response_model=AIResponse)
async def generate_ai_response(request: AIRequest):
    try:
        response_text = await ai_service.generate_text(
            prompt=request.prompt,
            model=request.model,
            system_prompt=request.system_prompt
        )
        return AIResponse(
            text=response_text,
            model_used=request.model or ai_service.default_model
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
