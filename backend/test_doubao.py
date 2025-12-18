#!/usr/bin/env python3
"""测试豆包 API 是否正常工作"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

# 临时设置豆包配置（如果 .env 里没有的话）
if not os.getenv("ARK_API_KEY"):
    os.environ["ARK_API_KEY"] = "028aa172-3802-454f-9224-04a71c91bf4c"
    os.environ["ARK_MODEL"] = "doubao-seed-1-8-251215"

from services.ai_service import generate_stream_with_tools_doubao

# 测试工具定义
test_tools = [
    {
        "name": "publish_voice_task",
        "description": "发布语音任务",
        "parameters": {
            "type": "object",
            "properties": {
                "instruction": {
                    "type": "string",
                    "description": "给学生的指示"
                }
            },
            "required": ["instruction"]
        }
    }
]

# 测试消息
test_messages = [
    {"role": "user", "content": "你好，请简单介绍一下自己，然后调用 publish_voice_task 工具让我说点什么。"}
]

test_system_prompt = "你是一个友善的 AI 助教。你可以调用工具与学生互动。"

print("=" * 50)
print("🔥 测试豆包 API")
print("=" * 50)
print(f"Model: {os.getenv('ARK_MODEL', 'doubao-seed-1-8-251215')}")
print(f"API Key: {os.getenv('ARK_API_KEY')[:8]}...")
print("-" * 50)

try:
    full_text = ""
    tool_calls = []
    
    for event in generate_stream_with_tools_doubao(
        messages=test_messages,
        tools=test_tools,
        system_prompt=test_system_prompt
    ):
        if event["type"] == "text":
            print(event["content"], end="", flush=True)
            full_text += event["content"]
        elif event["type"] == "tool_call":
            tool_calls.append(event["content"])
            print(f"\n\n🔧 Tool Call: {event['content']}")
        elif event["type"] == "error":
            print(f"\n❌ Error: {event['content']}")
        elif event["type"] == "done":
            print("\n")
    
    print("-" * 50)
    print(f"✅ 测试完成!")
    print(f"   文本长度: {len(full_text)}")
    print(f"   工具调用: {len(tool_calls)} 个")
    
    if tool_calls:
        print("\n   工具调用详情:")
        for tc in tool_calls:
            print(f"   - {tc['name']}: {tc['arguments']}")

except Exception as e:
    print(f"\n❌ 测试失败: {e}")
    import traceback
    traceback.print_exc()
