"""
流式聊天 API - SSE 端点

提供 Server-Sent Events 流式响应，实现打字机效果
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Optional
import json
import os

router = APIRouter(prefix="/api/ai", tags=["chat"])


class ChatMessage(BaseModel):
    role: str  # user | assistant
    content: str


class ChatRequest(BaseModel):
    session_id: str
    messages: List[ChatMessage]
    context: Optional[Dict] = None  # 题目、文章等上下文信息


class ToolCallEvent(BaseModel):
    name: str
    arguments: Dict


# 会话存储（生产环境应使用 Redis）
_chat_sessions: Dict[str, Dict] = {}


def get_system_prompt(context: Dict = None) -> str:
    """获取系统提示词"""
    # 读取 prompt 模板
    prompt_path = os.path.join(os.path.dirname(__file__), "../prompts/coaching_tutor_v2.md")
    system_prompt = ""
    if os.path.exists(prompt_path):
        with open(prompt_path, "r", encoding="utf-8") as f:
            system_prompt = f.read()
    
    # 如果有上下文，替换 prompt 中的占位符
    if context:
        # 定义不同题型的解题技巧
        skills_map = {
            "细节理解题": """步骤1. 题干关键词定位：找到题目中的关键词（如时间、地点、人物或事件)
步骤2. 翻译题干：翻译题干意思，关注特殊疑问词，理解需要回答内容 （原因、具体事物、时间、人物、地点、方式）
步骤3. 文章信息定位：通过题干关键词迅速在文章中找到答题段落和句子
步骤4. 仔细阅读答题段落和句子，与选项对比，选出最符合的答案""",
            
            "主旨大意题": """步骤1. 通读全文：快速通读文章，获取整体概念和主题
步骤2. 寻找主题句：每段的第一句或最后一句通常是主题句，帮助归纳段落大意
步骤3. 概括总结：结合每段主旨和文章概念，总结文章主旨
步骤4. 验证选项：将选项对比总结的文章主旨，选出最接近的答案""",
            
            "推理判断题": """步骤1. 回归文章信息：明确题干要求，找到相关段落或相关句子作为答题依据
步骤2. 理解表面含义：翻译相关段落或句子，关注上下文
步骤3. 分析隐含信息：关注相关句子和段落处的隐含信息，结合上下文进行逻辑推理
步骤4. 验证选项：将选项逐一与所推断内容对比，选出与推断内容一致的答案""",
            
            "词义猜测题": """步骤1. 翻译上下文：仔细阅读目标词前后的句子，进行翻译
步骤2. 注意逻辑关系：通过翻译分析上下文与目标词之间的逻辑关系，判断词义倾向
步骤3. 结合语境推测：结合逻辑关系和上下文翻译，推测生词意思
步骤4. 验证选项：将选项逐一代入到目标词处，检查是否符合猜测的意思，选出正确选项""",
            
            "代词指代题": """步骤1. 定位代词：识别题干中相关的代词，并定位代词在原文的位置
步骤2. 理解上下文：阅读并翻译代词前后的句子或段落
步骤3. 分析关系：判断代词与句子中的其他部分的指代关系，明确指代内容
步骤4. 替换验证：将选项代入代词所在句子，验证是否符合语义和逻辑"""
        }

        # 获取当前题型的解题技巧，默认为细节理解题
        q_type = context.get('question_type', '细节理解题')
        current_skills = skills_map.get(q_type, skills_map["细节理解题"])

        # 准备替换数据
        replacements = {
            "{{article_content}}": context.get('article_content', ''),
            "{{question_stem}}": context.get('question_stem', ''),
            "{{options}}": json.dumps(context.get('options', []), ensure_ascii=False, indent=2),
            "{{correct_answer}}": context.get('correct_answer', ''),
            "{{question_type}}": q_type,
            "{{solving_skills}}": context.get('solving_skills', current_skills)
        }
        
        # 执行替换
        for key, value in replacements.items():
            system_prompt = system_prompt.replace(key, str(value))
            
    return system_prompt


async def generate_sse_stream(request: ChatRequest):
    """生成 SSE 事件流"""
    from services.ai_service import get_coaching_ai_generator
    from services.agents.coaching_tools import COACHING_TOOLS
    
    # 获取或创建会话
    session = _chat_sessions.get(request.session_id, {
        "messages": [],
        "context": request.context or {},
        "wrong_count": 0
    })
    
    # 更新上下文
    if request.context:
        session["context"].update(request.context)
    
    # 添加用户消息到历史
    for msg in request.messages:
        if msg.role == "user":
            session["messages"].append({"role": "user", "content": msg.content})
    
    # 构建消息历史
    messages = session["messages"]
    
    # 获取系统提示词
    system_prompt = get_system_prompt(session["context"])
    
    # 调用流式生成
    full_response = ""
    tool_calls = []
    
    try:
        # get_coaching_ai_generator 根据配置选择 Gemini 或 Doubao
        for event in get_coaching_ai_generator(
            messages=messages,
            tools=COACHING_TOOLS,
            system_prompt=system_prompt
        ):
            if event["type"] == "text":
                # 发送文本增量
                data = json.dumps({"type": "text", "content": event["content"]}, ensure_ascii=False)
                yield f"data: {data}\n\n"
                full_response += event["content"]
                
            elif event["type"] == "tool_call":
                # 发送工具调用
                tool_calls.append(event["content"])
                data = json.dumps({"type": "tool_call", "content": event["content"]}, ensure_ascii=False)
                yield f"data: {data}\n\n"
                
            elif event["type"] == "done":
                # 保存助手回复到历史
                if full_response:
                    session["messages"].append({"role": "assistant", "content": full_response})
                
                # 发送完成事件
                data = json.dumps({
                    "type": "done",
                    "content": full_response,
                    "tool_calls": tool_calls
                }, ensure_ascii=False)
                yield f"data: {data}\n\n"
                
            elif event["type"] == "error":
                data = json.dumps({"type": "error", "content": event["content"]}, ensure_ascii=False)
                yield f"data: {data}\n\n"
        
        # 更新会话
        _chat_sessions[request.session_id] = session
        
    except Exception as e:
        error_data = json.dumps({"type": "error", "content": str(e)}, ensure_ascii=False)
        yield f"data: {error_data}\n\n"


@router.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """
    流式对话接口，返回 SSE 事件流
    
    事件类型:
    - text: 文本增量 {"type": "text", "content": "..."}
    - tool_call: 工具调用 {"type": "tool_call", "content": {"name": "...", "arguments": {...}}}
    - done: 完成 {"type": "done", "content": "完整文本", "tool_calls": [...]}
    - error: 错误 {"type": "error", "content": "错误信息"}
    """
    return StreamingResponse(
        generate_sse_stream(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # 禁用 Nginx 缓冲
        }
    )


async def generate_init_stream(request: ChatRequest):
    """生成初始化问候语的 SSE 流"""
    import uuid
    from services.ai_service import get_coaching_ai_generator
    from services.agents.coaching_tools import COACHING_TOOLS
    
    session_id = request.session_id or str(uuid.uuid4())
    
    # 创建会话
    context = request.context or {}
    _chat_sessions[session_id] = {
        "messages": [],
        "context": context,
        "wrong_count": 0
    }
    
    # 先发送 session_id
    yield f"data: {json.dumps({'type': 'session', 'session_id': session_id}, ensure_ascii=False)}\n\n"
    
    system_prompt = get_system_prompt(context)
    
    # 检查是否全对
    if context.get("all_correct"):
        full_greeting = "太棒了！你已经做全对了！🎉 我们可以直接进入下一阶段。"
        yield f"data: {json.dumps({'type': 'text', 'content': full_greeting}, ensure_ascii=False)}\n\n"
        # 可以选择性地发送一个完成信号或工具调用
        return

    init_message = "开始教学，请执行 Phase 1 诊断步骤。"
    
    full_greeting = ""
    tool_calls = []
    
    try:
        for event in get_coaching_ai_generator(
            messages=[{"role": "user", "content": init_message}],
            tools=COACHING_TOOLS,
            system_prompt=system_prompt
        ):
            if event["type"] == "text":
                full_greeting += event["content"]
                # 逐块发送文本
                data = json.dumps({"type": "text", "content": event["content"]}, ensure_ascii=False)
                yield f"data: {data}\n\n"
            elif event["type"] == "tool_call":
                tool_calls.append(event["content"])
                data = json.dumps({"type": "tool_call", "content": event["content"]}, ensure_ascii=False)
                yield f"data: {data}\n\n"
    except Exception as e:
        print(f"[ChatInit Stream] AI generation failed: {e}")
        # Fallback
        student_name = context.get("student_name", "同学")
        question_index = context.get("question_index", 1)
        full_greeting = f"哎呀 {student_name}，第 {question_index} 题掉坑里了 🙈"
        tool_calls = [{"name": "publish_voice_task", "arguments": {"instruction": "请用语音告诉我你的想法"}}]
        yield f"data: {json.dumps({'type': 'text', 'content': full_greeting}, ensure_ascii=False)}\n\n"
    
    # 如果 AI 只返回 tool_call 没有文本，使用 instruction 作为问候语
    if not full_greeting.strip() and tool_calls:
        tc = tool_calls[0]
        instruction = tc.get("arguments", {}).get("instruction", "")
        if instruction:
            full_greeting = instruction
            yield f"data: {json.dumps({'type': 'text', 'content': full_greeting}, ensure_ascii=False)}\n\n"
    
    # 保存到历史
    _chat_sessions[session_id]["messages"].append({
        "role": "assistant",
        "content": full_greeting
    })
    
    # 发送完成事件
    suggested_task = None
    if tool_calls:
        tc = tool_calls[0]
        task_type_map = {
            "publish_voice_task": "voice",
            "publish_highlight_task": "highlight", 
            "publish_select_task": "select"
        }
        suggested_task = {
            "type": task_type_map.get(tc["name"], "voice"),
            "instruction": tc.get("arguments", {}).get("instruction", "请完成任务"),
            "target": tc.get("arguments", {}).get("target")
        }
    
    done_data = json.dumps({
        "type": "done",
        "greeting": full_greeting,
        "suggested_task": suggested_task,
        "tool_calls": tool_calls
    }, ensure_ascii=False)
    yield f"data: {done_data}\n\n"


@router.post("/chat/init-stream")
async def init_chat_session_stream(request: ChatRequest):
    """
    流式初始化聊天会话 - 逐字输出问候语
    """
    return StreamingResponse(
        generate_init_stream(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@router.post("/chat/init")
async def init_chat_session(request: ChatRequest):
    """
    初始化聊天会话
    
    返回会话 ID 和 AI 生成的初始问候语
    """
    import uuid
    from services.ai_service import get_coaching_ai_generator
    from services.agents.coaching_tools import COACHING_TOOLS
    
    session_id = request.session_id or str(uuid.uuid4())
    
    # 创建会话
    context = request.context or {}
    _chat_sessions[session_id] = {
        "messages": [],
        "context": context,
        "wrong_count": 0
    }
    
    # 使用 AI 生成初始问候语
    system_prompt = get_system_prompt(context)
    
    # 构建初始消息，让 AI 以 Phase 1 诊断开始
    init_message = "开始教学，请执行 Phase 1 诊断步骤。"
    
    full_greeting = ""
    tool_calls = []
    
    try:
        for event in get_coaching_ai_generator(
            messages=[{"role": "user", "content": init_message}],
            tools=COACHING_TOOLS,
            system_prompt=system_prompt
        ):
            if event["type"] == "text":
                full_greeting += event["content"]
            elif event["type"] == "tool_call":
                tool_calls.append(event["content"])
    except Exception as e:
        print(f"[ChatInit] AI generation failed: {e}")
        # Fallback 到固定问候语
        student_name = context.get("student_name", "同学")
        question_index = context.get("question_index", 1)
        student_answer = context.get("student_answer", "?")
        full_greeting = f"哎呀 {student_name}，第 {question_index} 题掉坑里了 🙈\n\n你选了 {student_answer}，能悄悄告诉 Jarvis 为什么选它吗？"
        tool_calls = [{"name": "publish_voice_task", "arguments": {"instruction": "请用语音告诉我你的想法"}}]
    
    # 如果 AI 只返回了 tool_call 没有文本，使用 tool_call 的 instruction 作为问候语
    if not full_greeting.strip() and tool_calls:
        tc = tool_calls[0]
        instruction = tc.get("arguments", {}).get("instruction", "")
        if instruction:
            full_greeting = instruction
    
    # 保存到历史
    _chat_sessions[session_id]["messages"].append({
        "role": "assistant",
        "content": full_greeting
    })
    
    # 提取 suggested_task
    suggested_task = None
    if tool_calls:
        tc = tool_calls[0]
        task_type_map = {
            "publish_voice_task": "voice",
            "publish_highlight_task": "highlight", 
            "publish_select_task": "select"
        }
        suggested_task = {
            "type": task_type_map.get(tc["name"], "voice"),
            "instruction": tc.get("arguments", {}).get("instruction", "请完成任务"),
            "target": tc.get("arguments", {}).get("target")  # article 或 question
        }
    
    return {
        "session_id": session_id,
        "greeting": full_greeting,
        "suggested_task": suggested_task,
        "tool_calls": tool_calls
    }


@router.get("/chat/history/{session_id}")
async def get_chat_history(session_id: str):
    """获取聊天历史"""
    session = _chat_sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "session_id": session_id,
        "messages": session["messages"],
        "context": session["context"]
    }


@router.delete("/chat/{session_id}")
async def delete_chat_session(session_id: str):
    """删除聊天会话"""
    if session_id in _chat_sessions:
        del _chat_sessions[session_id]
    return {"success": True}
