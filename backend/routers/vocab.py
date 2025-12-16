from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, List

from database import get_db
from models import VocabCard

router = APIRouter(prefix="/api/vocab", tags=["vocab"])


class VocabLookupRequest(BaseModel):
    word: str
    context_sentence: Optional[str] = None  # 学生划词时的原句


class VocabLookupResponse(BaseModel):
    word: str
    phonetic: Optional[str] = None
    definition: Optional[str] = None
    syllables: List[str] = []
    example: Optional[str] = None
    audio_url: Optional[str] = None
    ai_memory_hint: Optional[str] = None


@router.post("/lookup", response_model=VocabLookupResponse)
async def lookup_word(request: VocabLookupRequest, db: AsyncSession = Depends(get_db)):
    """
    查询单词信息 - 增强版
    1. 先查本地 vocab_cards 表（缓存）
    2. 如果不存在，使用 LLM 生成完整数据并保存
    """
    from services.vocab_service import vocab_service
    
    word = request.word.lower().strip()
    
    # 先从数据库查找
    result = await db.execute(
        select(VocabCard).where(VocabCard.word.ilike(word))
    )
    vocab_card = result.scalars().first()
    
    if vocab_card:
        return VocabLookupResponse(
            word=vocab_card.word,
            phonetic=vocab_card.phonetic,
            definition=vocab_card.definition,
            syllables=vocab_card.syllables or [],
            example=request.context_sentence or vocab_card.context_sentence,
            audio_url=vocab_card.audio_url,
            ai_memory_hint=vocab_card.ai_memory_hint,
        )
    
    # 数据库没有，使用 VocabService 生成
    vocab_data = await vocab_service.generate_vocab_data(
        word=word,
        context_sentence=request.context_sentence
    )
    
    # 保存到数据库（缓存）
    new_card = VocabCard(
        word=word,
        phonetic=vocab_data.get("phonetic"),
        definition=vocab_data.get("definition"),
        syllables=vocab_data.get("syllables", []),
        context_sentence=vocab_data.get("example"),
        ai_memory_hint=vocab_data.get("ai_memory_hint"),
        audio_url=vocab_data.get("audio_url"),
    )
    db.add(new_card)
    await db.commit()
    
    return VocabLookupResponse(
        word=word,
        phonetic=vocab_data.get("phonetic"),
        definition=vocab_data.get("definition"),
        syllables=vocab_data.get("syllables", []),
        example=vocab_data.get("example"),
        audio_url=vocab_data.get("audio_url"),
        ai_memory_hint=vocab_data.get("ai_memory_hint"),
    )

