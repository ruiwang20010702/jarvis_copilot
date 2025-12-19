"""
测试发音评测 - Safari m4a 格式
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv(override=True)

import logging
logging.basicConfig(level=logging.INFO)

from services.pronunciation_service import pronunciation_service

async def test():
    print("=" * 50)
    print("测试 Safari m4a 格式发音评测")
    print("=" * 50)
    
    m4a_audio = "/Users/ruiwang/Desktop/jarvis/jarvis_project_2/backend/static/audio/test_safari.m4a"
    reference_word = "biodegradable"
    
    if not os.path.exists(m4a_audio):
        print(f"❌ 文件不存在: {m4a_audio}")
        return
    
    file_size = os.path.getsize(m4a_audio)
    print(f"测试音频: {m4a_audio}")
    print(f"文件大小: {file_size} bytes")
    print(f"参考单词: {reference_word}")
    print()
    
    print("调用发音评测服务...")
    result = await pronunciation_service.assess_pronunciation(m4a_audio, reference_word)
    
    print()
    print("评测结果:")
    print(f"  准确度: {result.get('accuracy', 0)}")
    print(f"  流利度: {result.get('fluency', 0)}")
    print(f"  完整度: {result.get('completeness', 0)}")
    print(f"  综合分: {result.get('overall', 0)}")
    
    if result.get('error'):
        print(f"  ❌ 错误: {result.get('error')}")
    else:
        print("  ✅ 评测成功!")
    
    print("=" * 50)

if __name__ == "__main__":
    asyncio.run(test())
