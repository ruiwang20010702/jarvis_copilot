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


class VocabLookupResponse(BaseModel):
    word: str
    phonetic: Optional[str] = None
    definition: Optional[str] = None
    syllables: List[str] = []
    example: Optional[str] = None


@router.post("/lookup", response_model=VocabLookupResponse)
async def lookup_word(request: VocabLookupRequest, db: AsyncSession = Depends(get_db)):
    """
    查询单词信息
    1. 先查本地 vocab_cards 表（作为缓存）
    2. 如果不存在，返回基础信息（后续可扩展外部 API）
    """
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
            example=vocab_card.context_sentence,
        )
    
    # 如果数据库没有，返回基础信息
    # TODO: 后续可以调用外部字典 API (如有道词典)
    return VocabLookupResponse(
        word=word,
        phonetic=None,
        definition=f"Definition for '{word}' not found in database",
        syllables=[],
        example=None,
    )
