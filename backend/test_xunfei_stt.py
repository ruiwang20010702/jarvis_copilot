"""
测试讯飞极速语音转写服务 - 使用真实音频文件
"""
import asyncio
import os
import sys
import logging

# 设置日志
logging.basicConfig(level=logging.INFO, format='%(levelname)s:%(name)s:%(message)s')

# 添加项目路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

async def test_xunfei_stt():
    from services.xunfei_stt_service import xunfei_stt_service
    
    print("=" * 50)
    print("讯飞极速语音转写服务测试 (真实音频)")
    print("=" * 50)
    
    # 检查配置
    print("\n1. 检查配置...")
    appid = os.getenv("XUNFEI_APPID")
    api_key = os.getenv("XUNFEI_API_KEY")
    api_secret = os.getenv("XUNFEI_API_SECRET")
    
    print(f"✅ XUNFEI_APPID: {appid}")
    print(f"✅ XUNFEI_API_KEY: {api_key[:10]}...")
    print(f"✅ XUNFEI_API_SECRET: {api_secret[:10]}...")
    
    # 使用真实音频文件
    audio_path = "/Users/ruiwang/Desktop/jarvis/jarvis_project_2/backend/static/audio/companies.mp3"
    
    if not os.path.exists(audio_path):
        print(f"❌ 音频文件不存在: {audio_path}")
        return
    
    print(f"\n2. 加载音频文件...")
    print(f"   路径: {audio_path}")
    
    with open(audio_path, 'rb') as f:
        audio_data = f.read()
    
    print(f"   大小: {len(audio_data)} bytes ({len(audio_data)/1024:.1f} KB)")
    
    # 测试转写
    print("\n3. 测试语音转写...")
    
    result = await xunfei_stt_service.transcribe(
        audio_data=audio_data,
        filename="companies.mp3",
        language="zh"  # 使用中文 (讯飞英语需要额外配置)
    )
    
    if result is not None:
        print(f"\n✅ 转写成功!")
        print(f"结果: {result}")
    else:
        print("\n❌ 转写失败")
    
    print("\n" + "=" * 50)
    print("测试完成！")
    print("=" * 50)

if __name__ == "__main__":
    asyncio.run(test_xunfei_stt())
