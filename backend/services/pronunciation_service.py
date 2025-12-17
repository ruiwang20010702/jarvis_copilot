"""
发音评测服务 - 支持多提供商切换
默认使用讯飞，可通过环境变量 PRONUNCIATION_PROVIDER 切换为 azure
"""
import os
import logging

logger = logging.getLogger(__name__)

# 获取提供商配置
PROVIDER = os.getenv("PRONUNCIATION_PROVIDER", "xunfei").lower()


class PronunciationService:
    """统一发音评测服务接口"""
    
    def __init__(self):
        self.provider = PROVIDER
        logger.info(f"Pronunciation service initialized with provider: {self.provider}")
    
    async def assess_pronunciation(self, audio_path: str, reference_text: str) -> dict:
        """
        评测发音
        
        Args:
            audio_path: 音频文件路径
            reference_text: 参考文本
            
        Returns:
            dict: 评测结果 {accuracy, fluency, completeness, overall, error?}
        """
        if self.provider == "azure":
            return await self._assess_with_azure(audio_path, reference_text)
        else:
            return await self._assess_with_xunfei(audio_path, reference_text)
    
    async def _assess_with_xunfei(self, audio_path: str, reference_text: str) -> dict:
        """使用讯飞评测"""
        try:
            from services.xunfei_pronunciation_service import xunfei_pronunciation_service
            return await xunfei_pronunciation_service.assess_pronunciation(audio_path, reference_text)
        except ImportError as e:
            logger.error(f"Failed to import Xunfei service: {e}")
            return {
                "error": "Xunfei service not available",
                "accuracy": 0, "fluency": 0, "completeness": 0, "overall": 0
            }
    
    async def _assess_with_azure(self, audio_path: str, reference_text: str) -> dict:
        """使用 Azure 评测"""
        try:
            import azure.cognitiveservices.speech as speechsdk
            
            speech_key = os.getenv("AZURE_SPEECH_KEY")
            service_region = os.getenv("AZURE_SPEECH_REGION")
            
            if not speech_key or not service_region:
                return {
                    "error": "Azure Speech configuration missing",
                    "accuracy": 0, "fluency": 0, "completeness": 0, "overall": 0
                }
            
            # Create speech config
            speech_config = speechsdk.SpeechConfig(subscription=speech_key, region=service_region)
            audio_config = speechsdk.audio.AudioConfig(filename=audio_path)
            
            # Create pronunciation assessment config
            pronunciation_config = speechsdk.PronunciationAssessmentConfig(
                reference_text=reference_text,
                grading_system=speechsdk.PronunciationAssessmentGradingSystem.HundredMark,
                granularity=speechsdk.PronunciationAssessmentGranularity.Phoneme,
                enable_miscue=True
            )
            
            # Create speech recognizer
            speech_recognizer = speechsdk.SpeechRecognizer(
                speech_config=speech_config, 
                audio_config=audio_config
            )
            pronunciation_config.apply_to(speech_recognizer)
            
            logger.info(f"[Azure] Starting pronunciation assessment for: {reference_text}")
            result = speech_recognizer.recognize_once_async().get()
            
            if result.reason == speechsdk.ResultReason.RecognizedSpeech:
                pronunciation_result = speechsdk.PronunciationAssessmentResult(result)
                logger.info(f"[Azure] Assessment successful. Score: {pronunciation_result.pronunciation_score}")
                return {
                    "accuracy": pronunciation_result.accuracy_score,
                    "fluency": pronunciation_result.fluency_score,
                    "completeness": pronunciation_result.completeness_score,
                    "overall": pronunciation_result.pronunciation_score
                }
            elif result.reason == speechsdk.ResultReason.NoMatch:
                return {"error": "No speech recognized", "accuracy": 0, "fluency": 0, "completeness": 0, "overall": 0}
            else:
                return {"error": f"Recognition failed: {result.reason}", "accuracy": 0, "fluency": 0, "completeness": 0, "overall": 0}
                
        except ImportError:
            return {"error": "Azure SDK not installed", "accuracy": 0, "fluency": 0, "completeness": 0, "overall": 0}
        except Exception as e:
            logger.error(f"[Azure] Assessment failed: {e}")
            return {"error": str(e), "accuracy": 0, "fluency": 0, "completeness": 0, "overall": 0}


pronunciation_service = PronunciationService()
