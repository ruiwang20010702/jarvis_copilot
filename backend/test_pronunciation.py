"""
测试发音评测 - 模拟学生录音流程
测试 webm/m4a 格式 -> 发音评测 的完整流程
"""
import asyncio
import os
import sys
import subprocess
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv(override=True)

import logging
logging.basicConfig(level=logging.INFO)

from services.pronunciation_service import pronunciation_service

async def test():
    print("=" * 50)
    print("发音评测测试 - 模拟学生录音流程")
    print("=" * 50)
    
    # 使用一个现有的 mp3 文件（模拟学生录音）
    test_audio = "/Users/ruiwang/Desktop/jarvis/jarvis_project_2/backend/static/audio/companies.mp3"
    reference_word = "companies"
    
    if not os.path.exists(test_audio):
        print(f"❌ 文件不存在: {test_audio}")
        return
    
    file_size = os.path.getsize(test_audio)
    print(f"测试音频: {test_audio}")
    print(f"文件大小: {file_size} bytes")
    print(f"参考单词: {reference_word}")
    print()
    
    # 模拟将 mp3 转换为 webm（因为学生端通常录的是 webm）
    # 这里为了测试，我们直接用 mp3 先测
    print("调用发音评测服务...")
    result = await pronunciation_service.assess_pronunciation(test_audio, reference_word)
    
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
    
    # 测试 m4a 文件
    print()
    print("=" * 50)
    print("测试 m4a 格式 (模拟手机录音)")
    print("=" * 50)
    
    m4a_audio = "/Users/ruiwang/Desktop/jarvis/jarvis_project_2/backend/static/audio/北苑路30号院.m4a"
    if os.path.exists(m4a_audio):
        print(f"测试音频: {m4a_audio}")
        print(f"参考文本: 北苑路30号院")
        print()
        
        print("调用发音评测服务...")
        result2 = await pronunciation_service.assess_pronunciation(m4a_audio, "北苑路30号院")
        
        print()
        print("评测结果:")
        print(f"  准确度: {result2.get('accuracy', 0)}")
        print(f"  流利度: {result2.get('fluency', 0)}")
        print(f"  完整度: {result2.get('completeness', 0)}")
        print(f"  综合分: {result2.get('overall', 0)}")
        
        if result2.get('error'):
            print(f"  ❌ 错误: {result2.get('error')}")
        else:
            print("  ✅ 评测成功!")
    else:
        print(f"跳过 m4a 测试 - 文件不存在")
    
    print("=" * 50)

if __name__ == "__main__":
    asyncio.run(test())
