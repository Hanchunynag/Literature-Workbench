# Personal Literature Web App Plan

这个目录集中存放“个人文献网站”的规划输出，目标是把当前本地文献处理流程升级为一个可在手机和 PC 上随时访问、上传即处理、分类可扩展的个人研究工作台。

## 文件说明

- `01_PRODUCT_SCOPE.md`: 产品目标、核心需求、MVP 边界。
- `02_INFORMATION_ARCHITECTURE.md`: 分类体系、页面结构、核心功能模块。
- `03_TECH_ARCHITECTURE.md`: 推荐技术栈、处理链路、部署建议。
- `04_DATA_MODEL.md`: 核心数据表设计与字段建议。
- `05_IMPLEMENTATION_ROADMAP.md`: 分阶段实施计划。

## 当前建议

推荐先做“快速个人版”：

- 前端: Next.js
- 后端: Next.js Route Handlers
- 数据库: Supabase Postgres
- 文件存储: Supabase Storage
- 异步任务: Trigger.dev 或轻量队列
- AI 处理: 复用现有本地提取脚本思路，封装成服务

原因很简单：

- 开发速度快
- 手机和 PC 访问天然方便
- 部署门槛低
- 后续仍可平滑升级成独立后端架构
