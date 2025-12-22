# Jarvis Copilot - 智慧课堂助教系统

AI驱动的英语阅读教学辅助系统，支持教师端与学生端实时交互。

## 📁 项目结构

```
jarvis_project_2/
├── backend/                 # 后端服务 (FastAPI)
│   ├── docs/               # 项目文档
│   ├── prompts/            # AI 提示词模板
│   ├── routers/            # API 路由
│   ├── services/           # 业务服务
│   ├── static/             # 静态资源
│   ├── main.py             # 入口文件
│   ├── models.py           # 数据库模型
│   ├── schemas.py          # Pydantic schemas
│   └── requirements.txt    # Python 依赖
│
├── frontend/               # 前端应用 (React + Vite)
│   ├── src/
│   │   ├── components/     # UI 组件
│   │   │   ├── stages/     # 各教学阶段组件
│   │   │   └── shared/     # 共享组件
│   │   ├── config/         # 配置文件
│   │   └── services/       # API 服务
│   ├── store.ts            # Zustand 状态管理
│   └── package.json        # Node 依赖
│
└── docker-compose.yml      # Docker 配置
```

## 🎯 教学阶段

| 阶段 | 名称 | 描述 |
|------|------|------|
| warm-up | 热身 | 学生端准备 |
| skill | 技能 | 做题技巧讲解 |
| battle | 实战 | 学生独立做题 |
| coaching | 精准带练 | AI 苏格拉底式纠错 |
| vocab | 生词 | 生词学习与跟读 |
| surgery | 长难句 | 句子成分分析与拆解 |
| review | 复习 | 学习报告生成 |

## 🚀 快速开始

### 后端
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

### 前端
```bash
cd frontend
npm install
npm run dev
```

## 🔌 API 端点

- `GET /api/articles/{id}/versions/{level}` - 获取文章版本
- `POST /api/ai/chat/stream` - AI 流式对话
- `POST /api/ai/transcribe` - 语音转文字
- `POST /api/ai/pronunciation` - 发音评测
- `WS /ws/{room_id}` - WebSocket 实时同步

## 🔑 环境变量

参考 `backend/.env.example` 配置以下 API 密钥：
- `GEMINI_API_KEY` - Google Gemini
- `ARK_API_KEY` - 火山方舟 (Doubao)
- `GROQ_API_KEY` - Groq Whisper STT
- `XUNFEI_*` - 讯飞语音服务
