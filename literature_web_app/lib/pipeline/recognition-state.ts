import type { PaperRecognitionState } from "@/lib/types/paper";

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function countWords(value: string) {
  return normalizeWhitespace(value).split(" ").filter(Boolean).length;
}

function looksLikeBrokenTitle(title: string) {
  const normalized = normalizeWhitespace(title).toLowerCase();
  const condensed = normalized.replace(/\s+/g, "");

  return (
    normalized.length < 12 ||
    condensed.includes("journalof") ||
    condensed.includes("cnki") ||
    condensed.includes("kcms/detail") ||
    condensed.includes(".html") ||
    condensed.includes("http") ||
    (countWords(normalized) <= 2 && normalized.length >= 32)
  );
}

function looksLikeFallbackSummary(summary: string) {
  const normalized = normalizeWhitespace(summary);

  return (
    !normalized ||
    normalized.includes("本地规则") ||
    normalized.includes("本地兜底") ||
    normalized.includes("后续用 agent 复核") ||
    normalized.includes("外部模型调用失败")
  );
}

export function deriveRecognitionState(input: {
  title: string;
  extractedText: string;
  shortSummary: string;
  usedAgent: boolean;
}): { recognitionState: PaperRecognitionState; recognitionNote: string | null } {
  const title = normalizeWhitespace(input.title);
  const extractedText = normalizeWhitespace(input.extractedText);
  const shortSummary = normalizeWhitespace(input.shortSummary);

  if (looksLikeBrokenTitle(title) || extractedText.length < 600) {
    return {
      recognitionState: "needs_review",
      recognitionNote: "提取结果质量较弱，建议继续在后台重跑识别。"
    };
  }

  if (!input.usedAgent || looksLikeFallbackSummary(shortSummary)) {
    return {
      recognitionState: "local_only",
      recognitionNote: "当前结果主要来自本地提取或 fallback，建议继续补跑 agent。"
    };
  }

  return {
    recognitionState: "recognized",
    recognitionNote: "已完成 agent 识别。"
  };
}
