import type { ClassificationOutput } from "@/lib/agents/classifier-agent";
import type { SummaryOutput } from "@/lib/agents/summarizer-agent";

function includesAny(source: string, patterns: string[]) {
  return patterns.some((pattern) => source.includes(pattern));
}

function unique(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)));
}

export function buildFallbackClassification(input: {
  batchId: string;
  fileId: string;
  title: string;
  extractedText: string;
}): ClassificationOutput {
  const corpus = `${input.title}\n${input.extractedText}`.toLowerCase();

  let primaryCategory: ClassificationOutput["primaryCategory"] = "待人工确认";

  if (includesAny(corpus, ["doppler", "pseudorange", "positioning", "定位"])) {
    primaryCategory = "定位方法";
  } else if (includesAny(corpus, ["ephemeris", "orbit", "timing error", "星历", "轨道误差"])) {
    primaryCategory = "轨道与星历误差建模";
  } else if (includesAny(corpus, ["robust", "wls", "weighted", "huber", "加权"])) {
    primaryCategory = "鲁棒估计与加权方法";
  } else if (includesAny(corpus, ["fusion", "multi-leo", "constellation", "orbcomm", "iridium"])) {
    primaryCategory = "多星座融合与观测建模";
  } else if (includesAny(corpus, ["simulation", "experiment", "仿真", "实验"])) {
    primaryCategory = "仿真与实验分析";
  } else if (includesAny(corpus, ["signal", "acquisition", "capture", "信号捕获"])) {
    primaryCategory = "信号捕获与处理";
  } else if (includesAny(corpus, ["survey", "review", "overview", "综述"])) {
    primaryCategory = "综述与领域概览";
  }

  const tags = unique([
    corpus.includes("iridium") ? "Iridium" : "",
    corpus.includes("orbcomm") ? "Orbcomm" : "",
    corpus.includes("doppler") ? "Doppler" : "",
    corpus.includes("pseudorange") ? "pseudorange" : "",
    corpus.includes("leo") ? "LEO SOP" : "",
    corpus.includes("gnss denied") || corpus.includes("gnss-denied") ? "GNSS denied" : "",
    corpus.includes("robust") ? "robust" : "",
    corpus.includes("orbit") ? "orbit error" : ""
  ]);

  const keywords = unique([
    ...tags,
    primaryCategory,
    corpus.includes("ukf") ? "UKF" : "",
    corpus.includes("wls") ? "WLS" : ""
  ]).slice(0, 8);

  const subcategories = unique([
    tags.includes("LEO SOP") ? "LEO SOP" : "",
    tags.includes("Doppler") ? "Doppler positioning" : "",
    tags.includes("pseudorange") ? "pseudorange positioning" : "",
    tags.includes("Iridium") ? "Iridium" : "",
    tags.includes("Orbcomm") ? "Orbcomm" : ""
  ]).slice(0, 6);

  const needsReview = primaryCategory === "待人工确认";

  return {
    batchId: input.batchId,
    fileId: input.fileId,
    primaryCategory,
    subcategories,
    tags,
    keywords,
    confidence: needsReview ? 0.42 : 0.68,
    needsReview
  };
}

export function buildFallbackSummary(input: {
  batchId: string;
  fileId: string;
  title: string;
  extractedText: string;
  classification: ClassificationOutput;
}): SummaryOutput {
  const snippet = input.extractedText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 30)
    .slice(0, 3)
    .join(" ");

  const baseSummary =
    snippet ||
    "提取文本较少，当前总结来自标题和关键词的本地规则兜底，建议后续在网络稳定时重新处理。";

  return {
    batchId: input.batchId,
    fileId: input.fileId,
    shortSummary: baseSummary.slice(0, 240),
    coreContribution: `本地兜底判断该论文主要属于“${input.classification.primaryCategory}”，建议后续用 agent 复核更细粒度结论。`,
    relevanceNote: "当前总结由本地规则生成，可用于先浏览和占位展示，精细分析建议后续重跑。",
    innovationNote: "由于外部模型调用失败，创新性判断暂时保守处理。",
    whatThisPaperDoes: [
      "基于标题与提取文本生成初步结构化摘要。",
      "为文献库和详情页提供可展示的兜底内容。"
    ],
    claimedInnovations: ["外部模型不可用时，先返回可展示的本地结构化结果。"],
    usefulToMyTopic: [
      "能让上传后的论文先进入可浏览状态。",
      "便于后续再发起重新处理，用 agent 细化内容。"
    ],
    limitations: [
      "当前结果来自本地规则，不等同于正式的模型分析。",
      "摘要与分类准确度受限于提取文本质量和规则覆盖范围。"
    ],
    candidateIdeas: [
      "candidate: 在网络恢复后重新调用 agent，并保留本地 fallback 作为容灾链路。"
    ]
  };
}
