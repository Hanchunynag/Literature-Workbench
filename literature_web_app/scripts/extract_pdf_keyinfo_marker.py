#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import os
import re
from datetime import datetime
from pathlib import Path

import extract_pdf_keyinfo as base_extractor

os.environ.setdefault("CUDA_VISIBLE_DEVICES", "0")

try:
    from marker.config.parser import ConfigParser
    from marker.converters.pdf import PdfConverter
    from marker.models import create_model_dict
    from marker.output import text_from_rendered
except Exception as exc:  # pragma: no cover - import guard for optional dependency
    ConfigParser = None
    PdfConverter = None
    create_model_dict = None
    text_from_rendered = None
    IMPORT_ERROR = exc
else:
    IMPORT_ERROR = None


def infer_batch_id(pdf_path: Path) -> str:
    parent_name = pdf_path.parent.name.strip()
    return parent_name or "unbatched"


def get_markdown_output_dir(pdf_path: Path) -> Path:
    configured = os.environ.get("MARKER_MARKDOWN_DIR", "").strip()
    batch_id = infer_batch_id(pdf_path)
    if configured:
        return (Path(configured).expanduser().resolve() / batch_id).resolve()
    return (Path.cwd() / "data" / "papers" / "extracted_markdown" / batch_id).resolve()


def sanitize_markdown_name_part(value: str) -> str:
    cleaned = re.sub(r'[\\/:*?"<>|]+', "_", value)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    cleaned = cleaned.strip("._")
    return cleaned[:180] or "untitled"


def build_markdown_file_name(pdf_path: Path, year: str | int | None, title: str) -> str:
    year_text = str(year).strip() if year not in (None, "") else "unknown_year"
    safe_year = sanitize_markdown_name_part(year_text)
    safe_title = sanitize_markdown_name_part(title or pdf_path.stem)
    return f"{safe_year}_{safe_title}.md"


def save_markdown_output(pdf_path: Path, markdown: str, year: str | int | None, title: str) -> Path:
    output_dir = get_markdown_output_dir(pdf_path)
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / build_markdown_file_name(pdf_path, year, title)
    output_path.write_text(markdown, encoding="utf-8")
    return output_path


def extract_text_marker(pdf_path: Path) -> tuple[str, int, str]:
    if PdfConverter is None or ConfigParser is None or create_model_dict is None or text_from_rendered is None:
        raise RuntimeError(
            "marker-pdf 未安装，无法使用 Marker 解析 PDF。"
            " 请先执行: pip install marker-pdf"
        ) from IMPORT_ERROR

    config_parser = ConfigParser(
        {
            "output_format": "markdown",
            "disable_image_extraction": True,
        }
    )
    converter = PdfConverter(
        config=config_parser.generate_config_dict(),
        artifact_dict=create_model_dict(),
        processor_list=config_parser.get_processors(),
        renderer=config_parser.get_renderer(),
        llm_service=config_parser.get_llm_service(),
    )

    rendered = converter(str(pdf_path))
    markdown = getattr(rendered, "markdown", "") or ""
    text, _, _ = text_from_rendered(rendered)
    page_count = len(getattr(rendered, "metadata", []) or [])

    if page_count == 0:
        page_count = text.count("\f") + 1 if text else 0

    return base_extractor.normalize_text(text), page_count, markdown


def extract_pdf_keyinfo_with_marker(pdf_path: Path) -> dict:
    meta = base_extractor.read_metadata_pypdf(pdf_path)

    text, page_count, markdown = extract_text_marker(pdf_path)
    first_text = text[:6000]

    title = base_extractor.infer_title(meta.get("title", ""), first_text, pdf_path.stem)
    authors = base_extractor.infer_authors(meta.get("author", ""), first_text)
    year = base_extractor.infer_year(first_text, pdf_path.name)
    markdown_path = save_markdown_output(pdf_path, markdown, year, title)
    abstract = base_extractor.extract_abstract(text)
    introduction = base_extractor.extract_introduction_preview(text)
    conclusion = base_extractor.extract_conclusion_preview(text)
    keywords = base_extractor.extract_keywords_section(text)

    if not keywords:
        keywords = base_extractor.infer_keywords(text)

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
        "extractor": "marker",
        "markdownPath": str(markdown_path),
        "textCharCount": len(text),
        "updatedAt": datetime.now().isoformat(timespec="seconds"),
        "fullText": text,
        "previewText": text[:20000],
        "abstractText": abstract,
        "introductionPreview": introduction,
        "contributionExcerpt": "",
        "conclusionPreview": conclusion,
    }
    result["cleanSummary"] = base_extractor.build_clean_summary(result, abstract, introduction, conclusion)
    return result


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Extract key PDF info with Marker for server-side ingestion"
    )
    parser.add_argument("--pdf", required=True, help="Absolute path to PDF file")
    args = parser.parse_args()

    pdf_path = Path(args.pdf).resolve()
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    result = extract_pdf_keyinfo_with_marker(pdf_path)
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
