# Literature Web App

一个面向个人研究者的文献网站骨架，目标是替代“固定时间批处理”的模式，改成“上传即处理、手机和 PC 都能随时查看”。

## 已实现

- `Next.js App Router` 项目骨架
- 首页 Dashboard
- 文献库列表页
- 论文详情页
- 上传页
- 上传占位 API
- 后端 `agent` 分类示例 API
- 基于当前项目文献的 mock 数据

## 当前状态

这是第一版站点骨架，重点是把结构和页面先搭起来。

当前还没有真正接入：

- Supabase
- PostgreSQL
- 对象存储
- 后台异步任务
- 本地 PDF 提取脚本

## 现在 agent 是怎么接进项目的

真实项目里不要从前端直接调 agent，而是走这条链路：

```text
前端表单 -> /api/classify -> lib/agents/paper-classifier.ts -> OpenAI
```

对应文件：

- agent 定义: `lib/agents/paper-classifier.ts`
- 分类 API: `app/api/classify/route.ts`
- 演示表单: `components/classify-demo-form.tsx`

## 环境变量

复制 `.env.example` 为 `.env.local`，并填入：

```bash
OPENAI_API_KEY=...
```

## 本地启动

当前环境里还没有 `node` / `npm`，所以我没有实际安装依赖并运行。

等你本机装好 Node.js 之后，在本目录执行：

```bash
npm install
npm run dev
```

然后打开：

```text
http://localhost:3000
```

## 推荐的下一步

1. 接入 Supabase
2. 把 mock 数据迁到数据库
3. 把 `/api/upload` 接到真实上传和后台处理链路
4. 上传后先做文本提取，再把提取结果送进 `paper-classifier` agent
5. 再补一个 dedupe agent 或规则层
