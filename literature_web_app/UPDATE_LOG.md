# Update Log

记录这个站点每次主要更新修复了什么，方便回看功能变化和排查回归。

## 2026-04-17

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

## 2026-04-16

### 首版处理链路

- 建立了 PDF 上传、SQLite 记录、文本提取、分类、总结和详情展示的基础链路。
- 增加了批次清单、提取结果和分析结果的本地文件落盘。
- 提供了论文库页面、上传页面和单篇详情页。
