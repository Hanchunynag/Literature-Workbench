
# AGENTS.md

## Project purpose
This project manages research papers for LEO signal-of-opportunity navigation and positioning in GNSS-denied environments.

## Core workflow
1. Scan `00_inbox/` for newly added PDF papers.
2. Extract title, year, keywords, and rough topic from each paper.
3. Classify each paper into exactly one primary folder under `01_library/`.
4. If confidence is low, move the paper to `01_library/待人工确认/`.
5. Update:
   - `02_notes/PAPER_INDEX.md`
   - `03_metadata/papers_index.csv`
6. Maintain:
   - `02_notes/DAILY_LOG.md`
   - `02_notes/INNOVATION_IDEAS.md`
   - `02_notes/CURRENT_TOPIC.md`
   - `02_notes/SELECTED_IDEAS.md`
   - `02_notes/THEORY_TASK_QUEUE.md`
7. For selected high-value innovation ideas, create derivation drafts under `05_derivations/`.

## Primary categories
- 定位方法
- 信号捕获与处理
- 仿真与实验分析
- 轨道与星历误差建模
- 鲁棒估计与加权方法
- 多星座融合与观测建模
- 综述与领域概览

## Research focus
Prioritize relevance to:
- LEO SOP positioning/navigation under GNSS-denied environments
- Iridium and Orbcomm fusion
- pseudorange-rate / Doppler-based positioning
- robust WLS
- VCE
- VarPro
- orbit-error compensation
- light-time modeling
- residual learning for orbit correction

## File naming
Rename papers as:
[year]_[first_author]_[short_title].pdf

## Logging rules
- Append new dated entries to `02_notes/DAILY_LOG.md`.
- Keep `INNOVATION_IDEAS.md` concise and non-redundant.
- Keep `CURRENT_TOPIC.md` concise and up to date.
- Keep `PAPER_INDEX.md` as a searchable paper catalog.

## Innovation rules
- Extract candidate innovation ideas from newly processed papers.
- Mark each idea as candidate / selected / discarded.
- Only selected ideas should move into theory derivation.

## Theory derivation rules
For selected ideas only, create a folder under `05_derivations/IDEA_xxx_short_name/` and include:
- `idea.md`
- `derivation.md`
- `experiment_plan.md`

Each derivation draft must include:
1. problem statement
2. assumptions
3. symbol definitions
4. mathematical model
5. objective function
6. derivation steps
7. observability / identifiability discussion
8. expected benefits
9. limitations
10. experiment suggestions

## Quality control
- Clearly separate paper-supported facts from proposed ideas.
- Do not present speculative derivations as established facts.
- Be conservative, structured, and concise.
