# Zeabur 部署指南 - Project 2 (Jarvis Copilot)

## 📋 部署概述

Project 2 需要部署两个服务：
1. **Backend** (FastAPI) - API 服务 + WebSocket
2. **Frontend** (Vite/React) - 静态网站

---

## 🚀 部署步骤

### Step 1: 创建 Zeabur 项目

1. 登录 [Zeabur Dashboard](https://dash.zeabur.com)
2. 点击 "New Project"
3. 选择区域（推荐：Hong Kong 或 Singapore）

### Step 2: 部署 PostgreSQL 数据库

1. 在项目中点击 "Add Service" → "Database" → "PostgreSQL"
2. 等待数据库启动完成
3. 记下连接信息（Zeabur 会自动注入 `POSTGRES_URL` 环境变量）

### Step 3: 部署后端服务

1. 点击 "Add Service" → "Git" → 选择你的 GitHub 仓库
2. 选择 `jarvis_project_2/backend` 目录作为根目录
3. Zeabur 会自动检测 Python 项目并使用 `Procfile` 启动

**配置环境变量**（在 Variables 标签页）：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `DATABASE_URL` | `${POSTGRES_URL}` | 数据库连接（自动注入） |
| `GEMINI_API_KEY` | 你的 API Key | Google Gemini |
| `GEMINI_MODEL` | `gemini-2.0-flash` | 模型选择 |
| `GEMINI_THINKING_LEVEL` | `off` 或 `low` | 思考级别 |
| `COACHING_AI_PROVIDER` | `gemini` | 代练 AI 提供商 |
| `STT_ENGINE` | `groq` | 语音识别引擎 |
| `GROQ_API_KEY` | 你的 API Key | Groq Whisper |
| `XUNFEI_APPID` | 你的 AppID | 讯飞配置 |
| `XUNFEI_API_SECRET` | 你的 Secret | 讯飞配置 |
| `XUNFEI_API_KEY` | 你的 Key | 讯飞配置 |

4. 点击 "Deploy" 并等待部署完成
5. 记录后端域名，例如：`jarvis-backend.zeabur.app`

### Step 4: 部署前端服务

1. 点击 "Add Service" → "Git" → 选择同一仓库
2. 选择 `jarvis_project_2/frontend` 目录作为根目录

**配置环境变量**：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `VITE_WS_URL` | `wss://jarvis-backend.zeabur.app/ws` | WebSocket 地址 |
| `VITE_API_URL` | `https://jarvis-backend.zeabur.app` | API 地址 |

3. 点击 "Deploy"

### Step 5: 绑定域名（可选）

1. 在每个服务的 "Domain" 标签页
2. 添加自定义域名或使用 Zeabur 提供的子域名

---

## 🔧 常见问题

### Q: WebSocket 连接失败？
- 确保前端 `VITE_WS_URL` 使用 `wss://`（不是 `ws://`）
- 确保后端域名正确

### Q: 数据库连接失败？
- 检查 `DATABASE_URL` 格式是否正确
- 确保使用 `postgresql+asyncpg://` 前缀

### Q: API 请求 CORS 错误？
- 后端已配置允许所有来源，通常不会有问题
- 如需限制，修改 `main.py` 中的 `allow_origins`

---

## 📁 配置文件清单

| 文件 | 位置 | 用途 |
|------|------|------|
| `Procfile` | backend/ | 定义启动命令 |
| `zeabur.json` | backend/ | Zeabur 配置 |
| `.env.zeabur` | backend/ | 环境变量模板 |
| `zeabur.json` | frontend/ | 前端构建配置 |
| `.env.zeabur` | frontend/ | 前端环境变量模板 |
| `requirements.txt` | backend/ | Python 依赖 |
