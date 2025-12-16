import os
from zhipuai import ZhipuAI
from google import genai
from google.genai import types
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

load_dotenv()

class AIService:
    def __init__(self):
        self.default_model = os.getenv("DEFAULT_AI_MODEL", "zhipu")
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

# Singleton instance
ai_service = AIService()
