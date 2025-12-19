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
    version_id: Optional[int] = None  # 关联的版本ID


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
    
    # 构建查询条件
    query = select(VocabCard).where(VocabCard.word.ilike(word))
    
    # 如果提供了 version_id，优先查找该版本的卡片
    if request.version_id:
        query = query.where(VocabCard.version_id == request.version_id)
    
    result = await db.execute(query)
    vocab_card = result.scalars().first()
    
    if not vocab_card and request.version_id:
        # 尝试查找任意版本的同名卡片，用于复用（避免 LLM 调用）
        fallback_query = select(VocabCard).where(VocabCard.word.ilike(word)).limit(1)
        fallback_result = await db.execute(fallback_query)
        existing_card = fallback_result.scalars().first()
        
        if existing_card:
            # 复用现有卡片内容，但创建新卡片关联到当前 version_id
            new_card = VocabCard(
                version_id=request.version_id,
                word=existing_card.word,
                phonetic=existing_card.phonetic,
                definition=existing_card.definition,
                syllables=existing_card.syllables,
                context_sentence=request.context_sentence or existing_card.context_sentence,
                ai_memory_hint=existing_card.ai_memory_hint,
                audio_url=existing_card.audio_url,
                difficulty_level=existing_card.difficulty_level
            )
            db.add(new_card)
            await db.commit()
            await db.refresh(new_card)
            vocab_card = new_card

    if vocab_card:
        # 提取包含单词的句子（如果提供了上下文）
        example_sentence = vocab_card.context_sentence
        if request.context_sentence:
            example_sentence = vocab_service._extract_sentence_with_word(
                request.context_sentence, word
            )
        
        return VocabLookupResponse(
            word=vocab_card.word,
            phonetic=vocab_card.phonetic,
            definition=vocab_card.definition,
            syllables=vocab_card.syllables or [],
            example=example_sentence,
            audio_url=vocab_card.audio_url,
            ai_memory_hint=vocab_card.ai_memory_hint,
        )
    
    # 数据库完全没有，使用 VocabService 生成
    vocab_data = await vocab_service.generate_vocab_data(
        word=word,
        context_sentence=request.context_sentence
    )
    
    # 保存到数据库
    new_card = VocabCard(
        version_id=request.version_id,  # 关联到版本
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
