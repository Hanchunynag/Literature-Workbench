# Literature Web App

一个面向 LEO SOP 研究主题的单机文献处理网站。

当前第一阶段已接入：

- 真实 PDF 上传
- 本地文件存储到 `data/papers/raw/`
- SQLite 单机数据库
- PDF 文本提取
- 结构化分类
- 结构化总结
- 文献库和详情页展示真实结果
- 独立的多模型 Agent playground

## 本地启动

先在项目目录执行：

```bash
npm install
python3 -m pip install marker-pdf
npm run dev
```

然后打开：

```text
http://localhost:3000
```

## 环境变量

复制 `.env.example` 为 `.env.local`，至少配置一组可用模型：

```bash
OPENAI_API_KEY=...
OPENAI_MODELS=gpt-5.4,gpt-5.4-mini,gpt-5.4-nano

OPENROUTER_API_KEY=
OPENROUTER_MODELS=openai/gpt-4.1-mini,anthropic/claude-3.5-sonnet,google/gemini-2.5-flash

GROQ_API_KEY=
GROQ_MODELS=llama-3.3-70b-versatile,qwen-qwq-32b

HERMES_API_KEY=
HERMES_BASE_URL=http://127.0.0.1:8642/v1
HERMES_MODELS=hermes-agent

PDF_PYTHON_BIN=python3
PDF_EXTRACTOR_BACKEND=marker

PAPER_CLASSIFIER_PROVIDER=
PAPER_CLASSIFIER_MODEL=
PAPER_SUMMARIZER_PROVIDER=
PAPER_SUMMARIZER_MODEL=
```

如果不单独指定 `PAPER_CLASSIFIER_*` / `PAPER_SUMMARIZER_*`，系统会默认使用当前可用 provider 列表里的第一个。

`PDF_EXTRACTOR_BACKEND` 可选值：

- `marker`: 服务器推荐，使用 Marker 解析 PDF
- `pypdf`: 使用当前轻量 `pypdf` 解析脚本
- `langchain`: 使用 `LangChain + PyPDFLoader` 实验版

## 服务器部署

可以。你可以直接在服务器上把整个项目拉下来运行，但不是只 `git clone` 就结束，还需要安装依赖和配置环境变量。

最小步骤：

```bash
git clone <your-repo>
cd Literature-Workbench/literature_web_app
npm install
python3 -m pip install marker-pdf
cp .env.example .env.local
npm run build
npm start
```

服务器至少需要：

- Node.js 18+
- Python 3.10+
- `marker-pdf`
- 可用的本地模型服务，或 Hermes/OpenAI-compatible 模型服务

说明：

- `PDF_EXTRACTOR_BACKEND=marker` 时，上传后的 PDF 会优先走 Marker 提取。
- 上传的 PDF、数据库和分析结果都会落到服务器本地 `data/` 目录。
- 如果你服务器上跑本地模型，可以把 `HERMES_BASE_URL` 指向服务器本机模型地址。

## 当前主链路

```text
前端上传表单
  -> POST /api/papers/upload
  -> 保存 PDF 到 data/papers/raw/
  -> 写入 papers 表
  -> processPaper(paperId)
     -> extract
     -> summarize
     -> validate
     -> save result
```

## Hermes 调用日志

每次上传后的 Hermes 分类与总结调用，都会落盘到：

```text
data/papers/analysis/agent-logs/<paperId>/
  classification.attempt-1.json
  classification.attempt-2.json
  summary.attempt-1.json
  summary.attempt-2.json
```

每个日志文件都会记录：

- 实际发送给 Hermes 的协议载荷
- 实际传给 runner 的序列化请求正文
- 使用的 provider / model
- agent instructions
- Hermes 原始返回文本
- 结构化解析结果
- 失败时的错误信息

## 更新记录

持续更新的功能修复说明见：

```text
UPDATE_LOG.md
```

## 目录重点

- `app/api/papers/upload/route.ts`: 上传 PDF
- `app/api/papers/[id]/route.ts`: 获取单篇论文
- `app/api/papers/[id]/status/route.ts`: 获取处理状态
- `app/api/papers/[id]/reprocess/route.ts`: 重新处理
- `lib/db/*`: SQLite schema 与查询
- `lib/pipeline/*`: 提取、论文信息总结、校验总流程
- `lib/agents/*`: 论文信息提炼与校验 agent
- `components/upload-form.tsx`: 真实上传表单
- `components/agent-playground.tsx`: 多模型试验台
