"""
Jarvis Agent Package
可扩展的 AI 教学助手 Agent 框架
"""

from .base_agent import BaseAgent, AgentState, AgentAction, ActionType
from .coaching_agent import CoachingAgent

__all__ = [
    'BaseAgent',
    'AgentState', 
    'AgentAction',
    'ActionType',
    'CoachingAgent',
]


def create_agent(module_type: str, session_id: str, context: dict) -> BaseAgent:
    """
    Agent 工厂函数
    根据 module_type 创建对应的 Agent 实例
    """
    agents = {
        'coaching': CoachingAgent,
        # 'skill': SkillAgent,      # 未来扩展
        # 'vocab': VocabAgent,      # 未来扩展
        # 'surgery': SurgeryAgent,  # 未来扩展
    }
    
    agent_class = agents.get(module_type)
    if not agent_class:
        raise ValueError(f"Unknown module type: {module_type}. Available: {list(agents.keys())}")
    
    return agent_class(session_id=session_id, context=context)
