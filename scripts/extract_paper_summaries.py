#!/usr/bin/env python3

from __future__ import annotations

import json
import re
from pathlib import Path

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
INBOX_DIR = ROOT / "00_inbox"
EXTRACTED_DIR = ROOT / "00_extracted"


def slugify(name: str) -> str:
    cleaned = re.sub(r"[^\w\u4e00-\u9fff-]+", "_", name, flags=re.UNICODE)
    cleaned = re.sub(r"_+", "_", cleaned).strip("_")
    return cleaned or "paper"


def compact_text(text: str) -> str:
    text = text.replace("\x00", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def infer_year(text: str, metadata: dict) -> str:
    match_202x = re.search(r"20\s?([0-9]{2})\s*年", text[:2500])
    if match_202x:
        return f"20{match_202x.group(1)}"

    meta_year = ""
    for key in ("/CreationDate", "/ModDate"):
        value = metadata.get(key)
        if value:
            match = re.search(r"(19|20)\d{2}", str(value))
            if match:
                meta_year = match.group(0)
                break
    if meta_year:
        return meta_year

    match = re.search(r"(19|20)\d{2}", text[:3000])
    return match.group(0) if match else ""


def infer_title(pdf_path: Path, metadata: dict, text: str) -> str:
    if pdf_path.stem.startswith("Iridium_ORBCOMM"):
        return "Iridium/ORBCOMM机会信号融合定位技术"

    meta_title = (metadata.get("/Title") or "").strip()
    if meta_title:
        return meta_title

    lines = [line.strip() for line in text.splitlines() if line.strip()]
    candidates = []
    for line in lines[:40]:
        if len(line) < 8:
            continue
        if any(token in line.lower() for token in ("abstract", "received", "accepted", "published", "citation")):
            continue
        if re.search(r"[A-Za-z\u4e00-\u9fff]", line):
            candidates.append(line)

    for line in candidates:
        if "机会信号融合定位技术" in line:
            return "Iridium/ORBCOMM机会信号融合定位技术"
        if len(line) > 20:
            return re.sub(r"\s+", " ", line).strip()

    return pdf_path.stem


def infer_authors(pdf_path: Path, metadata: dict, text: str) -> list[str]:
    meta_author = (metadata.get("/Author") or "").strip()
    if meta_author and meta_author.lower() != "cnki":
        parts = re.split(r",|;| and ", meta_author)
        return [p.strip() for p in parts if p.strip()]

    if pdf_path.stem.startswith("Iridium_ORBCOMM"):
        return ["秦红磊", "李志强", "赵超"]

    match = re.search(r"\n([A-Z][A-Za-z .,*-]+)\nSchool of", text)
    if match:
        names = re.split(r",| and ", match.group(1).replace("*", ""))
        return [n.strip() for n in names if n.strip()]

    return []


def infer_keywords(text: str) -> list[str]:
    if "Irid ium / OＲ B COM M" in text or "Iridium / OＲ B COM M" in text or "机会信号融合定位技术" in text:
        return ["机会信号", "Iridium", "ORBCOMM", "融合定位", "Helmert"]

    patterns = [
        r"Keywords:\s*(.+)",
        r"关 键 词\s*[:：]\s*(.+)",
        r"关键词\s*[:：]\s*(.+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            raw = match.group(1).strip()
            raw = raw.split("\n")[0]
            parts = re.split(r"[;,；，]", raw)
            return [p.strip(" .:") for p in parts if p.strip(" .:")]
    return []


def infer_topic(text: str) -> str:
    lowered = text.lower()
    if "dual-constellation" in lowered and "hvce" in lowered:
        return "双星座LEO机会信号鲁棒HVCE加权定位"
    if "weak signal" in lowered or "doppler estimation" in lowered:
        return "Iridium弱信号环境下的瞬时多普勒估计与定位"
    if "doppler-aided positioning" in lowered:
        return "融合LEO导航系统中的伪距-多普勒联合定位"
    if "orbcomm" in lowered and "iridium" in lowered:
        return "Iridium与ORBCOMM机会信号融合定位"
    if "机会信号融合定位技术" in text:
        return "Iridium与ORBCOMM机会信号融合定位"
    return "待人工确认"


def extraction_quality(text: str) -> str:
    sample = text[:5000]
    ascii_letters = sum(ch.isalpha() for ch in sample)
    weird_tokens = sample.count("/gid")
    if weird_tokens > 20 or ascii_letters < 200:
        return "medium"
    return "high"


def build_summary(metadata: dict, text: str) -> str:
    lines = []
    lines.append(f"# {metadata['title']}")
    lines.append("")
    lines.append("## Basic info")
    lines.append(f"- year: {metadata['year'] or 'unknown'}")
    lines.append(f"- authors: {', '.join(metadata['authors']) if metadata['authors'] else 'unknown'}")
    lines.append(f"- keywords: {', '.join(metadata['keywords']) if metadata['keywords'] else 'unknown'}")
    lines.append(f"- rough_topic: {metadata['rough_topic']}")
    lines.append(f"- extraction_quality: {metadata['extraction_quality']}")
    lines.append("")
    lines.append("## Clean summary")

    summary_points = []
    lowered = text.lower()
    if "hvce" in lowered or "helmert variance component estimation" in lowered:
        summary_points.extend(
            [
                "面向 GNSS 拒止环境下的双星座 LEO SOP 定位。",
                "将先验高程加权、特征斜率筛选、HVCE 与 IGG-III 鲁棒估计结合。",
                "重点在异构观测动态赋权与异常值抑制，属于鲁棒加权建模方向。",
            ]
        )
    elif "weak signal" in lowered:
        summary_points.extend(
            [
                "聚焦弱信号/遮挡环境下的 Iridium 机会信号定位。",
                "提出 QSA-IDE 瞬时多普勒估计算法，目标是提升弱信号多普勒提取能力。",
                "论文重点更偏向信号处理与观测提取，而非多星座融合。",
            ]
        )
    elif "doppler-aided positioning" in lowered:
        summary_points.extend(
            [
                "研究融合 LEO 导航系统中伪距不足时的多普勒辅助定位。",
                "采用加权最小二乘联合伪距与多普勒，提升可用性与定位精度。",
                "场景更接近 LEO 导航增强系统，而非纯 SOP 实测处理。",
            ]
        )
    elif "orbcomm" in lowered and "iridium" in lowered or "机会信号融合定位技术" in text:
        summary_points.extend(
            [
                "讨论 Iridium 与 ORBCOMM 双星座机会信号融合定位。",
                "核心观测为瞬时多普勒，建立直接融合与 Helmert 方差估计加权模型。",
                "文中实验给出优于 70 m 的定位结果，强调双星座互补带来的几何改进。",
            ]
        )
    else:
        summary_points.append("自动提取结果不足，需人工复核。")

    for point in summary_points:
        lines.append(f"- {point}")

    lines.append("")
    lines.append("## Evidence snippet")
    snippet = compact_text(text)[:1800]
    lines.append(snippet or "No extractable text.")
    lines.append("")
    lines.append("## Notes")
    lines.append("- 本摘要只基于 PDF 可提取文字，不依赖 `full_text.txt` 重建公式。")
    return "\n".join(lines)


def extract_pdf(pdf_path: Path) -> None:
    reader = PdfReader(str(pdf_path))
    metadata = reader.metadata or {}
    page_texts = []
    for page in reader.pages[:3]:
        try:
            page_texts.append(page.extract_text() or "")
        except Exception as exc:
            page_texts.append(f"[extract_error] {exc}")
    text = compact_text("\n\n".join(page_texts))

    meta = {
        "source_pdf": str(pdf_path.resolve().relative_to(ROOT)),
        "title": infer_title(pdf_path, metadata, text),
        "year": infer_year(text, metadata),
        "authors": infer_authors(pdf_path, metadata, text),
        "keywords": infer_keywords(text),
        "rough_topic": infer_topic(text),
        "extraction_quality": extraction_quality(text),
        "page_count": len(reader.pages),
    }

    out_dir = EXTRACTED_DIR / slugify(pdf_path.stem)
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "metadata.json").write_text(
        json.dumps(meta, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    (out_dir / "clean_summary.md").write_text(build_summary(meta, text), encoding="utf-8")


def main() -> None:
    EXTRACTED_DIR.mkdir(parents=True, exist_ok=True)
    pdfs = sorted(INBOX_DIR.glob("*.pdf"))
    for pdf in pdfs:
        out_dir = EXTRACTED_DIR / slugify(pdf.stem)
        if (out_dir / "metadata.json").exists() and (out_dir / "clean_summary.md").exists():
            continue
        extract_pdf(pdf)
        print(f"extracted: {pdf.name}")


if __name__ == "__main__":
    main()
