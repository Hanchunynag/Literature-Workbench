#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import re
from collections import Counter
from datetime import datetime
from pathlib import Path

from pypdf import PdfReader

try:
    import fitz  # type: ignore
except Exception:
    fitz = None


STOPWORDS = {
    "the", "and", "for", "with", "from", "that", "this", "into", "using", "based",
    "signal", "signals", "paper", "method", "methods", "results", "analysis",
    "navigation", "positioning", "system", "systems", "model", "models",
    "study", "approach", "approaches", "estimation", "algorithm", "algorithms",
    "satellite", "satellites", "gnss", "leo", "sop", "doppler", "range", "rate",
    "abstract", "introduction", "conclusion", "keywords", "index", "terms",
    "journal", "conference", "proposed", "based", "used", "use", "can", "also",
    "between", "within", "under", "over", "their", "there", "these", "those",
}

GENERIC_KEYWORD_STOPWORDS = {
    "which", "where", "while", "standard", "novel", "efficient", "implementation",
    "state", "states", "first", "second", "order", "high", "low", "common",
    "approach", "approaches", "problem", "problems", "process", "processes",
    "measurement", "measurements", "algorithm", "algorithms", "estimate",
    "estimates", "estimation", "filter", "filters", "extended", "nonlinear",
    "linear", "dynamic", "dynamical", "covariance", "posterior", "distribution",
    "numerical", "simulation", "simulations", "introduction", "conclusion",
    "work", "works", "propose", "proposed", "present", "presented", "based",
    "using", "used", "therefore", "however", "further", "new", "article",
    "study", "studies", "section", "sections",
}


def normalize_text(text: str) -> str:
    text = text.replace("\x00", " ")
    text = text.replace("ﬁ", "fi").replace("ﬂ", "fl").replace("ﬀ", "ff")
    text = text.replace("ﬃ", "ffi").replace("ﬄ", "ffl")
    text = text.replace("\r", "\n")
    text = re.sub(r"(\w)-\n(\w)", r"\1\2", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def looks_journal_metadata(value: str) -> bool:
    lowered = value.lower()
    hints = [
        "journal",
        "university",
        "vol",
        "volume",
        "doi",
        "issn",
        "学报",
        "第",
        "卷",
        "期",
    ]
    return sum(1 for hint in hints if hint in lowered) >= 2


def extract_text_pypdf(pdf_path: Path) -> tuple[str, int]:
    reader = PdfReader(str(pdf_path))
    texts: list[str] = []
    for page in reader.pages:
        try:
            texts.append(page.extract_text() or "")
        except Exception:
            texts.append("")
    return normalize_text("\n\n".join(texts)), len(reader.pages)


def extract_text_pymupdf(pdf_path: Path) -> tuple[str, int]:
    if fitz is None:
        return "", 0
    doc = fitz.open(str(pdf_path))
    texts: list[str] = []
    try:
        for page in doc:
            try:
                texts.append(page.get_text("text") or "")
            except Exception:
                texts.append("")
    finally:
        doc.close()
    return normalize_text("\n\n".join(texts)), len(texts)


def read_metadata_pypdf(pdf_path: Path) -> dict[str, str]:
    meta_out = {"title": "", "author": "", "subject": "", "creator": "", "producer": ""}
    try:
        reader = PdfReader(str(pdf_path))
        meta = reader.metadata or {}
        meta_out["title"] = str(meta.get("/Title", "") or "").strip()
        meta_out["author"] = str(meta.get("/Author", "") or "").strip()
        meta_out["subject"] = str(meta.get("/Subject", "") or "").strip()
        meta_out["creator"] = str(meta.get("/Creator", "") or "").strip()
        meta_out["producer"] = str(meta.get("/Producer", "") or "").strip()
    except Exception:
        pass
    return meta_out


def is_reasonable_meta_value(value: str | None) -> bool:
    if not value:
        return False
    value = value.strip()
    if len(value) < 4:
        return False
    return value.lower() not in {"untitled", "unknown", "none"}


def clean_author_candidates(items: list[str]) -> list[str]:
    cleaned: list[str] = []
    blocked_patterns = [
        r"^\s*(senior member|member|fellow)\s*,?\s*ieee\s*$",
        r"^\s*ieee\s*$",
        r"^\s*(senior member|member|fellow)\s*$",
        r"\b(university|department|laboratory|school|institute)\b",
    ]

    for item in items:
        candidate = normalize_text(item).strip(" ,;")
        if not candidate:
            continue
        lowered = candidate.lower()
        if any(re.search(pattern, lowered, re.I) for pattern in blocked_patterns):
            continue
        if len(candidate) > 80:
            continue
        cleaned.append(candidate)

    return list(dict.fromkeys(cleaned))[:12]


def infer_title(meta_title: str, first_text: str, fallback_stem: str) -> str:
    if is_reasonable_meta_value(meta_title) and not looks_journal_metadata(meta_title):
        return normalize_text(meta_title)

    lines = [normalize_text(line) for line in first_text.splitlines()]
    lines = [line for line in lines if line]

    focused_candidates: list[str] = []
    for line in lines[:80]:
        lowered = line.lower()
        if any(token in lowered for token in ("收稿", "录用", "引用", "doi", "abstract", "摘 要")):
            continue
        if looks_journal_metadata(line):
            continue
        if len(line) < 8 or len(line) > 120:
            continue
        if re.search(r"(定位|融合|估计|导航|signal|positioning|fusion|estimation)", line, re.I):
            focused_candidates.append(line)

    for candidate in focused_candidates:
        if len(candidate) > 12:
            return candidate

    candidates: list[tuple[int, str]] = []
    for idx, line in enumerate(lines[:40]):
        word_count = len(line.split())
        digit_ratio = sum(ch.isdigit() for ch in line) / max(len(line), 1)

        if len(line) < 12 or len(line) > 220:
            continue
        if word_count < 3 or word_count > 28:
            continue
        if digit_ratio > 0.20:
            continue
        if looks_journal_metadata(line):
            continue
        if re.match(r"^(abstract|keywords|index terms|introduction)\b", line, re.I):
            continue

        score = 100 - idx
        if 6 <= word_count <= 18:
            score += 10
        if line[:1].isupper():
            score += 5
        candidates.append((score, line))

    if candidates:
        candidates.sort(key=lambda x: x[0], reverse=True)
        return candidates[0][1]

    return fallback_stem.replace("_", " ")


def infer_year(text: str, pdf_name: str) -> str:
    compact = re.sub(r"\s+", "", text[:8000] + "\n" + pdf_name)
    matches = re.findall(r"(19\d{2}|20\d{2})", compact)
    years = [int(y) for y in matches if 1980 <= int(y) <= datetime.now().year + 1]
    if not years:
        return ""
    counts = Counter(years)
    return str(counts.most_common(1)[0][0])


def infer_authors(meta_author: str, first_text: str) -> list[str]:
    if is_reasonable_meta_value(meta_author) and meta_author.strip().lower() != "cnki":
        return clean_author_candidates(
            [item.strip() for item in re.split(r",|;| and ", meta_author) if item.strip()]
        )

    lines = [normalize_text(line) for line in first_text.splitlines()]
    lines = [line for line in lines if line]

    for line in lines[:25]:
        if len(line) > 180:
            continue
        if "@" in line:
            continue
        if re.search(r"\b(university|institute|department|laboratory|school)\b", line, re.I):
            continue
        if re.search(r"\b(abstract|keywords|index terms|introduction)\b", line, re.I):
            continue
        if re.search(r"[A-Z][a-z]+ [A-Z][a-z]+", line) and ("," in line or " and " in line.lower()):
            return clean_author_candidates(
                [item.strip() for item in re.split(r",| and ", line) if item.strip()]
            )
    return []


def infer_keywords(text: str, limit: int = 12) -> list[str]:
    tokens = re.findall(r"[A-Za-z][A-Za-z\-]{3,}", text.lower())
    counter: Counter[str] = Counter()
    for token in tokens:
        if token in STOPWORDS or token in GENERIC_KEYWORD_STOPWORDS:
            continue
        if len(token) < 4:
            continue
        counter[token] += 1
    return [word for word, _ in counter.most_common(limit)]


def split_lines(text: str) -> list[str]:
    lines = [normalize_text(x) for x in text.splitlines()]
    return [x for x in lines if x]


def normalize_heading_for_match(line: str) -> str:
    line = normalize_text(line).lower()
    line = re.sub(r"^\d+(?:\.\d+)*[\.\)]?\s*", "", line)
    line = re.sub(r"^[ivxlcdm]+[\.\)]\s*", "", line)
    line = re.sub(r"[^a-z0-9\u4e00-\u9fa5]+", "", line)
    return line


def heading_starts_with(line: str, markers: list[str]) -> bool:
    normalized = normalize_heading_for_match(line)
    return any(normalized.startswith(marker) for marker in markers if marker)


def looks_formula_like(line: str) -> bool:
    if not line:
        return True
    if len(line) <= 3:
        return True
    tokens = line.split()
    short_tokens = sum(1 for t in tokens if len(t) <= 2)
    if tokens and short_tokens / len(tokens) > 0.6:
        return True
    math_chars = re.findall(r"[=+\-*/^_<>∑√λμσδΩωαβγπτ→←∂]", line)
    if len(math_chars) >= max(3, len(line) // 8):
        return True
    if re.fullmatch(r"[\d\W_]+", line):
        return True
    return False


def extract_section_by_heading(
    text: str,
    start_markers: list[str],
    end_markers: list[str],
    max_chars: int = 4000,
) -> str:
    lines = text.splitlines()

    start_line = -1
    for index, line in enumerate(lines):
      if heading_starts_with(line, start_markers):
        start_line = index
        break

    if start_line == -1:
        return ""

    end_line = len(lines)
    for index in range(start_line + 1, len(lines)):
        if heading_starts_with(lines[index], end_markers):
            end_line = index
            break

    section = "\n".join(lines[start_line:end_line])
    return normalize_text(section[:max_chars])


def clean_paragraph_text(text: str, max_lines: int = 80) -> str:
    lines = split_lines(text)
    kept: list[str] = []

    for line in lines:
        if looks_formula_like(line):
            continue
        if re.match(r"^(fig\.?|figure|table)\s+\d+", line, re.I):
            continue
        if re.match(r"^\[\d+\]$", line):
            continue
        kept.append(line)

    kept = kept[:max_lines]
    out = "\n".join(kept)
    out = re.sub(r"\n{3,}", "\n\n", out)
    return out.strip()


def extract_abstract(text: str) -> str:
    abstract = extract_section_by_heading(
        text,
        start_markers=["abstract", "摘要"],
        end_markers=["keywords", "indexterms", "introduction", "引言", "conclusion", "conclusions", "结论"],
        max_chars=3500,
    )
    return clean_paragraph_text(abstract, max_lines=40)


def extract_introduction_preview(text: str) -> str:
    introduction = extract_section_by_heading(
        text,
        start_markers=["introduction", "引言"],
        end_markers=[
            "relatedwork",
            "background",
            "preliminaries",
            "systemmodel",
            "problemformulation",
            "method",
            "methods",
            "proposedmethod",
            "approach",
            "algorithm",
            "experiment",
            "experiments",
            "results",
            "discussion",
            "conclusion",
            "conclusions",
            "结论",
        ],
        max_chars=3500,
    )
    return clean_paragraph_text(introduction, max_lines=35)


def extract_keywords_section(text: str) -> list[str]:
    section = extract_section_by_heading(
        text,
        start_markers=["keywords", "indexterms", "indexterm", "关键词"],
        end_markers=["introduction", "引言", "conclusion", "conclusions", "结论"],
        max_chars=1200,
    )

    cleaned = normalize_text(section)
    if not cleaned:
        return []

    cleaned = re.sub(
        r'^[“"「『【\[]?\s*(keywords|index terms|indexterms|index term|关键词)\s*[”"」』】\]]?\s*[:：\-—]?\s*',
        "",
        cleaned,
        flags=re.I,
    )
    parts = re.split(r"[;,；，\n]+", cleaned)
    keywords: list[str] = []

    for part in parts:
        item = normalize_text(part)
        if len(item) < 2:
            continue
        if len(item) > 80:
            continue
        lowered = item.lower()
        if lowered in STOPWORDS or lowered in GENERIC_KEYWORD_STOPWORDS:
            continue
        keywords.append(item)

    return list(dict.fromkeys(keywords))[:12]


def extract_conclusion_preview(text: str) -> str:
    conclusion = extract_section_by_heading(
        text,
        start_markers=["conclusion", "conclusions", "结论"],
        end_markers=["references", "acknowledg", "appendix"],
        max_chars=3500,
    )
    return clean_paragraph_text(conclusion, max_lines=35)


def build_clean_summary(result: dict, abstract: str, introduction: str, conclusion: str) -> str:
    parts = [
        "## Basic Info",
        f"- title: {result['title'] or 'UNKNOWN'}",
        f"- authors: {', '.join(result['authors']) if result['authors'] else 'UNKNOWN'}",
        f"- year: {result['year'] or 'UNKNOWN'}",
        f"- extractor: {result['extractor']}",
        f"- extract_status: {result['extractStatus']}",
        f"- keywords_candidate: {', '.join(result['keywordsCandidate']) if result['keywordsCandidate'] else 'NONE'}",
        "",
        "## Abstract",
        abstract or "NOT_FOUND",
        "",
        "## Introduction Preview",
        introduction or "NOT_FOUND",
        "",
        "## Conclusion Preview",
        conclusion or "NOT_FOUND",
    ]
    return "\n".join(parts)


def extract_pdf_keyinfo(pdf_path: Path) -> dict:
    meta = read_metadata_pypdf(pdf_path)

    text_pypdf, pages_pypdf = extract_text_pypdf(pdf_path)
    text = text_pypdf
    page_count = pages_pypdf
    extractor = "pypdf"

    if len(text_pypdf) < 800 and fitz is not None:
        text_fitz, pages_fitz = extract_text_pymupdf(pdf_path)
        if len(text_fitz) > len(text_pypdf):
            text = text_fitz
            page_count = pages_fitz
            extractor = "pymupdf"

    first_text = text[:6000]
    title = infer_title(meta.get("title", ""), first_text, pdf_path.stem)
    authors = infer_authors(meta.get("author", ""), first_text)
    year = infer_year(first_text, pdf_path.name)
    abstract = extract_abstract(text)
    introduction = extract_introduction_preview(text)
    conclusion = extract_conclusion_preview(text)
    keywords = extract_keywords_section(text)

    if len(text) == 0:
        extract_status = "no_text"
    elif len(text) < 1200:
        extract_status = "low_text"
    else:
        extract_status = "ok"

    result = {
        "sourcePdf": str(pdf_path),
        "fileStem": pdf_path.stem,
        "pageCount": page_count,
        "title": title,
        "authors": authors,
        "year": year,
        "keywordsCandidate": keywords,
        "extractStatus": extract_status,
        "extractor": extractor,
        "textCharCount": len(text),
        "updatedAt": datetime.now().isoformat(timespec="seconds"),
        "fullText": text,
        "previewText": text[:20000],
        "abstractText": abstract,
        "introductionPreview": introduction,
        "contributionExcerpt": "",
        "conclusionPreview": conclusion,
    }
    result["cleanSummary"] = build_clean_summary(result, abstract, introduction, conclusion)
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract key PDF info for web app ingestion")
    parser.add_argument("--pdf", required=True, help="Absolute path to PDF file")
    args = parser.parse_args()

    pdf_path = Path(args.pdf).resolve()
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    result = extract_pdf_keyinfo(pdf_path)
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
