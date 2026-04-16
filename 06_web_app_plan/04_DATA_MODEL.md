# 数据模型

## 核心原则

系统核心对象应该是数据库中的 `paper` 记录，而不是磁盘目录。

## 建议数据表

### 1. papers

存放每篇论文的主记录。

建议字段：

- `id`
- `title`
- `normalized_title`
- `year`
- `authors_text`
- `first_author`
- `doi`
- `abstract_text`
- `keywords`
- `language`
- `source_type`
- `storage_path`
- `status`
- `duplicate_of_paper_id`
- `processing_error`
- `created_at`
- `updated_at`

### 2. categories

存放大类和子类。

建议字段：

- `id`
- `name`
- `slug`
- `parent_id`
- `level`
- `sort_order`
- `is_active`

说明：

- `level = 1` 表示大类
- `level = 2` 表示子类

### 3. tags

存放标签。

建议字段：

- `id`
- `name`
- `slug`
- `description`

### 4. paper_categories

用于论文和分类的关联。

建议字段：

- `paper_id`
- `category_id`
- `is_primary`

### 5. paper_tags

用于论文和标签的关联。

建议字段：

- `paper_id`
- `tag_id`

### 6. paper_summaries

存放结构化阅读提要。

建议字段：

- `paper_id`
- `paper_snapshot`
- `what_this_paper_does`
- `claimed_innovations`
- `useful_to_my_topic`
- `limitations`
- `my_candidate_ideas`
- `core_contribution`
- `relevance_note`
- `innovation_note`
- `summary_version`
- `updated_at`

### 7. personal_notes

存放你自己的阅读笔记。

建议字段：

- `id`
- `paper_id`
- `note_type`
- `content`
- `created_at`
- `updated_at`

### 8. projects

存放研究专题。

建议字段：

- `id`
- `name`
- `description`
- `status`

### 9. paper_projects

用于论文和专题关联。

建议字段：

- `paper_id`
- `project_id`

### 10. processing_jobs

存放后台处理记录。

建议字段：

- `id`
- `paper_id`
- `job_type`
- `status`
- `input_payload`
- `result_payload`
- `error_message`
- `started_at`
- `finished_at`

## 一条论文记录应至少能回答的问题

系统里每篇论文最终都应支持快速回答：

- 这篇论文是什么
- 它属于哪个方向
- 它和我当前课题是否相关
- 它的核心贡献是什么
- 它的局限是什么
- 它是否启发了新的 candidate idea

## 文件系统的角色

文件系统仍然保留，但只负责：

- 存原始 PDF
- 存处理过程产物
- 作为备份

不要再让它承担主分类逻辑。
