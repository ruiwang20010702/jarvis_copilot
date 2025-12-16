"""
AI Coaching API Router
实时生成苏格拉底式教学话术
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, List, Dict
import os

from database import get_db
from models import Question, Version, Article

router = APIRouter(prefix="/api/ai", tags=["ai"])


# 题型对应的解题步骤
SOLVING_STEPS: Dict[str, List[str]] = {
    "细节理解题": [
        "步骤1：题干关键词定位 - 找到题目中的关键词（如时间、地点、人物或事件）",
        "步骤2：翻译题干 - 理解需要回答的内容（原因、具体事物、时间、人物、地点、方式）",
        "步骤3：文章信息定位 - 通过题干关键词在文章中快速找到答题段落和句子",
        "步骤4：对比选项 - 仔细阅读答题段落和句子，与选项对比，选出最符合的答案"
    ],
    "主旨大意题": [
        "步骤1：通读全文 - 快速通读文章，获取整体概念和主题",
        "步骤2：寻找主题句 - 每段的第一句或最后一句通常是主题句，帮助归纳段落大意",
        "步骤3：概括总结 - 结合每段主旨和文章概念，总结文章主旨",
        "步骤4：验证选项 - 将选项对比主旨文章主旨，选出最接近的答案"
    ],
    "推理判断题": [
        "步骤1：回归文章信息 - 明确题干要求，找到相关段落或相关句子作为答题依据",
        "步骤2：理解表面含义 - 翻译相关段落或句子，关注上下文",
        "步骤3：分析隐含信息 - 关注相关句子和段落处的隐含信息，结合上下文进行逻辑推理",
        "步骤4：验证选项 - 将选项逐一与所推断内容对比，选出与推断内容一致的答案"
    ],
    "词义猜测题": [
        "步骤1：翻译上下文 - 仔细阅读目标词前后的句子，进行翻译",
        "步骤2：注意逻辑关系 - 通过翻译分析上下文与目标词之间的逻辑关系，判断词义倾向",
        "步骤3：结合语境推测 - 结合逻辑关系和上下文翻译，推测生词意思",
        "步骤4：验证选项 - 将选项逐一代入到目标词处，检查是否符合猜测的意思，选出正确选项"
    ],
    "代词指代题": [
        "步骤1：定位代词 - 识别题干中相关的代词，并定位代词在原文的位置",
        "步骤2：理解上下文 - 阅读并翻译代词前后的句子或段落",
        "步骤3：分析关系 - 判断代词与句子中的其他部分的指代关系，明确指代内容",
        "步骤4：替换验证 - 将选项代入代词所在的句子，验证是否符合语义和逻辑"
    ],
    # 英文题型映射
    "detail": [
        "步骤1：题干关键词定位 - 找到题目中的关键词",
        "步骤2：翻译题干 - 理解需要回答的内容",
        "步骤3：文章信息定位 - 在文章中快速找到答题段落",
        "步骤4：对比选项 - 与选项对比，选出最符合的答案"
    ],
    "main_idea": [
        "步骤1：通读全文 - 获取整体概念和主题",
        "步骤2：寻找主题句 - 找每段首尾句",
        "步骤3：概括总结 - 总结文章主旨",
        "步骤4：验证选项 - 选出最接近的答案"
    ],
    "inference": [
        "步骤1：回归文章信息 - 找到相关段落作为依据",
        "步骤2：理解表面含义 - 翻译相关内容",
        "步骤3：分析隐含信息 - 进行逻辑推理",
        "步骤4：验证选项 - 选出与推断一致的答案"
    ],
    "vocabulary": [
        "步骤1：翻译上下文 - 阅读目标词前后句子",
        "步骤2：注意逻辑关系 - 判断词义倾向",
        "步骤3：结合语境推测 - 推测生词意思",
        "步骤4：验证选项 - 代入检验"
    ],
    "reference": [
        "步骤1：定位代词 - 定位代词在原文的位置",
        "步骤2：理解上下文 - 翻译代词前后内容",
        "步骤3：分析关系 - 明确指代内容",
        "步骤4：替换验证 - 代入验证语义"
    ]
}


class CoachingRequest(BaseModel):
    question_id: int
    student_answer: str  # e.g., "B"
    correct_answer: str  # e.g., "A"
    student_level: str = "L0"  # L0-L3


class CoachingResponse(BaseModel):
    solving_steps: List[str]
    question_type: str
    error_tags: List[str]
    prompt_context: dict  # 用于前端构建完整 prompt


@router.post("/coaching", response_model=CoachingResponse)
async def generate_coaching_context(
    request: CoachingRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    生成 AI Coaching 上下文
    返回题型对应的解题步骤和相关信息
    """
    # 获取题目信息
    result = await db.execute(
        select(Question).where(Question.id == request.question_id)
    )
    question = result.scalars().first()
    
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # 获取版本和文章信息
    version_result = await db.execute(
        select(Version).where(Version.id == question.version_id)
    )
    version = version_result.scalars().first()
    
    article_content = ""
    if version:
        article_result = await db.execute(
            select(Article).where(Article.id == version.article_id)
        )
        article = article_result.scalars().first()
        if article:
            article_content = version.content or article.content
    
    # 获取题型对应的解题步骤
    question_type = question.type or "detail"
    solving_steps = SOLVING_STEPS.get(question_type, SOLVING_STEPS.get("detail", []))
    
    # 获取错误归因标签
    error_tags = question.error_tags or []
    
    # 构建 prompt 上下文
    prompt_context = {
        "article": article_content,
        "question": {
            "id": question.id,
            "stem": question.stem,
            "options": question.options,
            "correct_answer": question.correct_answer,
            "type": question_type,
            "error_tags": error_tags,
            "trap_type": question.trap_type
        },
        "student": {
            "selected_answer": request.student_answer,
            "level": request.student_level
        },
        "solving_steps": solving_steps
    }
    
    return CoachingResponse(
        solving_steps=solving_steps,
        question_type=question_type,
        error_tags=error_tags,
        prompt_context=prompt_context
    )


@router.get("/solving-steps/{question_type}")
async def get_solving_steps(question_type: str):
    """
    获取指定题型的解题步骤
    """
    steps = SOLVING_STEPS.get(question_type)
    if not steps:
        # 尝试中文题型名
        type_mapping = {
            "detail": "细节理解题",
            "main_idea": "主旨大意题",
            "inference": "推理判断题",
            "vocabulary": "词义猜测题",
            "reference": "代词指代题"
        }
        chinese_type = type_mapping.get(question_type)
        if chinese_type:
            steps = SOLVING_STEPS.get(chinese_type, [])
        else:
            steps = SOLVING_STEPS.get("detail", [])
    
    return {
        "question_type": question_type,
        "solving_steps": steps
    }
