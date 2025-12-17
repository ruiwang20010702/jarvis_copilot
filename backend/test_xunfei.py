"""
测试讯飞语音评测 API (使用官方 SDK)
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv(override=True)

from services.xunfei_pronunciation_service import XunfeiPronunciationService

async def test():
    print("=" * 50)
    print("测试讯飞语音评测服务 (官方 SDK)")
    print("=" * 50)
    
    appid = os.getenv("XUNFEI_APPID")
    secret = os.getenv("XUNFEI_API_SECRET")
    key = os.getenv("XUNFEI_API_KEY")
    
    print(f"APPID: {appid[:4] + '...' + appid[-4:] if appid else 'Not set'}")
    print(f"API_SECRET: {'已配置' if secret else 'Not set'}")
    print(f"API_KEY: {key[:4] + '...' + key[-4:] if key else 'Not set'}")
    print()
    
    if not all([appid, secret, key]):
        print("❌ 讯飞凭据未配置！请检查 .env 文件")
        return
    
    service = XunfeiPronunciationService()
    
    test_audio = "static/audio/companies.wav"
    if os.path.exists(test_audio):
        print(f"使用测试音频: {test_audio}")
        result = await service.assess_pronunciation(test_audio, "companies")
        print(f"\n评测结果:")
        print(f"  准确度: {result.get('accuracy', 0)}")
        print(f"  流利度: {result.get('fluency', 0)}")
        print(f"  完整度: {result.get('completeness', 0)}")
        print(f"  综合分: {result.get('overall', 0)}")
        if result.get('error'):
            print(f"  ❌ 错误: {result.get('error')}")
        else:
            print("  ✅ 测试成功！")
    else:
        print(f"未找到测试音频: {test_audio}")

if __name__ == "__main__":
    asyncio.run(test())
