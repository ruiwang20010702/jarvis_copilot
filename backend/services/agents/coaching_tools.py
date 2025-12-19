"""
Coaching Agent 工具定义

LLM 可以调用这些工具来触发前端交互
"""

# 代练阶段可用的工具
COACHING_TOOLS = [
    {
        "name": "publish_voice_task",
        "description": "发布语音任务，让学生用语音回答问题。当需要学生解释自己的想法或回答开放性问题时使用。",
        "parameters": {
            "type": "object",
            "properties": {
                "instruction": {
                    "type": "string",
                    "description": "给学生的任务说明，如'请告诉我你为什么选择这个答案'"
                }
            },
            "required": ["instruction"]
        }
    },
    {
        "name": "publish_highlight_task",
        "description": "发布画线任务，让学生在文章或题干中标记关键词句。当需要学生定位关键信息时使用。",
        "parameters": {
            "type": "object",
            "properties": {
                "instruction": {
                    "type": "string",
                    "description": "给学生的任务说明，如'请在文章中找到并画出包含答案的句子'"
                },
                "target": {
                    "type": "string",
                    "description": "画线目标区域: article (文章) 或 question (题干)"
                }
            },
            "required": ["instruction", "target"]
        }
    },
    {
        "name": "publish_select_task",
        "description": "发布选择任务，让学生重新选择答案。当学生理解了正确思路后，让他们确认答案时使用。",
        "parameters": {
            "type": "object",
            "properties": {
                "instruction": {
                    "type": "string",
                    "description": "给学生的任务说明，如'现在你认为正确答案是哪个？'"
                }
            },
            "required": ["instruction"]
        }
    },
    {
        "name": "show_gps_card",
        "description": "展示 GPS 解题卡片，帮助学生回忆解题步骤。在技能召回阶段使用。",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": []
        }
    },
    {
        "name": "start_review",
        "description": "开始复盘总结，结束本次教学。当学生已经理解正确答案和解题方法后使用。",
        "parameters": {
            "type": "object",
            "properties": {
                "summary": {
                    "type": "string",
                    "description": "复盘总结内容，包括解题步骤和关键要点"
                }
            },
            "required": ["summary"]
        }
    },
    {
        "name": "reveal_answer",
        "description": "揭示正确答案。当学生已用完2次选择机会仍未答对时使用。",
        "parameters": {
            "type": "object",
            "properties": {
                "explanation": {
                    "type": "string",
                    "description": "答案解释，说明为什么正确答案是对的"
                }
            },
            "required": ["explanation"]
        }
    }
]


def get_tool_by_name(name: str) -> dict:
    """根据名称获取工具定义"""
    for tool in COACHING_TOOLS:
        if tool["name"] == name:
            return tool
    return None


# 难句讲解阶段可用的工具
SURGERY_TOOLS = [
    {
        "name": "publish_voice_task",
        "description": "发布语音任务，让学生用语音回答问题。当需要学生解释对句子的理解、翻译句子成分、或回答开放性问题时使用。",
        "parameters": {
            "type": "object",
            "properties": {
                "instruction": {
                    "type": "string",
                    "description": "给学生的任务说明，如'请告诉我你对这个句子的理解'"
                }
            },
            "required": ["instruction"]
        }
    },
    {
        "name": "publish_highlight_task",
        "description": "发布画线任务，让学生在句子中标记关键词句。当需要学生定位核心成分或修饰语时使用。",
        "parameters": {
            "type": "object",
            "properties": {
                "instruction": {
                    "type": "string",
                    "description": "给学生的任务说明，如'请在句子中画出主语部分'"
                },
                "target": {
                    "type": "string",
                    "description": "画线目标区域: article (文章) 或 question (题干)"
                }
            },
            "required": ["instruction", "target"]
        }
    },
    {
        "name": "show_sentence_structure",
        "description": "展示句子结构分解图，帮助学生可视化理解句子成分。",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": []
        }
    },
    {
        "name": "complete_surgery",
        "description": "结束当前长难句讲解，进入下一句或完成教学。当学生已经理解句子含义和结构后使用。",
        "parameters": {
            "type": "object",
            "properties": {
                "summary": {
                    "type": "string",
                    "description": "总结本句讲解要点"
                }
            },
            "required": ["summary"]
        }
    }
]
