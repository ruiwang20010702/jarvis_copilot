# Zeabur 部署用 Dockerfile
# 包含 ffmpeg 系统依赖

FROM python:3.11-slim

# 安装系统依赖 (包括 ffmpeg)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 复制依赖文件并安装
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 暴露端口 (Zeabur 会注入 PORT 环境变量)
EXPOSE 8000

# 启动命令
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]

