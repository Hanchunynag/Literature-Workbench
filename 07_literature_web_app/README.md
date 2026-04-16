# Literature Web App

一个面向 LEO SOP 研究主题的文献展示网站，当前版本只关注网站设计、内容组织和阅读体验。

## 已实现

- `Next.js App Router` 项目骨架
- 首页策展视图
- 文献库列表页
- 论文详情页
- 上传论文页（前端交互）
- 基于当前项目文献的 mock 数据

## 当前状态

这是一个以前端体验为主的网站版本，保留上传页面与交互，但不包含本地处理、Agent 分类或存储链路。

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
- `app/papers/[id]/page.tsx`: 单篇论文详情页
- `lib/mock-data.ts`: 站点展示用示例数据
