"""
测试讯飞语音转文字 - 自定义音频
"""
import asyncio
import os
import sys
import subprocess
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv(override=True)

# 启用详细日志
import logging
logging.basicConfig(level=logging.DEBUG)

from services.xunfei_stt_service import xunfei_stt_service

async def test():
    print("=" * 50)
    print("讯飞极速语音转写服务测试 (自定义音频)")
    print("=" * 50)
    
    test_audio = "/Users/ruiwang/Desktop/jarvis/jarvis_project_2/backend/static/audio/北苑路30号院.m4a"
    
    if not os.path.exists(test_audio):
        print(f"❌ 文件不存在: {test_audio}")
        return
    
    file_size = os.path.getsize(test_audio)
    print(f"音频文件: {test_audio}")
    print(f"文件大小: {file_size} bytes ({file_size / 1024:.1f} KB)")
    print()
    
    # 讯飞 STT 只支持 wav/pcm/mp3，m4a 需要先转换
    ext = test_audio.split('.')[-1].lower()
    audio_path = test_audio
    temp_file = None
    
    if ext in ['m4a', 'webm', 'mp4', 'aac', 'ogg']:
        print(f"文件格式 {ext} 不支持，使用 ffmpeg 转换为 mp3...")
        temp_file = tempfile.NamedTemporaryFile(suffix='.mp3', delete=False)
        temp_file.close()
        
        result = subprocess.run([
            'ffmpeg', '-y', '-i', test_audio,
            '-ar', '16000', '-ac', '1',
            temp_file.name
        ], capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"❌ ffmpeg 转换失败: {result.stderr}")
            return
        
        audio_path = temp_file.name
        print(f"✅ 转换成功: {audio_path}")
        print()
    
    # 读取音频文件
    with open(audio_path, 'rb') as f:
        audio_data = f.read()
    
    print(f"转换后大小: {len(audio_data)} bytes")
    print("开始转写...")
    result = await xunfei_stt_service.transcribe(audio_data, os.path.basename(audio_path), "zh")
    
    # 清理临时文件
    if temp_file:
        os.unlink(temp_file.name)
    
    print()
    if result:
        print(f"✅ 转写成功!")
        print(f"结果: {result}")
    else:
        print("❌ 转写失败")
    
    print("=" * 50)

if __name__ == "__main__":
    asyncio.run(test())
