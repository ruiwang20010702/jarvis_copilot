"""
讯飞语音评测服务 - 使用官方 SDK
"""
import os
import base64
import logging

logger = logging.getLogger(__name__)


class XunfeiPronunciationService:
    """讯飞语音评测服务 (使用官方 xfyunsdkspeech SDK)"""
    
    def __init__(self):
        self.appid = os.getenv("XUNFEI_APPID")
        self.api_secret = os.getenv("XUNFEI_API_SECRET")
        self.api_key = os.getenv("XUNFEI_API_KEY")
        
        if not all([self.appid, self.api_secret, self.api_key]):
            logger.warning("Xunfei credentials not set. Pronunciation assessment will fail.")
    
    async def assess_pronunciation(self, audio_path: str, reference_text: str) -> dict:
        """
        评测发音
        
        Args:
            audio_path: 音频文件路径 (pcm/wav 格式)
            reference_text: 参考文本
            
        Returns:
            dict: 评测结果 {accuracy, fluency, completeness, overall, error?}
        """
        if not all([self.appid, self.api_secret, self.api_key]):
            return {
                "error": "Xunfei credentials not configured",
                "accuracy": 0, "fluency": 0, "completeness": 0, "overall": 0
            }
        
        try:
            from xfyunsdkspeech.ise_client import IseClient
            import subprocess
            import tempfile
            
            # 根据文件扩展名判断音频格式
            ext = audio_path.lower().split('.')[-1]
            actual_audio_path = audio_path
            temp_file = None
            
            # 无论什么格式，都统一转换为 16kHz MP3（确保讯飞能正确识别）
            # 浏览器录音的 WAV 可能是 48kHz，讯飞需要 16kHz
            if ext in ['mp4', 'webm', 'm4a', 'aac', 'ogg', 'wav']:
                logger.info(f"Converting {ext} to MP3 format using ffmpeg...")
                import tempfile as tmp_module
                temp_file = tmp_module.NamedTemporaryFile(suffix='.mp3', delete=False)
                temp_file.close()
                
                try:
                    # 使用 ffmpeg 转换为 MP3 格式
                    result = subprocess.run([
                        'ffmpeg', '-y', '-i', audio_path,
                        '-ar', '16000',  # 采样率 16kHz
                        '-ac', '1',      # 单声道
                        '-b:a', '64k',   # 比特率
                        temp_file.name
                    ], capture_output=True, text=True, timeout=30)
                    
                    if result.returncode != 0:
                        logger.error(f"ffmpeg conversion failed: {result.stderr}")
                        return {
                            "error": f"Audio conversion failed: {result.stderr[:200]}",
                            "accuracy": 0, "fluency": 0, "completeness": 0, "overall": 0
                        }
                    
                    actual_audio_path = temp_file.name
                    ext = 'mp3'
                    
                    # 检查转换后的文件大小
                    import os as os_check
                    converted_size = os_check.path.getsize(actual_audio_path)
                    logger.info(f"Audio converted: {actual_audio_path}, size={converted_size} bytes")
                    
                    if converted_size < 1000:  # 小于 1KB 说明可能有问题
                        logger.error(f"Converted audio too small: {converted_size} bytes")
                        return {
                            "error": f"Audio too short or invalid ({converted_size} bytes)",
                            "accuracy": 0, "fluency": 0, "completeness": 0, "overall": 0
                        }
                except FileNotFoundError:
                    logger.error("ffmpeg not found. Please install ffmpeg.")
                    return {
                        "error": "ffmpeg not installed",
                        "accuracy": 0, "fluency": 0, "completeness": 0, "overall": 0
                    }
                except subprocess.TimeoutExpired:
                    logger.error("ffmpeg conversion timed out")
                    return {
                        "error": "Audio conversion timeout",
                        "accuracy": 0, "fluency": 0, "completeness": 0, "overall": 0
                    }
            
            # 确定音频编码
            if ext == 'mp3':
                aue = 'lame'
            elif ext == 'speex':
                aue = 'speex-wb;7'
            else:
                aue = 'raw'  # PCM/WAV
            
            logger.info(f"Using audio encoding: {aue} for file: {actual_audio_path}")
            
            # 初始化客户端
            client = IseClient(
                app_id=self.appid,
                api_key=self.api_key,
                api_secret=self.api_secret,
                aue=aue,
                group="pupil",  # 学生群体
                ent="en_vip",  # 英文评测引擎
                category="read_word",  # 单词朗读
            )
            
            # 读取音频文件
            with open(actual_audio_path, 'rb') as f:
                # 发送评测请求
                # 英文单词评测需要 [word] 标记
                formatted_text = f'[word] {reference_text}'
                result_xml = None
                for chunk in client.stream('\uFEFF' + formatted_text, f):
                    if chunk.get("data"):
                        result_xml = base64.b64decode(chunk["data"]).decode('utf-8')
                        logger.info(f"Xunfei result received")
            
            # 清理临时文件
            if temp_file:
                import os as os_module
                try:
                    os_module.unlink(temp_file.name)
                except:
                    pass
            
            if result_xml:
                return self._parse_result_xml(result_xml)
            else:
                return {
                    "error": "No result received",
                    "accuracy": 0, "fluency": 0, "completeness": 0, "overall": 0
                }
                
        except ImportError as e:
            logger.error(f"xfyunsdkspeech not installed: {e}")
            return {
                "error": "xfyunsdkspeech SDK not installed",
                "accuracy": 0, "fluency": 0, "completeness": 0, "overall": 0
            }
        except Exception as e:
            logger.error(f"Xunfei assessment failed: {e}")
            return {
                "error": str(e),
                "accuracy": 0, "fluency": 0, "completeness": 0, "overall": 0
            }
    
    def _parse_result_xml(self, result_xml: str) -> dict:
        """解析评测结果 XML"""
        try:
            import re
            logger.debug(f"Parsing result XML: {result_xml[:200]}...")
            
            # 提取 total_score
            total_match = re.search(r'total_score="([\d.]+)"', result_xml)
            total_score = float(total_match.group(1)) if total_match else 0
            
            # 提取 accuracy_score
            acc_match = re.search(r'accuracy_score="([\d.]+)"', result_xml)
            accuracy = float(acc_match.group(1)) if acc_match else total_score
            
            # 提取 fluency_score
            flu_match = re.search(r'fluency_score="([\d.]+)"', result_xml)
            fluency = float(flu_match.group(1)) if flu_match else total_score
            
            # 提取 integrity_score (完整度)
            int_match = re.search(r'integrity_score="([\d.]+)"', result_xml)
            completeness = float(int_match.group(1)) if int_match else 100
            
            logger.info(f"Xunfei raw scores - Total: {total_score}, Accuracy: {accuracy}, Fluency: {fluency}")
            
            # 转换为百分制 (讯飞原始分数是 0-5 分, completeness 已是百分制)
            return {
                "accuracy": round(accuracy * 20, 1),
                "fluency": round(fluency * 20, 1),
                "completeness": round(completeness, 1),  # 已是百分制
                "overall": round(total_score * 20, 1)
            }
            
        except Exception as e:
            logger.error(f"Failed to parse Xunfei result: {e}")
            return {
                "error": f"Parse error: {e}",
                "accuracy": 0, "fluency": 0, "completeness": 0, "overall": 0
            }


xunfei_pronunciation_service = XunfeiPronunciationService()
