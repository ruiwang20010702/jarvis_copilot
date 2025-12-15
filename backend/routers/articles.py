from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List

from database import get_db
from models import Article, Version
from schemas import Article as ArticleSchema

router = APIRouter(prefix="/api/articles", tags=["articles"])

@router.get("/", response_model=List[ArticleSchema])
async def get_articles(skip: int = 0, limit: int = 10, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Article)
        .options(selectinload(Article.versions))
        .offset(skip)
        .limit(limit)
    )
    articles = result.scalars().all()
    return articles

@router.get("/{article_id}", response_model=ArticleSchema)
async def get_article(article_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Article)
        .where(Article.id == article_id)
        .options(selectinload(Article.versions))
    )
    article = result.scalars().first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article

@router.get("/{article_id}/versions/{level}")
async def get_article_version(article_id: int, level: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Version)
        .where(Version.article_id == article_id, Version.level == level)
        .options(
            selectinload(Version.questions),
            selectinload(Version.sentence_surgeries),
            selectinload(Version.vocab_cards)
        )
    )
    version = result.scalars().first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    return version
