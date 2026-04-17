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

PAPER_CLASSIFIER_PROVIDER=
PAPER_CLASSIFIER_MODEL=
PAPER_SUMMARIZER_PROVIDER=
PAPER_SUMMARIZER_MODEL=
```

如果不单独指定 `PAPER_CLASSIFIER_*` / `PAPER_SUMMARIZER_*`，系统会默认使用当前可用 provider 列表里的第一个。

## 当前主链路

```text
前端上传表单
  -> POST /api/papers/upload
  -> 保存 PDF 到 data/papers/raw/
  -> 写入 papers 表
  -> processPaper(paperId)
     -> extract
     -> classify
     -> summarize
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
- `lib/pipeline/*`: 提取、分类、总结总流程
- `lib/agents/*`: 分类与总结 agent
- `components/upload-form.tsx`: 真实上传表单
- `components/agent-playground.tsx`: 多模型试验台
