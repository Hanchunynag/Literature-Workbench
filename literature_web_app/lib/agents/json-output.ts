import { z } from "zod";

function extractJsonCandidate(rawOutput: string) {
  const fencedMatch = rawOutput.match(/```json\s*([\s\S]*?)```/i);

  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const start = rawOutput.indexOf("{");
  const end = rawOutput.lastIndexOf("}");

  if (start >= 0 && end > start) {
    return rawOutput.slice(start, end + 1).trim();
  }

  return rawOutput.trim();
}

function coerceStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(/\n|;|；|,|，|•|- /)
    .map((item) => item.trim())
    .filter(Boolean);
}

function coerceSingleString(value: unknown) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean)
      .join(" ");
  }

  if (value == null) {
    return undefined;
  }

  return String(value).trim();
}

function normalizeStructuredPayload(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return payload;
  }

  const record = { ...(payload as Record<string, unknown>) };
  const stringFields = [
    "batchId",
    "fileId",
    "title",
    "researchQuestion",
    "coreMethod",
    "shortSummary",
    "coreContribution",
    "relevanceNote",
    "innovationNote",
    "experimentalMethodology"
  ];
  const arrayFields = [
    "subcategories",
    "tags",
    "keywords",
    "whatThisPaperDoes",
    "claimedInnovations",
    "usefulToMyTopic",
    "limitations",
    "candidateIdeas",
    "performanceMetrics"
  ];
  const arrayLimits: Record<string, number> = {
    subcategories: 3,
    tags: 6,
    keywords: 6,
    whatThisPaperDoes: 6,
    claimedInnovations: 5,
    usefulToMyTopic: 5,
    limitations: 5,
    candidateIdeas: 5,
    performanceMetrics: 5
  };

  for (const field of stringFields) {
    if (field in record) {
      record[field] = coerceSingleString(record[field]);
    }
  }

  for (const field of arrayFields) {
    if (field in record) {
      record[field] = coerceStringArray(record[field]).slice(0, arrayLimits[field]);
    }
  }

  if (!("candidateIdeas" in record)) {
    record.candidateIdeas = [];
  }

  return record;
}

export function parseStructuredAgentJson<TSchema extends z.ZodTypeAny>(
  rawOutput: string,
  schema: TSchema,
  label: string,
  refs?: { batchId: string; fileId: string }
) {
  const jsonCandidate = extractJsonCandidate(rawOutput);

  try {
    const parsed = schema.parse(normalizeStructuredPayload(JSON.parse(jsonCandidate)));

    if (refs && parsed && typeof parsed === "object") {
      const record = parsed as Record<string, unknown>;

      if (record.batchId !== refs.batchId || record.fileId !== refs.fileId) {
        throw new Error(
          `${label} 的 batchId/fileId 不匹配，期望 ${refs.batchId}/${refs.fileId}，实际 ${String(
            record.batchId
          )}/${String(record.fileId)}`
        );
      }
    }

    return parsed;
  } catch (error) {
    throw new Error(`${label} JSON 解析失败: ${error instanceof Error ? error.message : "unknown error"}`);
  }
}
