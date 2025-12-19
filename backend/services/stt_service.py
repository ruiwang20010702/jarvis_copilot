"""
STT Service - Speech to Text
语音转文字服务 - 支持讯飞（中文）和 Groq Whisper（英文）
"""
import os
import httpx
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class STTService:
    """语音转文字服务 - 智能选择最佳识别引擎"""
    
    def __init__(self):
        # Groq Whisper 配置
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        self.groq_base_url = "https://api.groq.com/openai/v1/audio/transcriptions"
        
        # 讯飞配置检查
        self.xunfei_available = all([
            os.getenv("XUNFEI_APPID"),
            os.getenv("XUNFEI_API_SECRET"),
            os.getenv("XUNFEI_API_KEY")
        ])
        
        # STT 引擎选择：xunfei, groq, auto
        # 讯飞英语模式需要额外配置，暂时默认 groq
        self.engine = os.getenv("STT_ENGINE", "groq").lower()
        
        logger.info(f"[STT] Engine: {self.engine}, Xunfei available: {self.xunfei_available}")
        
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
        # 智能选择引擎
        use_xunfei = False
        
        if self.engine == "xunfei":
            use_xunfei = True
        elif self.engine == "groq":
            use_xunfei = False
        else:  # auto 模式
            # 中文优先使用讯飞
            if language == "zh" and self.xunfei_available:
                use_xunfei = True
        
        if use_xunfei and self.xunfei_available:
            return await self._transcribe_xunfei(audio_data, filename, language)
        else:
            return await self._transcribe_groq(audio_data, filename, language)
    
    async def _transcribe_xunfei(
        self,
        audio_data: bytes,
        filename: str,
        language: str
    ) -> Optional[str]:
        """使用讯飞进行语音转写"""
        try:
            from services.xunfei_stt_service import xunfei_stt_service
            result = await xunfei_stt_service.transcribe(audio_data, filename, language)
            if result:
                logger.info(f"[STT] Xunfei success: {result[:50]}...")
                return result
            else:
                # 讯飞失败，fallback 到 Groq
                logger.warning("[STT] Xunfei failed, falling back to Groq")
                return await self._transcribe_groq(audio_data, filename, language)
        except Exception as e:
            logger.error(f"[STT] Xunfei error: {e}, falling back to Groq")
            return await self._transcribe_groq(audio_data, filename, language)
    
    async def _transcribe_groq(
        self, 
        audio_data: bytes, 
        filename: str = "audio.webm",
        language: str = "zh"
    ) -> Optional[str]:
        """使用 Groq Whisper 进行语音转写"""
        if not self.groq_api_key:
            logger.error("GROQ_API_KEY not configured")
            return None
            
        try:
            # 根据文件扩展名确定 MIME 类型
            ext = filename.lower().split('.')[-1] if '.' in filename else 'webm'
            mime_types = {
                'webm': 'audio/webm',
                'mp3': 'audio/mpeg',
                'mp4': 'audio/mp4',
                'm4a': 'audio/mp4',
                'wav': 'audio/wav',
                'ogg': 'audio/ogg',
                'flac': 'audio/flac',
            }
            mime_type = mime_types.get(ext, 'audio/webm')
            
            logger.info(f"[STT] Groq: filename={filename}, mime_type={mime_type}, size={len(audio_data)} bytes")
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                files = {
                    "file": (filename, audio_data, mime_type),
                }
                data = {
                    "model": "whisper-large-v3",  # 使用完整版模型
                    "language": language,
                    "response_format": "text",
                }
                
                response = await client.post(
                    self.groq_base_url,
                    headers={"Authorization": f"Bearer {self.groq_api_key}"},
                    files=files,
                    data=data
                )
                
                if response.status_code == 200:
                    transcript = response.text.strip()
                    logger.info(f"[STT] Groq success: {transcript[:50]}...")
                    return transcript
                else:
                    logger.error(f"[STT] Groq error: {response.status_code} - {response.text}")
                    return None
                    
        except Exception as e:
            logger.error(f"[STT] Groq failed: {e}")
            return None


# 单例实例
stt_service = STTService()

