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


# 6步教学阶段配置
COACHING_PHASES = {
    1: {"name": "归因诊断", "name_en": "Diagnosis", "task_type": "voice"},
    2: {"name": "技能召回", "name_en": "Recall", "task_type": "gps"},
    3: {"name": "路标定位", "name_en": "Guide", "task_type": "highlight"},
    4: {"name": "搜原句", "name_en": "Locate", "task_type": "highlight"},
    5: {"name": "纠偏锁定", "name_en": "Match", "task_type": "select"},
    6: {"name": "技巧复盘", "name_en": "Review", "task_type": "review"},
}


class GenerateScriptRequest(BaseModel):
    question_id: int
    student_answer: str
    phase: int = 1  # 当前教学步骤 (1-6)
    student_level: str = "L0"
    student_name: str = "Alex"  # 学生名字


class GenerateScriptResponse(BaseModel):
    phase: int
    phase_name: str
    script: str
    suggested_action: str
    next_phase: Optional[int]


@router.post("/coaching/generate", response_model=GenerateScriptResponse)
async def generate_coaching_script(
    request: GenerateScriptRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    使用 Gemini AI 实时生成苏格拉底式教学话术
    """
    from services.ai_service import ai_service
    
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
    question_type = question.type or "细节理解题"
    solving_steps = SOLVING_STEPS.get(question_type, SOLVING_STEPS.get("细节理解题", []))
    
    # 获取当前阶段配置
    phase_config = COACHING_PHASES.get(request.phase, COACHING_PHASES[1])
    
    # 读取 prompt 模板
    prompt_path = os.path.join(os.path.dirname(__file__), "../prompts/coaching_tutor.md")
    system_prompt = ""
    if os.path.exists(prompt_path):
        with open(prompt_path, "r", encoding="utf-8") as f:
            system_prompt = f.read()
    
    # 构建用户 prompt
    user_prompt = f"""
请为以下教学场景生成第 {request.phase} 步（{phase_config['name']}）的教学话术。

## 上下文信息

**文章内容**:
{article_content[:1500]}...

**题目**:
{question.stem}

**选项**:
{', '.join(question.options) if question.options else '无'}

**正确答案**: {question.correct_answer}
**学生选择**: {request.student_answer}
**学生姓名**: {request.student_name}
**学生水平**: {request.student_level}
**题目类型**: {question_type}
**解题步骤**: {solving_steps}

## 任务要求

生成第 {request.phase} 步「{phase_config['name']}」的话术，要求：
1. 使用中文，风趣幽默，带 emoji
2. 不要直接告诉答案
3. 引导学生自主思考
4. 话术不要太长，2-4句为佳

请直接输出话术内容，不需要其他格式。
"""
    
    try:
        # 调用 AI 生成
        script = await ai_service.generate_text(
            prompt=user_prompt,
            system_prompt=system_prompt[:2000] if system_prompt else None,
            model="gemini"
        )
        
        # 清理可能的格式问题
        script = script.strip()
        if script.startswith('"') and script.endswith('"'):
            script = script[1:-1]
        
    except Exception as e:
        # Fallback 到预设话术
        print(f"AI generation failed: {e}")
        fallback_scripts = {
            1: f"哎呀 {request.student_name}，这道题掉坑里了。🙈\n\n你选了 {request.student_answer}，能悄悄告诉 Jarvis 为什么选它吗？",
            2: "有道理！但别急，拿出我们的 GPS 卡！🧭\n\n第一步是啥来着？圈路标！",
            3: "Bingo！路标找得很准 👏\n\n现在，我们要去文章里找'原因'的替身了。",
            4: "带着路标去扫一扫 🔍\n\n找到那句提到关键信息的话了吗？",
            5: "真相大白了 💡\n\n再给你一次机会，现在你会选哪个？",
            6: f"太棒了 {request.student_name}！🎉\n\n我们来复盘一下这道题是怎么解出来的...",
        }
        script = fallback_scripts.get(request.phase, "让我们继续下一步...")
    
    # 生成建议操作
    action_map = {
        "voice": "点击【发布任务】让学生语音回答",
        "gps": "点击【发布任务】发送GPS卡片",
        "highlight": "引导学生在文章中画线标记",
        "select": "展示选项对比，引导学生改选",
        "review": "展示复盘总结"
    }
    suggested_action = action_map.get(phase_config["task_type"], "继续引导")
    
    # 计算下一步
    next_phase = request.phase + 1 if request.phase < 6 else None
    
    return GenerateScriptResponse(
        phase=request.phase,
        phase_name=phase_config["name"],
        script=script,
        suggested_action=suggested_action,
        next_phase=next_phase
    )

