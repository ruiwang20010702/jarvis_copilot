"""
STT Service - Speech to Text using Groq Whisper API
语音转文字服务 - 使用 Groq Whisper API
"""
import os
import httpx
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class STTService:
    """Groq Whisper语音转文字服务"""
    
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        self.base_url = "https://api.groq.com/openai/v1/audio/transcriptions"
        
    async def transcribe(
        self, 
        audio_data: bytes, 
        filename: str = "audio.webm",
        language: str = "zh"
    ) -> Optional[str]:
        """
        将音频转换为文字
        
        Args:
            audio_data: 音频文件的二进制数据
            filename: 音频文件名 (用于确定格式)
            language: 语言代码 (zh=中文, en=英文)
            
        Returns:
            转写的文字，失败返回 None
        """
        if not self.api_key:
            logger.error("GROQ_API_KEY not configured")
            return None
            
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Groq Whisper API 使用 multipart/form-data 格式
                files = {
                    "file": (filename, audio_data, "audio/webm"),
                }
                data = {
                    "model": "whisper-large-v3-turbo",  # Groq 提供的快速模型
                    "language": language,
                    "response_format": "text",
                }
                
                response = await client.post(
                    self.base_url,
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    files=files,
                    data=data
                )
                
                if response.status_code == 200:
                    transcript = response.text.strip()
                    logger.info(f"[STT] Transcription successful: {transcript[:50]}...")
                    return transcript
                else:
                    logger.error(f"[STT] API error: {response.status_code} - {response.text}")
                    return None
                    
        except Exception as e:
            logger.error(f"[STT] Transcription failed: {e}")
            return None


# 单例实例
stt_service = STTService()
