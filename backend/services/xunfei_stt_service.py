"""
讯飞极速语音转写服务 - 使用 HTTP API
科大讯飞极速录音转写大模型 API (基于官方 Python Demo 实现)

特点：
- 1小时音频最快约20秒完成
- 支持中英文混合
- 支持 wav/pcm/mp3 格式
"""
import os
import base64
import hashlib
import hmac
import json
import logging
import time
import asyncio
from datetime import datetime
from wsgiref.handlers import format_date_time
from time import mktime
from typing import Optional
from urllib.parse import urlparse
from urllib3 import encode_multipart_formdata
import requests

logger = logging.getLogger(__name__)


class XunfeiSTTService:
    """讯飞极速语音转写服务（使用大模型）"""
    
    def __init__(self):
        self.appid = os.getenv("XUNFEI_APPID")
        self.api_secret = os.getenv("XUNFEI_API_SECRET")
        self.api_key = os.getenv("XUNFEI_API_KEY")
        
        # 极速语音转写 API 地址 (文档推荐使用 HTTPS)
        self.upload_url = "https://upload-ost-api.xfyun.cn/file/upload"
        self.api_host = "ost-api.xfyun.cn"
        self.create_url = f"https://{self.api_host}/v2/ost/pro_create"
        self.query_url = f"https://{self.api_host}/v2/ost/query"
        
        if not all([self.appid, self.api_secret, self.api_key]):
            logger.warning("Xunfei credentials not set. STT will fail.")
    
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
        if not all([self.appid, self.api_secret, self.api_key]):
            logger.error("Xunfei credentials not configured")
            return None
        
        try:
            logger.info(f"[Xunfei] Starting transcription, audio size: {len(audio_data)} bytes")
            
            # 1. 上传文件 (讯飞支持 wav/pcm/mp3，无需转换)
            file_url = self._upload_file(audio_data, filename)
            if not file_url:
                logger.error("[Xunfei] File upload failed")
                return None
            
            logger.info(f"[Xunfei] File uploaded successfully")
            
            # 2. 创建转写任务
            task_id = self._create_task(file_url, language)
            if not task_id:
                logger.error("[Xunfei] Task creation failed")
                return None
            
            logger.info(f"[Xunfei] Task created, ID: {task_id}")
            
            # 3. 轮询查询结果
            result = await self._query_result(task_id)
            
            if result:
                logger.info(f"[Xunfei STT] Success: {result[:50] if len(result) > 50 else result}...")
            
            return result
            
        except Exception as e:
            logger.error(f"Xunfei STT failed: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def _get_date(self) -> str:
        """生成 RFC1123 格式日期"""
        return format_date_time(mktime(datetime.now().timetuple()))
    
    def _upload_file(self, audio_data: bytes, filename: str) -> Optional[str]:
        """上传音频文件"""
        try:
            request_id = time.strftime("%Y%m%d%H%M")
            
            # 使用 urllib3 的 encode_multipart_formdata
            file = {
                "data": (filename, audio_data),
                "app_id": self.appid,
                "request_id": request_id,
            }
            encoded = encode_multipart_formdata(file)
            file_data = encoded[0]
            content_type = encoded[1]
            
            # 生成上传 headers
            u = urlparse(self.upload_url)
            host = u.hostname
            path = u.path
            date = self._get_date()
            
            # 上传的 digest 是空字符串的 SHA256
            digest = "SHA256=" + base64.b64encode(
                hashlib.sha256("".encode("utf-8")).digest()
            ).decode("utf-8")
            
            sig_origin = f"host: {host}\ndate: {date}\nPOST {path} HTTP/1.1\ndigest: {digest}"
            sig_sha = hmac.new(
                self.api_secret.encode("utf-8"),
                sig_origin.encode("utf-8"),
                digestmod=hashlib.sha256
            ).digest()
            signature = base64.b64encode(sig_sha).decode("utf-8")
            
            auth = f'api_key="{self.api_key}", algorithm="hmac-sha256", headers="host date request-line digest", signature="{signature}"'
            
            headers = {
                "host": host,
                "date": date,
                "authorization": auth,
                "digest": digest,
                "content-type": content_type
            }
            
            response = requests.post(self.upload_url, headers=headers, data=file_data, timeout=60)
            
            if response.status_code == 200:
                result = response.json()
                if result.get("code") == 0:
                    return result.get("data", {}).get("url")
                else:
                    logger.error(f"[Xunfei] Upload error: {result}")
            else:
                logger.error(f"[Xunfei] Upload HTTP error: {response.status_code} - {response.text}")
            
            return None
            
        except Exception as e:
            logger.error(f"[Xunfei] Upload failed: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def _create_task(self, audio_url: str, language: str) -> Optional[str]:
        """创建转写任务"""
        try:
            path = "/v2/ost/pro_create"
            
            # 语言映射
            lang_map = {
                "zh": "zh_cn",
                "en": "en_us",
                "zh-en": "zh_cn"
            }
            
            body_dict = {
                "common": {"app_id": self.appid},
                "business": {
                    "language": lang_map.get(language, "zh_cn"),
                    "accent": "mandarin",
                    "domain": "pro_ost_ed"
                },
                "data": {
                    "audio_src": "http",
                    "audio_url": audio_url,
                    "encoding": "raw"
                }
            }
            body = json.dumps(body_dict)
            
            # 生成 headers
            date = self._get_date()
            digest = "SHA-256=" + base64.b64encode(
                hashlib.sha256(body.encode("utf-8")).digest()
            ).decode("utf-8")
            
            sig_origin = f"host: {self.api_host}\ndate: {date}\nPOST {path} HTTP/1.1\ndigest: {digest}"
            sig_sha = hmac.new(
                self.api_secret.encode("utf-8"),
                sig_origin.encode("utf-8"),
                digestmod=hashlib.sha256
            ).digest()
            signature = base64.b64encode(sig_sha).decode("utf-8")
            
            # 注意：这里的格式和上传稍有不同 (没有空格)
            auth = f'api_key="{self.api_key}",algorithm="hmac-sha256", headers="host date request-line digest", signature="{signature}"'
            
            headers = {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Host": self.api_host,
                "Date": date,
                "Digest": digest,
                "Authorization": auth
            }
            
            response = requests.post(self.create_url, headers=headers, data=body, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                if result.get("code") == 0:
                    return result.get("data", {}).get("task_id")
                else:
                    logger.error(f"[Xunfei] Create task error: {result}")
            else:
                logger.error(f"[Xunfei] Create task HTTP error: {response.status_code} - {response.text}")
            
            return None
            
        except Exception as e:
            logger.error(f"[Xunfei] Create task failed: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    async def _query_result(
        self,
        task_id: str,
        max_retries: int = 120,
        interval: float = 0.5
    ) -> Optional[str]:
        """轮询查询结果"""
        try:
            path = "/v2/ost/query"
            
            for i in range(max_retries):
                body_dict = {
                    "common": {"app_id": self.appid},
                    "business": {"task_id": task_id}
                }
                body = json.dumps(body_dict)
                
                # 生成 headers
                date = self._get_date()
                digest = "SHA-256=" + base64.b64encode(
                    hashlib.sha256(body.encode("utf-8")).digest()
                ).decode("utf-8")
                
                sig_origin = f"host: {self.api_host}\ndate: {date}\nPOST {path} HTTP/1.1\ndigest: {digest}"
                sig_sha = hmac.new(
                    self.api_secret.encode("utf-8"),
                    sig_origin.encode("utf-8"),
                    digestmod=hashlib.sha256
                ).digest()
                signature = base64.b64encode(sig_sha).decode("utf-8")
                
                auth = f'api_key="{self.api_key}",algorithm="hmac-sha256", headers="host date request-line digest", signature="{signature}"'
                
                headers = {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Host": self.api_host,
                    "Date": date,
                    "Digest": digest,
                    "Authorization": auth
                }
                
                response = requests.post(self.query_url, headers=headers, data=body, timeout=30)
                
                # 注意：讯飞有时返回 HTTP 500 但响应体中包含有效数据
                # 所以我们不只检查 200，而是尝试解析任何 JSON 响应
                try:
                    data = response.json()
                except:
                    logger.warning(f"[Xunfei] Query non-JSON response: {response.status_code}")
                    await asyncio.sleep(interval)
                    continue
                
                task_data = data.get("data", {})
                status = task_data.get("task_status")
                
                # 状态: 1-处理中, 2-处理中, 4-成功, -1-失败
                if status == "4" or status == 4:
                    # 成功，提取文本
                    result_obj = task_data.get("result", {})
                    lattice = result_obj.get("lattice", [])
                    texts = []
                    
                    for item in lattice:
                        json_1best = item.get("json_1best", {})
                        st = json_1best.get("st", {})
                        for rt in st.get("rt", []):
                            for ws in rt.get("ws", []):
                                for cw in ws.get("cw", []):
                                    w = cw.get("w", "")
                                    if w:
                                        texts.append(w)
                    
                    return "".join(texts).strip()
                
                elif status == "-1" or status == -1:
                    logger.error(f"[Xunfei] Task failed: {task_data}")
                    return None
                
                elif status:
                    # 还在处理中，继续等待
                    if i % 20 == 0:
                        logger.info(f"[Xunfei] Processing... status={status} ({i+1}/{max_retries})")
                else:
                    # 其他错误
                    logger.warning(f"[Xunfei] Query response: code={data.get('code')}, status={status}")
                
                await asyncio.sleep(interval)
            
            logger.error("[Xunfei] Query timeout")
            return None
            
        except Exception as e:
            logger.error(f"[Xunfei] Query failed: {e}")
            import traceback
            traceback.print_exc()
            return None


# 单例实例
xunfei_stt_service = XunfeiSTTService()
