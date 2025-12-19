import os
from zhipuai import ZhipuAI
from google import genai
from google.genai import types
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

load_dotenv()

class AIService:
    def __init__(self):
        self.default_model = os.getenv("DEFAULT_AI_MODEL", "gemini")
        self.zhipu_api_key = os.getenv("ZHIPU_API_KEY")
        self.gemini_api_key = os.getenv("GEMINI_API_KEY")
        
        self.zhipu_client = None
        if self.zhipu_api_key:
            self.zhipu_client = ZhipuAI(api_key=self.zhipu_api_key)
            
        self.gemini_client = None
        if self.gemini_api_key:
            self.gemini_client = genai.Client(api_key=self.gemini_api_key)

    async def generate_text(self, prompt: str, model: Optional[str] = None, system_prompt: Optional[str] = None) -> str:
        """
        Generate text using the specified or default AI model.
        """
        target_model = model or self.default_model
        
        if target_model == "zhipu":
            return self._generate_zhipu(prompt, system_prompt)
        elif target_model == "gemini":
            return self._generate_gemini(prompt, system_prompt)
        elif target_model == "doubao":
            return await self._generate_doubao(prompt, system_prompt)
        else:
            raise ValueError(f"Unsupported AI model: {target_model}")

    def _generate_zhipu(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        if not self.zhipu_client:
            raise ValueError("Zhipu API key not configured")
            
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        response = self.zhipu_client.chat.completions.create(
            model="glm-4-flash", 
            messages=messages,
        )
        return response.choices[0].message.content

    def _generate_gemini(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        if not self.gemini_client:
            raise ValueError("Gemini API key not configured")
            
        full_prompt = prompt
        if system_prompt:
            full_prompt = f"System Instruction: {system_prompt}\n\nUser Request: {prompt}"
        
        # 思考级别配置
        # GEMINI_THINKING_LEVEL=off  → Gemini 2.0 Flash (最快, ~0.5-1.5s)
        # GEMINI_THINKING_LEVEL=low  → Gemini 3 + thinking_level="low" (较快, ~2-3s)
        # GEMINI_THINKING_LEVEL=high → Gemini 3 + thinking_level="high" (深度, ~3-5s)
        thinking_level = os.getenv("GEMINI_THINKING_LEVEL", "off").lower()
        
        try:
            if thinking_level in ["low", "high"]:
                # 使用 Gemini 3 思考模式
                config = types.GenerateContentConfig(
                    thinking_config=types.ThinkingConfig(thinking_level=thinking_level)
                )
                response = self.gemini_client.models.generate_content(
                    model="gemini-3-pro-preview",
                    contents=full_prompt,
                    config=config
                )
            else:
                # 默认使用 Gemini 2.0 Flash（最快响应）
                response = self.gemini_client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=full_prompt
                )
            return response.text
        except Exception as e:
            # Fallback to gemini-2.0-flash if Gemini 3 fails
            if thinking_level in ["low", "high"]:
                print(f"Gemini 3 ({thinking_level}) failed: {e}, falling back to gemini-2.0-flash")
                try:
                    response = self.gemini_client.models.generate_content(
                        model="gemini-2.0-flash",
                        contents=full_prompt
                    )
                    return response.text
                except Exception as e2:
                    raise ValueError(f"Gemini generation failed: {e2}")
            raise ValueError(f"Gemini generation failed: {e}")

    async def _generate_doubao(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """使用豆包生成文本（同步调用，非流式）"""
        import httpx
        import json
        
        api_key = os.getenv("ARK_API_KEY")
        model = os.getenv("ARK_MODEL", "doubao-seed-1-8-251215")
        base_url = os.getenv("ARK_BASE_URL", "https://ark.cn-beijing.volces.com/api/v3")
        
        if not api_key:
            raise ValueError("ARK_API_KEY not configured")
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        request_body = {
            "model": model,
            "messages": messages,
            "stream": False
        }
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{base_url}/chat/completions",
                json=request_body,
                headers=headers
            )
            
            if response.status_code != 200:
                raise ValueError(f"Doubao API error: {response.status_code} - {response.text}")
            
            data = response.json()
            return data["choices"][0]["message"]["content"]

# Singleton instance
ai_service = AIService()


async def generate_stream_with_tools(
    messages: list,
    tools: list = None,
    system_prompt: str = None
):
    """
    流式生成对话响应，支持 Function Calling（异步版本）
    
    Args:
        messages: 对话历史 [{"role": "user/assistant", "content": "..."}]
        tools: 可用工具列表
        system_prompt: 系统提示词
    
    Yields:
        dict: {"type": "text/tool_call/done", "content": ...}
    """
    if not ai_service.gemini_client:
        yield {"type": "error", "content": "Gemini API key not configured"}
        return
    
    # 构建消息内容
    contents = []
    for msg in messages:
        role = "user" if msg["role"] == "user" else "model"
        contents.append({"role": role, "parts": [{"text": msg["content"]}]})
    
    # 添加系统提示词
    if system_prompt:
        contents.insert(0, {"role": "user", "parts": [{"text": f"[System Instruction]\n{system_prompt}"}]})
        contents.insert(1, {"role": "model", "parts": [{"text": "understood, I will follow these instructions."}]})
    
    try:
        # 使用 Gemini 3 Pro + thinking level low 进行流式生成
        from google.genai import types
        
        # 转换工具定义为 Gemini 格式
        gemini_tools = None
        if tools:
            function_declarations = []
            for tool in tools:
                function_declarations.append(
                    types.FunctionDeclaration(
                        name=tool["name"],
                        description=tool["description"],
                        parameters=tool["parameters"]
                    )
                )
            gemini_tools = [types.Tool(function_declarations=function_declarations)]

        # 使用 Gemini 3 Pro + thinking level low
        config = types.GenerateContentConfig(
            temperature=0.7,
            max_output_tokens=2048,
            tools=gemini_tools,
            thinking_config=types.ThinkingConfig(thinking_level="low")
        )
        
        print("[AIService] 🧠 Using Gemini 3 Pro with thinking_level=low")
        
        # 先发送"思考开始"事件
        yield {"type": "thinking_start", "content": ""}
        
        # 调用流式 API
        response_stream = ai_service.gemini_client.models.generate_content_stream(
            model="gemini-3-pro-preview",
            contents=contents,
            config=config
        )
        
        full_text = ""
        thinking_ended = False
        
        for chunk in response_stream:
            # 检查是否是思考内容（Gemini 的 thinking 部分）
            if hasattr(chunk, 'candidates') and chunk.candidates:
                for candidate in chunk.candidates:
                    if hasattr(candidate, 'content') and candidate.content:
                        for part in candidate.content.parts:
                            # 检查是否是思考部分
                            if hasattr(part, 'thought') and part.thought:
                                # 这是思考内容，不输出给用户
                                continue
                            
                            # 检查是否有工具调用
                            if hasattr(part, 'function_call') and part.function_call:
                                fc = part.function_call
                                print(f"[AIService] 🔧 Tool call detected: {fc.name}")
                                print(f"[AIService] 🔧 Arguments: {dict(fc.args) if hasattr(fc, 'args') else {}}")
                                yield {
                                    "type": "tool_call",
                                    "content": {
                                        "name": fc.name,
                                        "arguments": dict(fc.args) if hasattr(fc, 'args') else {}
                                    }
                                }
            
            # 处理文本内容
            if hasattr(chunk, 'text') and chunk.text:
                # 第一次收到文本时，发送"思考结束"事件
                if not thinking_ended:
                    yield {"type": "thinking_end", "content": ""}
                    thinking_ended = True
                
                full_text += chunk.text
                yield {"type": "text", "content": chunk.text}
        
        # 如果从未收到文本，也要结束思考状态
        if not thinking_ended:
            yield {"type": "thinking_end", "content": ""}
        
        print(f"[AIService] Stream complete. Full text length: {len(full_text)}")
        yield {"type": "done", "content": full_text}
        
    except Exception as e:
        print(f"[AIService] Stream generation failed: {e}")
        import traceback
        traceback.print_exc()
        yield {"type": "error", "content": str(e)}


def convert_tools_to_openai_format(tools: list) -> list:
    """将我们的工具定义转换为 OpenAI 兼容格式"""
    if not tools:
        return []
    
    openai_tools = []
    for tool in tools:
        openai_tools.append({
            "type": "function",
            "function": {
                "name": tool["name"],
                "description": tool.get("description", ""),
                "parameters": tool.get("parameters", {"type": "object", "properties": {}})
            }
        })
    return openai_tools


async def generate_stream_with_tools_doubao(
    messages: list,
    tools: list = None,
    system_prompt: str = None
):
    """
    使用豆包模型流式生成对话响应，支持 Function Calling
    
    使用 OpenAI 兼容 API 格式
    """
    import httpx
    import json
    
    api_key = os.getenv("ARK_API_KEY")
    model = os.getenv("ARK_MODEL", "doubao-seed-1-8-251215")
    base_url = os.getenv("ARK_BASE_URL", "https://ark.cn-beijing.volces.com/api/v3")
    
    if not api_key:
        yield {"type": "error", "content": "ARK_API_KEY not configured"}
        return
    
    print(f"[AIService] 🔥 Using Doubao model: {model}")
    
    # 构建消息
    openai_messages = []
    if system_prompt:
        openai_messages.append({"role": "system", "content": system_prompt})
    
    for msg in messages:
        role = msg.get("role", "user")
        if role == "model":
            role = "assistant"
        openai_messages.append({"role": role, "content": msg.get("content", "")})
    
    # 构建请求体
    request_body = {
        "model": model,
        "messages": openai_messages,
        "stream": True
    }
    
    # 添加工具
    if tools:
        openai_tools = convert_tools_to_openai_format(tools)
        request_body["tools"] = openai_tools
        print(f"[AIService] 🛠️ Tools being sent to Doubao: {[t['function']['name'] for t in openai_tools]}")
    else:
        print("[AIService] ⚠️ No tools provided to Doubao")
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    
    print(f"[AIService] 🚀 Sending request to Doubao... (Messages: {len(openai_messages)})")
    
    full_text = ""
    tool_calls_buffer = {}  # 用于收集流式 tool call 片段
    yielded_tool_calls = set() # 记录已发送的工具调用索引
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream(
                "POST",
                f"{base_url}/chat/completions",
                json=request_body,
                headers=headers
            ) as response:
                if response.status_code != 200:
                    error_text = await response.aread()
                    print(f"[Doubao] API error: {response.status_code} - {error_text.decode()}")
                    yield {"type": "error", "content": f"Doubao API error: {response.status_code}"}
                    return
                
                async for line in response.aiter_lines():
                    if not line or line == "data: [DONE]":
                        continue
                    
                    if line.startswith("data: "):
                        data_str = line[6:]
                        try:
                            data = json.loads(data_str)
                            choices = data.get("choices", [])
                            
                            for choice in choices:
                                delta = choice.get("delta", {})
                                
                                # 处理文本内容
                                content = delta.get("content")
                                if content:
                                    full_text += content
                                    yield {"type": "text", "content": content}
                                
                                # 处理工具调用
                                tool_calls = delta.get("tool_calls", [])
                                for tc in tool_calls:
                                    idx = tc.get("index", 0)
                                    if idx not in tool_calls_buffer:
                                        tool_calls_buffer[idx] = {
                                            "name": "",
                                            "arguments": ""
                                        }
                                    
                                    if tc.get("function", {}).get("name"):
                                        tool_calls_buffer[idx]["name"] = tc["function"]["name"]
                                    
                                    if tc.get("function", {}).get("arguments"):
                                        tool_calls_buffer[idx]["arguments"] += tc["function"]["arguments"]
                                
                                # 检查是否完成
                                finish_reason = choice.get("finish_reason")
                                if finish_reason == "tool_calls":
                                    # 输出收集到的工具调用
                                    for idx, tc_data in tool_calls_buffer.items():
                                        if idx not in yielded_tool_calls:
                                            try:
                                                args = json.loads(tc_data["arguments"]) if tc_data["arguments"] else {}
                                            except json.JSONDecodeError:
                                                args = {}
                                            
                                            print(f"[Doubao] 🔧 Tool call (finish_reason): {tc_data['name']}")
                                            yield {
                                                "type": "tool_call",
                                                "content": {
                                                    "name": tc_data["name"],
                                                    "arguments": args
                                                }
                                            }
                                            yielded_tool_calls.add(idx)
                                
                        except json.JSONDecodeError:
                            continue
        
        # 兜底：如果流结束了但 buffer 里还有工具调用没输出
        if tool_calls_buffer:
            for idx, tc_data in tool_calls_buffer.items():
                if idx not in yielded_tool_calls and tc_data["name"]:
                    try:
                        args = json.loads(tc_data["arguments"]) if tc_data["arguments"] else {}
                    except json.JSONDecodeError:
                        # 尝试修复不完整的 JSON（常见于流式截断）
                        arg_str = tc_data["arguments"].strip()
                        if arg_str and not arg_str.endswith("}"):
                            arg_str += '"}' # 尝试补全
                        try:
                            args = json.loads(arg_str)
                        except:
                            args = {}
                    
                    print(f"[Doubao] 🔧 Tool call (fallback): {tc_data['name']}")
                    yield {
                        "type": "tool_call",
                        "content": {
                            "name": tc_data["name"],
                            "arguments": args
                        }
                    }
                    yielded_tool_calls.add(idx)
            tool_calls_buffer.clear()

        print(f"[Doubao] Stream complete. Full text length: {len(full_text)}")
        yield {"type": "done", "content": full_text}
        
    except Exception as e:
        print(f"[Doubao] Stream generation failed: {e}")
        import traceback
        traceback.print_exc()
        yield {"type": "error", "content": str(e)}


async def get_coaching_ai_generator(messages: list, tools: list, system_prompt: str):
    """
    根据配置获取对应的 AI 生成器
    
    COACHING_AI_PROVIDER 环境变量:
    - gemini (默认): 使用 Gemini 3 Pro
    - doubao: 使用豆包
    """
    provider = os.getenv("COACHING_AI_PROVIDER", "gemini").lower()
    
    if provider == "doubao":
        print("[AIService] 🔥 Using Doubao for coaching")
        async for event in generate_stream_with_tools_doubao(messages, tools, system_prompt):
            yield event
    else:
        print("[AIService] 💎 Using Gemini for coaching")
        async for event in generate_stream_with_tools(messages, tools, system_prompt):
            yield event
