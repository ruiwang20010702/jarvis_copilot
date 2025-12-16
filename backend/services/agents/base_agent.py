"""
Base Agent - Jarvis AI 教学助手基类

定义所有 Agent 共享的接口和数据结构:
- AgentState: 会话状态
- AgentAction: Agent 返回的动作
- BaseAgent: 抽象基类
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
import uuid


class ActionType(str, Enum):
    """Agent 可执行的动作类型"""
    SEND_MESSAGE = "SEND_MESSAGE"           # 发送文本消息
    PUBLISH_TASK = "PUBLISH_TASK"           # 发布任务 (voice/highlight/select)
    ADVANCE_PHASE = "ADVANCE_PHASE"         # 进入下一阶段
    START_REVIEW = "START_REVIEW"           # 开始复盘
    SHOW_GPS_CARD = "SHOW_GPS_CARD"         # 展示 GPS 解题卡
    SHOW_WORD_CARD = "SHOW_WORD_CARD"       # 展示词卡 (Vocab)
    SHOW_CHUNKS = "SHOW_CHUNKS"             # 展示句子成分 (Surgery)
    PLAY_AUDIO = "PLAY_AUDIO"               # 播放音频
    COMPLETE = "COMPLETE"                   # 完成当前模块


class TaskType(str, Enum):
    """任务类型"""
    VOICE = "voice"           # 语音回答
    HIGHLIGHT = "highlight"   # 画线标记
    SELECT = "select"         # 选择选项
    GPS = "gps"               # GPS 卡片
    REVIEW = "review"         # 复盘


@dataclass
class AgentAction:
    """Agent 返回给前端的动作指令"""
    type: ActionType
    payload: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> dict:
        return {
            "type": self.type.value,
            "payload": self.payload
        }


@dataclass
class Message:
    """对话消息"""
    role: str       # "agent" | "student" | "system"
    content: str
    timestamp: datetime = field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class AgentState:
    """Agent 会话状态"""
    session_id: str
    module_type: str                              # coaching | skill | vocab | surgery
    current_phase: int = 1                        # 当前教学阶段
    wrong_count: int = 0                          # 累计错误次数
    conversation_history: List[Message] = field(default_factory=list)
    context: Dict[str, Any] = field(default_factory=dict)  # 模块特定上下文
    pending_action: Optional[AgentAction] = None  # 待执行动作
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    
    def add_message(self, role: str, content: str, **metadata):
        """添加对话消息"""
        self.conversation_history.append(Message(
            role=role,
            content=content,
            metadata=metadata
        ))
        self.updated_at = datetime.utcnow()
    
    def to_dict(self) -> dict:
        """序列化为字典"""
        return {
            "session_id": self.session_id,
            "module_type": self.module_type,
            "current_phase": self.current_phase,
            "wrong_count": self.wrong_count,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }


class BaseAgent(ABC):
    """
    Jarvis Agent 抽象基类
    所有教学模块 Agent 都继承此类
    """
    
    # 模块类型标识 (子类必须覆盖)
    MODULE_TYPE: str = "base"
    
    def __init__(self, session_id: str, context: Dict[str, Any]):
        """
        初始化 Agent
        
        Args:
            session_id: 会话唯一标识
            context: 模块特定上下文 (题目信息、单词信息等)
        """
        self.state = AgentState(
            session_id=session_id,
            module_type=self.MODULE_TYPE,
            context=context
        )
    
    @abstractmethod
    def get_prompt_path(self) -> str:
        """
        返回该 Agent 使用的 Prompt 文件路径
        子类必须实现
        """
        pass
    
    @abstractmethod
    def get_tools(self) -> List[Dict[str, Any]]:
        """
        返回该 Agent 可用的工具定义
        子类必须实现
        
        Returns:
            工具定义列表，格式:
            [{"name": "send_message", "description": "...", "parameters": {...}}]
        """
        pass
    
    @abstractmethod
    async def process_input(
        self, 
        input_type: str, 
        input_data: Dict[str, Any]
    ) -> AgentAction:
        """
        处理学生输入，返回下一步动作
        子类必须实现
        
        Args:
            input_type: 输入类型 (voice_response/highlight/select_option/...)
            input_data: 输入数据
            
        Returns:
            AgentAction: 要执行的动作
        """
        pass
    
    async def initialize(self) -> AgentAction:
        """
        初始化会话，返回第一个动作
        子类可以覆盖以自定义初始化逻辑
        """
        # 默认发送欢迎消息
        return AgentAction(
            type=ActionType.SEND_MESSAGE,
            payload={"text": "让我们开始吧！", "require_task": False}
        )
    
    def get_state(self) -> dict:
        """获取当前状态"""
        return self.state.to_dict()
    
    def reset(self):
        """重置会话状态"""
        self.state.current_phase = 1
        self.state.wrong_count = 0
        self.state.conversation_history = []
        self.state.pending_action = None
        self.state.updated_at = datetime.utcnow()


# 内存会话存储 (简单实现，生产环境可换成 Redis)
_sessions: Dict[str, BaseAgent] = {}


def get_session(session_id: str) -> Optional[BaseAgent]:
    """获取会话"""
    return _sessions.get(session_id)


def save_session(agent: BaseAgent):
    """保存会话"""
    _sessions[agent.state.session_id] = agent


def delete_session(session_id: str):
    """删除会话"""
    if session_id in _sessions:
        del _sessions[session_id]


def generate_session_id() -> str:
    """生成会话 ID"""
    return str(uuid.uuid4())
