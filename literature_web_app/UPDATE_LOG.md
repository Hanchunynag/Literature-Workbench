# Update Log

记录这个站点每次主要更新修复了什么，方便回看功能变化和排查回归。

## 2026-04-17

### 论文信息输出链路调整

- 上传主链路不再默认调用分类 agent，改为只做论文关键信息提炼与校验。
- Hermes 现在聚焦输出论文摘要、核心贡献、创新点、边界条件、适用前提、局限和校验备注。
- 维护任务不再因为“缺少分类结果”而把论文持续判定为待修复。

### 术语与校验增强

- 总结 agent 改为“两段式”：先生成论文信息草稿，再进行一次校验与修正。
- 新增术语校验约束，要求优先保留英文术语与缩写，避免像“Matrix Pencil”被生硬翻成“矩阵铅笔”。
- 日志里会额外记录校验阶段的请求和修正后结果，便于追查具体哪一步出错。
- 作者提取增加清洗，减少 `Senior Member, IEEE` 这类头衔被误当成作者发送给 Hermes。

### Hermes 调用链修复

- 上传后的论文处理改为顺序串行，按 `fileId` 顺序逐篇进入 Hermes，避免并发乱序。
- 分类和总结阶段改为每篇都必须调用 Hermes，不再条件跳过，也不再静默 fallback 到本地分析。
- Hermes provider 默认收敛到 `hermes`，并支持仅配置 `HERMES_BASE_URL` 时注册可用 provider。

### Hermes 载荷修复

- 发给 Hermes 的分析协议补上了 `authors` 字段。
- Hermes 输入继续保持轻载荷，只发送标题、作者、年份、摘要、结论和关键词，不发送正文。
- 去掉了把本地拼接的 `cleanSummary` 冒充论文原摘要发送给 Hermes 的行为，避免污染模型输入。

### Hermes 日志落盘

- 新增每篇论文的 Hermes 请求/响应落盘日志。
- 分类和总结都会按尝试次数保存到 `data/papers/analysis/agent-logs/<paperId>/`。
- 日志内容包含请求载荷、provider、model、instructions、原始返回、解析结果和错误信息。

### PDF 提取修复

- 改进了 PDF 章节标题识别，像 `5 Conclusion`、`2. Introduction` 这类带编号标题更容易被正确识别。
- 新增 Marker 提取脚本，并通过 `PDF_EXTRACTOR_BACKEND=marker` 支持服务器端优先使用 Marker 解析 PDF。
- Node 侧 Python 提取桥接改为可切换后端：`marker` / `pypdf` / `langchain`。
- Marker 脚本现在会禁用图片导出，并自动把正文 markdown 保存到本地目录，便于直接查看正文结果。
- Marker 脚本默认固定使用 `GPU 0`，并为引言/结论增加了无标题情况下的兜底提取逻辑，减少 `NOT_FOUND`。
- Markdown 结果现在按 batch 目录保存，文件名格式调整为 `年份_题目名.md`，方便后续按批处理和理论推导问答复用。

### 工作流升级

- 上传后的正式主链路调整为：`PDF 上传 -> Marker 生成 markdown -> 单个 Hermes agent 一次输出详细论文分析 JSON + 受约束分类 -> 页面展示结果`。
- `papers` 表新增 `markdown_path` 字段，详情页会显示 batch 编号和 markdown 存储路径。
- 主分析 agent 现在会优先读取服务器落盘的 markdown 正文，不再只依赖摘要/结论轻载荷。
- agent 输出改为单次完整 JSON，同时包含 `researchQuestion`、`coreMethod`、`experimentalMethodology`、`performanceMetrics` 等详细分析字段以及 taxonomy 分类字段。

## 2026-04-16

### 首版处理链路

- 建立了 PDF 上传、SQLite 记录、文本提取、分类、总结和详情展示的基础链路。
- 增加了批次清单、提取结果和分析结果的本地文件落盘。
- 提供了论文库页面、上传页面和单篇详情页。
