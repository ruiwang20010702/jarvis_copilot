from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import os
from pathlib import Path
from dotenv import load_dotenv

from routers import users, articles, sessions, websocket, vocab, ai, chat_stream

# Load environment variables
load_dotenv()

# Configure logging
import logging
import shutil
import subprocess

logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s: %(message)s'
)

logger = logging.getLogger(__name__)

def check_ffmpeg():
    """检查 ffmpeg 是否已安装"""
    ffmpeg_path = shutil.which("ffmpeg")
    if ffmpeg_path:
        try:
            result = subprocess.run(
                ["ffmpeg", "-version"], 
                capture_output=True, 
                text=True, 
                timeout=5
            )
            version_line = result.stdout.split('\n')[0] if result.stdout else "unknown version"
            logger.info(f"✅ ffmpeg 已安装: {version_line}")
            return True
        except Exception as e:
            logger.warning(f"⚠️ ffmpeg 检测失败: {e}")
            return False
    else:
        logger.warning("⚠️ ffmpeg 未安装！发音评分功能将无法正常工作。")
        logger.warning("   请安装 ffmpeg: brew install ffmpeg (macOS) 或 apt install ffmpeg (Linux)")
        return False

# 启动时检查 ffmpeg
check_ffmpeg()

app = FastAPI(
    title="Jarvis Backend API",
    description="Backend service for S9 Reading Classroom",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(users.router)
app.include_router(articles.router)
app.include_router(sessions.router)
app.include_router(websocket.router)
app.include_router(vocab.router)
app.include_router(ai.router)
app.include_router(chat_stream.router)

# Static Files - 为 TTS 音频文件提供服务
static_dir = Path(__file__).parent / "static"
static_dir.mkdir(exist_ok=True)
(static_dir / "audio").mkdir(exist_ok=True)
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

@app.get("/")
async def root():
    return {"message": "Welcome to Jarvis Backend API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    # Use SSL for WSS (secure WebSocket) support
    # Note: reload=False because reload mode is incompatible with SSL
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=port, 
        reload=False,  # SSL requires reload=False
        ssl_keyfile="server.key",
        ssl_certfile="server.crt"
    )


