import { readFile } from "fs/promises";

import pdfParse from "pdf-parse";

import { extractPdfKeyInfoWithPython } from "@/lib/pipeline/python-pdf-extractor";
import { saveExtractedArtifact } from "@/lib/storage/file-store";
import { normalizeExtractedText } from "@/lib/pipeline/normalize-text";
import type { PaperRecord } from "@/lib/types/paper";

function deriveYear(source: string) {
  const match = source.match(/\b(19|20)\d{2}\b/);
  return match ? Number(match[0]) : null;
}

function deriveTitle(fileName: string, extractedText: string, metadataTitle?: unknown) {
  const cleanMetadataTitle =
    typeof metadataTitle === "string" ? metadataTitle.trim() : undefined;

  if (cleanMetadataTitle && cleanMetadataTitle.toLowerCase() !== "microsoft word -") {
    return cleanMetadataTitle;
  }

  const firstMeaningfulLine = extractedText
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 20);

  if (firstMeaningfulLine) {
    return firstMeaningfulLine;
  }

  return fileName.replace(/\.pdf$/i, "");
}

function deriveAuthors(rawAuthor?: unknown) {
  if (typeof rawAuthor !== "string" || !rawAuthor) {
    return [];
  }

  return rawAuthor
    .split(/[,;]+/)
    .map((item) => item.trim())
    .filter(
      (item) =>
        item.length > 0 &&
        !/^(senior member|member|fellow)\s*,?\s*ieee$/i.test(item) &&
        !/^(senior member|member|fellow)$/i.test(item) &&
        !/^ieee$/i.test(item)
    )
    .filter(Boolean)
    .slice(0, 8);
}

function extractSectionSnippet(text: string, headingPatterns: RegExp[], fallbackPatterns: RegExp[] = []) {
  const normalized = normalizeExtractedText(text);
  const sections = normalized.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);

  for (let index = 0; index < sections.length; index += 1) {
    const section = sections[index];
    const firstLine = section.split("\n")[0] ?? section;

    if (!headingPatterns.some((pattern) => pattern.test(firstLine))) {
      continue;
    }

    return normalizeExtractedText(sections.slice(index, index + 2).join("\n\n")).slice(0, 1800);
  }

  for (const section of sections.slice(0, 12)) {
    if (fallbackPatterns.some((pattern) => pattern.test(section))) {
      return normalizeExtractedText(section).slice(0, 1800);
    }
  }

  return "";
}

export async function extractPaper(paper: PaperRecord) {
  try {
    const pythonResult = await extractPdfKeyInfoWithPython(paper.filePath);
    const extractedText = normalizeExtractedText(pythonResult.fullText ?? "");

    const result = {
      title: pythonResult.title || deriveTitle(paper.originalFileName, extractedText),
      year: pythonResult.year ? Number(pythonResult.year) || null : null,
      authors: pythonResult.authors ?? [],
      markdownPath: pythonResult.markdownPath ?? null,
      extractedText,
      abstractText: normalizeExtractedText(pythonResult.abstractText ?? ""),
      introductionPreview: normalizeExtractedText(pythonResult.introductionPreview ?? ""),
      contributionExcerpt: "",
      conclusionPreview: normalizeExtractedText(pythonResult.conclusionPreview ?? ""),
      keywordsCandidate: pythonResult.keywordsCandidate ?? [],
      cleanSummary: normalizeExtractedText(pythonResult.cleanSummary ?? ""),
      extractionStatus: pythonResult.extractStatus ?? "ok",
      extractor: pythonResult.extractor ?? "python",
      pageCount: pythonResult.pageCount ?? null,
      info: {
        extractor: pythonResult.extractor ?? "python",
        extractStatus: pythonResult.extractStatus ?? "ok",
        keywordsCandidate: pythonResult.keywordsCandidate ?? []
      }
    };

    await saveExtractedArtifact(paper.id, result);
    return result;
  } catch (error) {
    console.info(
      "extractPaper python extractor unavailable, falling back to pdf-parse:",
      error instanceof Error ? error.message : "unknown error"
    );
  }

  const buffer = await readFile(paper.filePath);
  const parsed = await pdfParse(buffer);
  const extractedText = normalizeExtractedText(parsed.text ?? "");

  const result = {
    title: deriveTitle(paper.originalFileName, extractedText, parsed.info?.Title),
    year: deriveYear(String(parsed.info?.CreationDate ?? paper.originalFileName)),
    authors: deriveAuthors(parsed.info?.Author),
    markdownPath: null,
    extractedText,
    abstractText: extractSectionSnippet(
      extractedText,
      [/^(abstract|摘\s*要|【?摘要】?|“?摘要”?|「?摘要」?)/i],
      [/abstract/i, /摘\s*要/, /【?摘要】?/, /“?摘要”?/, /「?摘要」?/]
    ),
    introductionPreview: extractSectionSnippet(
      extractedText,
      [/^(introduction|引\s*言|绪论|【?引言】?|“?引言”?|「?引言」?)/i],
      [/introduction/i, /引\s*言/, /绪论/, /【?引言】?/, /“?引言”?/, /「?引言」?/]
    ),
    contributionExcerpt: "",
    conclusionPreview: extractSectionSnippet(
      extractedText,
      [/^(conclusion|conclusions|结\s*论|【?结论】?|“?结论”?|「?结论」?)/i],
      [/conclusion/i, /结\s*论/, /【?结论】?/, /“?结论”?/, /「?结论」?/]
    ),
    keywordsCandidate: [],
    cleanSummary: "",
    extractionStatus: extractedText.length > 1200 ? "ok" : "low_text",
    extractor: "pdf-parse",
    pageCount: parsed.numpages ?? null,
    info: parsed.info ?? {}
  };

  await saveExtractedArtifact(paper.id, result);

  return result;
}
