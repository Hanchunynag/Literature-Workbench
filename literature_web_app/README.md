# Literature Web App

一个面向 LEO SOP 研究主题的文献展示网站，当前版本只关注网站设计、内容组织和阅读体验。

## 已实现

- `Next.js App Router` 项目骨架
- 首页策展视图
- 文献库列表页
- 论文详情页
- 上传论文页（前端交互）
- 多模型 Agent 试验台
- 基于当前项目文献的 mock 数据

## 当前状态

这是一个以前端体验为主的网站版本，保留上传页面与交互，并新增了多模型 Agent 试验台；当前仍不包含本地处理链路。

## Agent 接入

项目现在提供一个服务端 Agent 入口：

```text
前端 playground -> /api/agent -> lib/research-agent.ts -> 可切换 provider / model
```

当前内置了 3 类 provider 配置：

- `OpenAI`
- `OpenRouter`
- `Groq`

其中 `OpenRouter` 和 `Groq` 走 OpenAI-compatible `Chat Completions` 兼容路径，方便你切换不同模型尝试。

### 环境变量

把 `.env.example` 复制为 `.env.local`，至少填一组可用的 API Key：

```bash
OPENAI_API_KEY=...
OPENAI_MODELS=gpt-5.4,gpt-5.4-mini,gpt-5.4-nano

OPENROUTER_API_KEY=...
OPENROUTER_MODELS=openai/gpt-4.1-mini,anthropic/claude-3.5-sonnet,google/gemini-2.5-flash

GROQ_API_KEY=...
GROQ_MODELS=llama-3.3-70b-versatile,qwen-qwq-32b
```

## 本地启动

在本目录执行：

```bash
npm install
npm run dev
```

然后打开：

```text
http://localhost:3000
```

## 当前结构

- `app/page.tsx`: 首页策展视图
- `app/library/page.tsx`: 文献库浏览页
- `app/upload/page.tsx`: 上传论文页
- `app/api/agent/route.ts`: Agent API 入口
- `app/papers/[id]/page.tsx`: 单篇论文详情页
- `components/agent-playground.tsx`: 多模型试验台
- `lib/agent-catalog.ts`: provider / model 配置
- `lib/research-agent.ts`: Agent 逻辑与工具
- `lib/mock-data.ts`: 站点展示用示例数据
