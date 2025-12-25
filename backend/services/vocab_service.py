"""
Vocab Service - 增强版查词服务
生成语境翻译、音节拆分、AI助记、音标和TTS发音
"""
import os
import re
import json
import httpx
from typing import Optional, List, Dict, Any
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

# TTS 音频存储目录
AUDIO_DIR = Path(__file__).parent.parent / "static" / "audio"
AUDIO_DIR.mkdir(parents=True, exist_ok=True)


class VocabService:
    """增强版词汇查询服务"""
    
    def __init__(self):
        self.free_dict_url = "https://api.dictionaryapi.dev/api/v2/entries/en"
    
    async def generate_quick_vocab(
        self, 
        word: str, 
        context_sentence: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        快速生成词汇基础数据（用于查词时快速响应）
        只获取音标和释义，其他内容异步生成
        
        目标响应时间：< 1.5秒
        """
        result = {
            "word": word,
            "phonetic": None,
            "definition": None,
            "syllables": [word],  # 默认不拆分
            "example": self._extract_sentence_with_word(context_sentence, word) if context_sentence else "",
            "audio_url": None,
            "ai_memory_hint": None,
            "is_complete": False,  # 标记数据是否完整
        }
        
        # 直接调用 LLM 获取音标和释义（省去 API 调用加快速度）
        definition_data = await self._get_quick_definition(word, context_sentence)
        
        result["phonetic"] = definition_data.get("phonetic", "")
        result["definition"] = definition_data.get("definition", "(加载中...)")
        
        logger.info(f"[VocabService] Quick lookup for '{word}' completed")
        return result

    
    async def _get_quick_definition(
        self, 
        word: str, 
        context_sentence: Optional[str]
    ) -> Dict[str, Any]:
        """快速获取释义（简化的 LLM 调用）"""
        from services.ai_service import ai_service
        
        # 简化的 prompt，只要求释义和音标
        context_hint = f"\n语境：{context_sentence[:200]}" if context_sentence else ""
        prompt = f"""请给出英文单词 "{word}" 的中文释义和音标。{context_hint}

要求：
1. definition 必须是这个单词的实际中文意思，不是描述
2. 如有语境，请结合语境给出最贴切的释义

只返回 JSON，不要其他文字：
{{"phonetic": "/音标/", "definition": "中文释义"}}"""
        
        try:
            response = await ai_service.generate_text(prompt=prompt)
            logger.info(f"[VocabService] LLM raw response for '{word}': {response[:200]}")
            
            response = response.strip()
            if response.startswith("```"):
                response = re.sub(r'^```\w*\n?', '', response)
                response = re.sub(r'\n?```$', '', response)
            
            result = json.loads(response)
            
            # 验证返回的 definition 是有效的
            definition = result.get("definition", "")
            if not definition or "释义" in definition or definition == word:
                logger.warning(f"[VocabService] Invalid definition for '{word}': {definition}")
                # 尝试使用备用字典 API
                return await self._fallback_definition(word)
            
            return result
        except json.JSONDecodeError as e:
            logger.error(f"[VocabService] JSON parse failed for '{word}': {e}, response: {response[:100]}")
            return await self._fallback_definition(word)
        except Exception as e:
            logger.error(f"[VocabService] Quick definition failed for '{word}': {e}")
            return await self._fallback_definition(word)
    
    async def _fallback_definition(self, word: str) -> Dict[str, Any]:
        """备用：使用免费字典 API 获取释义"""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.free_dict_url}/{word}")
                if response.status_code == 200:
                    data = response.json()
                    if data and len(data) > 0:
                        entry = data[0]
                        phonetic = entry.get("phonetic", "")
                        # 获取第一个释义
                        meanings = entry.get("meanings", [])
                        if meanings:
                            definitions = meanings[0].get("definitions", [])
                            if definitions:
                                eng_def = definitions[0].get("definition", "")
                                # 返回英文释义（稍后可以翻译）
                                return {"phonetic": phonetic, "definition": eng_def, "is_english": True}
        except Exception as e:
            logger.warning(f"[VocabService] Fallback API failed for '{word}': {e}")
        
        return {"definition": f"(查询失败，请重试)", "phonetic": ""}
    
    async def complete_vocab_data(
        self,
        word: str,
        context_sentence: Optional[str],
        vocab_card_id: int
    ):
        """
        异步完善词汇数据（后台任务）
        生成音节、AI助记、TTS音频，然后更新数据库
        
        注意：此方法在独立的数据库会话中运行
        """
        try:
            logger.info(f"[VocabService] Starting background completion for '{word}'")
            
            # 1. 生成音节和助记
            llm_result = await self._generate_with_llm(word, context_sentence)
            
            # 2. 生成 TTS 音频
            audio_url = await self._generate_tts(word)
            
            # 3. 创建独立的数据库会话并更新
            from database import AsyncSessionLocal
            from sqlalchemy import update
            from models import VocabCard
            
            async with AsyncSessionLocal() as db:
                stmt = update(VocabCard).where(VocabCard.id == vocab_card_id).values(
                    syllables=llm_result.get("syllables", [word]),
                    ai_memory_hint=llm_result.get("mnemonic", ""),
                    audio_url=audio_url
                )
                await db.execute(stmt)
                await db.commit()
            
            logger.info(f"[VocabService] Background completion for '{word}' finished")
            
        except Exception as e:
            logger.error(f"[VocabService] Background completion failed for '{word}': {e}")
            import traceback
            traceback.print_exc()

    
    async def generate_vocab_data(
        self, 
        word: str, 
        context_sentence: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        生成完整的词汇卡片数据（保留原方法用于兼容）
        
        Args:
            word: 要查询的单词
            context_sentence: 学生划词时的原句（用于语境翻译）
            
        Returns:
            完整的词汇数据字典
        """
        from services.ai_service import ai_service
        
        result = {
            "word": word,
            "phonetic": None,
            "definition": None,
            "syllables": [],
            "example": self._extract_sentence_with_word(context_sentence, word) if context_sentence else "",
            "audio_url": None,
            "ai_memory_hint": None,
        }
        
        # 1. 尝试从 Free Dictionary API 获取音标
        api_phonetic = await self._get_phonetic(word)
        
        # 2. LLM 生成：语境翻译 + 音节 + AI助记 + 备选音标
        llm_result = await self._generate_with_llm(word, context_sentence)
        result["definition"] = llm_result.get("definition", "(释义生成失败)")
        result["syllables"] = llm_result.get("syllables", [word])
        result["ai_memory_hint"] = llm_result.get("mnemonic", "")
        
        # 音标优先使用 API，没有则用 LLM 生成的
        result["phonetic"] = api_phonetic or llm_result.get("phonetic", "")
        
        # 3. 生成 TTS 音频
        result["audio_url"] = await self._generate_tts(word)
        
        return result

    
    async def _get_phonetic(self, word: str) -> Optional[str]:
        """从 Free Dictionary API 获取音标"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{self.free_dict_url}/{word}")
                if response.status_code == 200:
                    data = response.json()
                    if data and len(data) > 0:
                        # 尝试获取第一个 phonetic
                        entry = data[0]
                        if entry.get("phonetic"):
                            return entry["phonetic"]
                        # 或者从 phonetics 数组获取
                        for ph in entry.get("phonetics", []):
                            if ph.get("text"):
                                return ph["text"]
        except Exception as e:
            logger.warning(f"[VocabService] Failed to get phonetic for '{word}': {e}")
        return None
    
    async def _generate_with_llm(
        self, 
        word: str, 
        context_sentence: Optional[str]
    ) -> Dict[str, Any]:
        """使用 LLM 生成语境翻译、音节拆分和 AI 助记"""
        from services.ai_service import ai_service
        
        context_hint = f"\n原句: {context_sentence}" if context_sentence else ""
        prompt = f"""你是一个英语词汇助教。请分析以下单词并返回 JSON 格式。

单词: {word}{context_hint}

请返回以下 JSON 格式（只返回 JSON，不要其他内容）:
{{
    "phonetic": "国际音标，如 /əbˈsest/",
    "definition": "中文释义，必须是实际意思如 'adj. 着迷的'，不要写'XX的释义'这种描述",
    "syllables": ["音节1", "音节2"],
    "mnemonic": "💡 趣味记忆法（50字以内）"
}}

注意：definition 必须是单词的实际中文翻译！"""
        
        try:
            response = await ai_service.generate_text(prompt=prompt)
            logger.info(f"[VocabService] LLM full response for '{word}': {response[:300]}")
            
            # 解析 JSON
            response = response.strip()
            if response.startswith("```"):
                response = re.sub(r'^```\w*\n?', '', response)
                response = re.sub(r'\n?```$', '', response)
            
            result = json.loads(response)
            
            # 验证 definition 有效性
            definition = result.get("definition", "")
            if "释义" in definition or not definition:
                logger.warning(f"[VocabService] Invalid LLM definition: {definition}")
                # 尝试用备用方法
                fallback = await self._fallback_definition(word)
                result["definition"] = fallback.get("definition", "(释义生成失败)")
            
            return result
        except json.JSONDecodeError as e:
            logger.error(f"[VocabService] JSON parse failed for '{word}': {e}")
            fallback = await self._fallback_definition(word)
            return {
                "definition": fallback.get("definition", "(释义生成失败)"),
                "syllables": self._simple_syllable_split(word),
                "mnemonic": ""
            }
        except Exception as e:
            logger.error(f"[VocabService] LLM generation failed for '{word}': {e}")
            return {
                "definition": "(释义生成失败，请重试)",
                "syllables": self._simple_syllable_split(word),
                "mnemonic": ""
            }
    
    def _simple_syllable_split(self, word: str) -> List[str]:
        """简单的音节拆分备选方案"""
        # 按元音拆分的简单规则
        vowels = "aeiou"
        syllables = []
        current = ""
        
        for i, char in enumerate(word.lower()):
            current += char
            if char in vowels and i < len(word) - 1:
                # 元音后检查是否应该断开
                if len(current) >= 2:
                    syllables.append(current)
                    current = ""
        
        if current:
            if syllables:
                syllables[-1] += current
            else:
                syllables.append(current)
        
        return syllables if syllables else [word]
    
    def _extract_sentence_with_word(self, text: str, word: str) -> str:
        """从文本中提取包含目标单词的那一句话"""
        if not text or not word:
            return ""
        
        # 用正则按句子拆分（考虑 . ! ? 作为句子结束符）
        # 但要注意 Mr. Dr. 等缩写不应该拆分
        sentences = re.split(r'(?<=[.!?])\s+(?=[A-Z])', text)
        
        # 如果没有合理拆分，尝试更简单的方式
        if len(sentences) <= 1:
            sentences = re.split(r'(?<=[.!?])\s+', text)
        
        # 查找包含目标单词的句子（不区分大小写）
        word_lower = word.lower()
        for sentence in sentences:
            # 检查单词是否在句子中（作为独立单词）
            if re.search(rf'\b{re.escape(word_lower)}\b', sentence.lower()):
                return sentence.strip()
        
        # 如果没找到完全匹配，尝试部分匹配（词根）
        word_stem = word_lower.rstrip('seding')  # 简单去除常见词尾
        if len(word_stem) >= 3:
            for sentence in sentences:
                if word_stem in sentence.lower():
                    return sentence.strip()
        
        # 如果还是没找到，返回第一句
        return sentences[0].strip() if sentences else text
    
    async def _generate_tts(self, word: str) -> Optional[str]:
        """生成 TTS 音频并保存到文件"""
        try:
            # 使用 Edge TTS (免费且质量好)
            import edge_tts
            
            # 文件名使用单词
            filename = f"{word.lower().replace(' ', '_')}.mp3"
            filepath = AUDIO_DIR / filename
            
            # 如果已存在则直接返回
            if filepath.exists():
                return f"/static/audio/{filename}"
            
            # 生成音频
            communicate = edge_tts.Communicate(word, "en-US-AriaNeural")
            await communicate.save(str(filepath))
            
            logger.info(f"[VocabService] Generated TTS for '{word}': {filename}")
            return f"/static/audio/{filename}"
            
        except ImportError:
            logger.warning("[VocabService] edge_tts not installed, skipping TTS")
            return None
        except Exception as e:
            logger.error(f"[VocabService] TTS generation failed for '{word}': {e}")
            return None


# 单例实例
vocab_service = VocabService()
