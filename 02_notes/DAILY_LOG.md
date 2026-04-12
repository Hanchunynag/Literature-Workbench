# DAILY LOG

## 2026-04-12
- 扫描 `00_inbox/`，识别到 4 篇新增 PDF，均未在现有索引中登记。
- 新增本地提取脚本 `scripts/extract_paper_summaries.py`，为每篇论文生成 `00_extracted/<paper>/metadata.json` 与 `clean_summary.md`。
- 完成入库与重命名：
  - `2019_Tan_iridium_weak_signal_positioning.pdf` -> `01_library/信号捕获与处理/`
  - `2022_Qin_iridium_orbcomm_fusion_positioning.pdf` -> `01_library/多星座融合与观测建模/`
  - `2023_Wang_doppler_aided_fused_leo_positioning.pdf` -> `01_library/定位方法/`
  - `2025_Lei_robust_hvce_dual_constellation_sop.pdf` -> `01_library/鲁棒估计与加权方法/`
- 本批未发现必须移入 `01_library/待人工确认/` 的论文；其中 2023 年 WLS 论文与“LEO 导航增强系统”场景更接近，后续阅读时需持续关注其与纯 SOP 场景的可迁移性。
- 已更新 `02_notes/PAPER_INDEX.md`、`03_metadata/papers_index.csv`、`02_notes/INNOVATION_IDEAS.md`、`02_notes/CURRENT_TOPIC.md`。
