"""
Coaching Agent - 代练纠错 AI 助教

苏格拉底式教学：通过 6 个阶段引导学生自己发现错误并改正。

Phases:
1. 归因诊断 - 询问学生为什么选这个答案
2. 技能召回 - 展示 GPS 解题卡
3. 路标定位 - 引导找题干关键词
4. 搜原句   - 引导在文章中定位
5. 纠偏锁定 - 让学生重新选择
6. 技巧复盘 - 总结解题方法
"""

import os
from typing import Any, Dict, List

from .base_agent import (
    BaseAgent, AgentAction, AgentState, ActionType, TaskType
)


# 6 步教学阶段配置
COACHING_PHASES = {
    1: {
        "name": "归因诊断",
        "name_en": "Diagnosis",
        "task_type": TaskType.VOICE,
        "description": "询问学生为什么选这个答案"
    },
    2: {
        "name": "技能召回",
        "name_en": "Recall",
        "task_type": TaskType.GPS,
        "description": "展示 GPS 解题卡"
    },
    3: {
        "name": "路标定位",
        "name_en": "Guide",
        "task_type": TaskType.HIGHLIGHT,
        "description": "引导找题干关键词"
    },
    4: {
        "name": "搜原句",
        "name_en": "Locate",
        "task_type": TaskType.HIGHLIGHT,
        "description": "引导在文章中定位"
    },
    5: {
        "name": "纠偏锁定",
        "name_en": "Match",
        "task_type": TaskType.SELECT,
        "description": "让学生重新选择"
    },
    6: {
        "name": "技巧复盘",
        "name_en": "Review",
        "task_type": TaskType.REVIEW,
        "description": "总结解题方法"
    },
}


class CoachingAgent(BaseAgent):
    """
    代练纠错 Agent
    
    使用苏格拉底式提问引导学生自己发现错误并改正。
    核心规则：
    - 绝不直接给出答案
    - 学生有 2 次选择机会
    - 2 次错误后进入复盘
    """
    
    MODULE_TYPE = "coaching"
    MAX_WRONG_ATTEMPTS = 2  # 最大错误次数
    
    def get_prompt_path(self) -> str:
        """返回 coaching_tutor.md 的路径"""
        base_path = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        return os.path.join(base_path, "prompts", "coaching_tutor.md")
    
    def get_tools(self) -> List[Dict[str, Any]]:
        """返回 Coaching Agent 可用的工具"""
        return [
            {
                "name": "send_message",
                "description": "发送文本消息给学生",
                "parameters": {
                    "text": {"type": "string", "description": "消息内容"},
                    "require_task": {"type": "boolean", "description": "是否需要发布任务"}
                }
            },
            {
                "name": "publish_task",
                "description": "发布任务让学生完成",
                "parameters": {
                    "task_type": {"type": "string", "enum": ["voice", "highlight", "select"]},
                    "instruction": {"type": "string", "description": "任务说明"}
                }
            },
            {
                "name": "show_gps_card",
                "description": "展示 GPS 解题卡片"
            },
            {
                "name": "advance_phase",
                "description": "进入下一个教学阶段"
            },
            {
                "name": "start_review",
                "description": "开始复盘总结"
            }
        ]
    
    async def initialize(self) -> AgentAction:
        """初始化：生成第一阶段的开场白"""
        context = self.state.context
        student_name = context.get("student_name", "同学")
        student_answer = context.get("student_answer", "?")
        question_index = context.get("question_index", 1)
        
        # 生成开场白
        opening_script = await self._generate_script(
            phase=1,
            user_input=None,
            is_opening=True
        )
        
        self.state.add_message("agent", opening_script)
        
        return AgentAction(
            type=ActionType.SEND_MESSAGE,
            payload={
                "text": opening_script,
                "require_task": True,
                "task_type": TaskType.VOICE.value,
                "phase": 1,
                "phase_name": COACHING_PHASES[1]["name"]
            }
        )
    
    async def process_input(
        self, 
        input_type: str, 
        input_data: Dict[str, Any]
    ) -> AgentAction:
        """
        处理学生输入，决定下一步动作
        
        Args:
            input_type: voice_response / highlight / select_option / task_completed
            input_data: 输入数据
        """
        # 记录学生输入
        self.state.add_message("student", str(input_data), input_type=input_type)
        
        current_phase = self.state.current_phase
        
        # 处理选项选择
        if input_type == "select_option":
            return await self._handle_select_option(input_data)
        
        # 处理其他输入类型
        return await self._handle_general_input(input_type, input_data)
    
    async def _handle_select_option(self, input_data: Dict[str, Any]) -> AgentAction:
        """处理学生选择选项"""
        selected_option = input_data.get("option_id", "")
        correct_answer = self.state.context.get("correct_answer", "")
        
        is_correct = selected_option.upper() == correct_answer.upper()
        
        if is_correct:
            # 答对了！直接进入复盘
            self.state.current_phase = 6
            review_script = await self._generate_script(
                phase=6,
                user_input={"selected": selected_option, "is_correct": True},
                is_opening=False
            )
            self.state.add_message("agent", review_script)
            
            return AgentAction(
                type=ActionType.START_REVIEW,
                payload={
                    "text": review_script,
                    "is_correct": True,
                    "phase": 6,
                    "phase_name": COACHING_PHASES[6]["name"]
                }
            )
        else:
            # 答错了
            self.state.wrong_count += 1
            
            if self.state.wrong_count >= self.MAX_WRONG_ATTEMPTS:
                # 2 次错误，强制进入复盘
                self.state.current_phase = 6
                review_script = await self._generate_script(
                    phase=6,
                    user_input={"selected": selected_option, "is_correct": False, "forced": True},
                    is_opening=False
                )
                self.state.add_message("agent", review_script)
                
                return AgentAction(
                    type=ActionType.START_REVIEW,
                    payload={
                        "text": review_script,
                        "is_correct": False,
                        "forced_review": True,
                        "phase": 6,
                        "phase_name": COACHING_PHASES[6]["name"]
                    }
                )
            else:
                # 还有机会，继续引导
                hint_script = await self._generate_script(
                    phase=self.state.current_phase,
                    user_input={"selected": selected_option, "is_correct": False},
                    is_opening=False
                )
                self.state.add_message("agent", hint_script)
                
                return AgentAction(
                    type=ActionType.SEND_MESSAGE,
                    payload={
                        "text": hint_script,
                        "require_task": True,
                        "task_type": self._get_current_task_type().value,
                        "wrong_count": self.state.wrong_count,
                        "remaining_attempts": self.MAX_WRONG_ATTEMPTS - self.state.wrong_count
                    }
                )
    
    async def _handle_general_input(
        self, 
        input_type: str, 
        input_data: Dict[str, Any]
    ) -> AgentAction:
        """处理一般输入（语音回答、画线等）"""
        current_phase = self.state.current_phase
        
        # 根据 LLM 分析决定下一步
        next_action = await self._think(input_type, input_data)
        
        return next_action
    
    async def _think(
        self, 
        input_type: str, 
        input_data: Dict[str, Any]
    ) -> AgentAction:
        """
        调用 LLM 分析学生输入，决定下一步动作
        
        这是 Agent 的核心决策逻辑
        """
        from services.ai_service import ai_service
        
        current_phase = self.state.current_phase
        phase_config = COACHING_PHASES[current_phase]
        context = self.state.context
        
        # 构建决策 Prompt
        decision_prompt = f"""
你是 Jarvis AI 教学助手，正在进行第 {current_phase} 步「{phase_config['name']}」教学。

## 当前状态
- 题目: {context.get('question_stem', '未知')}
- 正确答案: {context.get('correct_answer', '未知')}
- 学生选择: {context.get('student_answer', '未知')}
- 学生名字: {context.get('student_name', '同学')}
- 累计错误: {self.state.wrong_count}/{self.MAX_WRONG_ATTEMPTS}
- 当前阶段: {current_phase}/6 ({phase_config['name']})

## 学生输入
- 类型: {input_type}
- 内容: {input_data}

## 对话历史 (最近 3 条)
{self._format_recent_history(3)}

## 你的任务
分析学生的回答，决定下一步动作。返回 JSON 格式：

```json
{{
    "analysis": "简要分析学生回答的质量",
    "action": "SEND_MESSAGE 或 ADVANCE_PHASE 或 PUBLISH_TASK",
    "script": "要说的话术 (2-4句，带emoji，风趣幽默)",
    "require_task": true/false,
    "task_type": "voice/highlight/select" (如果 require_task 为 true),
    "should_advance": true/false (是否进入下一阶段)
}}
```

## 规则
1. 不要直接给出答案
2. 用苏格拉底式提问引导
3. 如果学生回答正确或理解到位，可以 should_advance: true
4. 话术要简短有力，使用中文
"""

        try:
            response = await ai_service.generate_text(
                prompt=decision_prompt,
                model="gemini"
            )
            
            # 解析 JSON 响应
            import json
            import re
            
            # 清理 markdown 代码块
            response = response.strip()
            if response.startswith("```"):
                response = re.sub(r'^```\w*\n?', '', response)
                response = re.sub(r'\n?```$', '', response)
            
            decision = json.loads(response)
            
            script = decision.get("script", "让我们继续...")
            should_advance = decision.get("should_advance", False)
            require_task = decision.get("require_task", True)
            task_type = decision.get("task_type", "voice")
            
            self.state.add_message("agent", script)
            
            if should_advance and current_phase < 6:
                # 进入下一阶段
                self.state.current_phase += 1
                new_phase = self.state.current_phase
                new_phase_config = COACHING_PHASES[new_phase]
                
                return AgentAction(
                    type=ActionType.ADVANCE_PHASE,
                    payload={
                        "text": script,
                        "require_task": True,
                        "task_type": new_phase_config["task_type"].value,
                        "phase": new_phase,
                        "phase_name": new_phase_config["name"]
                    }
                )
            else:
                # 继续当前阶段
                return AgentAction(
                    type=ActionType.SEND_MESSAGE,
                    payload={
                        "text": script,
                        "require_task": require_task,
                        "task_type": task_type if require_task else None,
                        "phase": current_phase,
                        "phase_name": phase_config["name"]
                    }
                )
                
        except Exception as e:
            print(f"[CoachingAgent] LLM decision failed: {e}")
            # Fallback: 默认进入下一阶段
            return await self._fallback_advance()
    
    async def _generate_script(
        self,
        phase: int,
        user_input: Any,
        is_opening: bool = False
    ) -> str:
        """生成教学话术"""
        from services.ai_service import ai_service
        
        phase_config = COACHING_PHASES[phase]
        context = self.state.context
        
        if is_opening:
            prompt = f"""
生成第 {phase} 步「{phase_config['name']}」的开场话术。

学生名字: {context.get('student_name', '同学')}
学生选择了错误答案: {context.get('student_answer', '?')}
题目序号: 第 {context.get('question_index', 1)} 题

要求：
1. 风趣幽默，带 emoji
2. 表示理解学生遇到困难
3. 不要直接告诉答案
4. 2-4 句话

直接输出话术，不要其他格式。
"""
        else:
            prompt = f"""
继续第 {phase} 步「{phase_config['name']}」的教学。

学生刚才的回复: {user_input}

要求：
1. 根据学生回复给予反馈
2. 风趣幽默，带 emoji
3. 引导下一步思考
4. 2-4 句话

直接输出话术，不要其他格式。
"""
        
        try:
            script = await ai_service.generate_text(prompt=prompt, model="gemini")
            return script.strip().strip('"')
        except Exception as e:
            print(f"[CoachingAgent] Script generation failed: {e}")
            # Fallback
            fallback_scripts = {
                1: f"哎呀 {context.get('student_name', '同学')}，第 {context.get('question_index', 1)} 题掉坑里了 🙈\n\n能告诉我为什么选 {context.get('student_answer', '这个')} 吗？",
                2: "拿出我们的 GPS 卡！🧭 第一步是什么来着？",
                3: "好的！现在找找题干里的关键词 🔍",
                4: "带着关键词去文章里找原句 👀",
                5: "现在再给你一次机会，会选什么？💪",
                6: "来复盘一下这道题的解法 📝",
            }
            return fallback_scripts.get(phase, "让我们继续...")
    
    async def _fallback_advance(self) -> AgentAction:
        """Fallback: 默认进入下一阶段"""
        if self.state.current_phase < 6:
            self.state.current_phase += 1
        
        phase = self.state.current_phase
        phase_config = COACHING_PHASES[phase]
        
        return AgentAction(
            type=ActionType.ADVANCE_PHASE,
            payload={
                "text": f"好的，我们进入下一步：{phase_config['name']} 🚀",
                "require_task": True,
                "task_type": phase_config["task_type"].value,
                "phase": phase,
                "phase_name": phase_config["name"]
            }
        )
    
    def _get_current_task_type(self) -> TaskType:
        """获取当前阶段的任务类型"""
        phase_config = COACHING_PHASES.get(self.state.current_phase, COACHING_PHASES[1])
        return phase_config["task_type"]
    
    def _format_recent_history(self, n: int = 3) -> str:
        """格式化最近 n 条对话历史"""
        recent = self.state.conversation_history[-n:] if self.state.conversation_history else []
        if not recent:
            return "(暂无对话)"
        
        lines = []
        for msg in recent:
            role_label = "Jarvis" if msg.role == "agent" else "学生"
            lines.append(f"- {role_label}: {msg.content[:100]}...")
        return "\n".join(lines)
