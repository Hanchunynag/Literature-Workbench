import type { ClassificationOutput } from "@/lib/agents/classifier-agent";
import { SUBCATEGORY_CANDIDATES } from "@/lib/agents/prompts";
import type { PaperAnalysisOutput } from "@/lib/agents/summarizer-agent";

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

  if (includesAny(corpus, ["survey", "review", "overview", "tutorial", "综述"])) {
    primaryCategory = "综述与领域概览";
  } else if (includesAny(corpus, ["imu", "inertial", "fusion", "map", "kinematic", "constraint", "融合"])) {
    primaryCategory = "融合定位与多源约束";
  } else if (includesAny(corpus, ["ephemeris", "orbit", "tle", "星历", "轨道误差"])) {
    primaryCategory = "轨道与星历误差修正";
  } else if (includesAny(corpus, ["clock", "bias", "timing", "frequency offset", "钟差", "频偏", "同步"])) {
    primaryCategory = "时间同步与硬件偏差";
  } else if (includesAny(corpus, ["weak signal", "nlos", "multipath", "acquisition", "tracking", "capture", "弱信号", "遮挡", "多路径"])) {
    primaryCategory = "弱信号与复杂传播环境";
  } else if (includesAny(corpus, ["dataset", "benchmark", "field test", "simulation", "experiment", "仿真", "实验"])) {
    primaryCategory = "实验评估与数据集";
  } else if (includesAny(corpus, ["doppler", "fdoa", "doa", "aoa", "toa", "tdoa", "pseudorange", "carrier phase", "positioning", "定位"])) {
    primaryCategory = "定位方法创新";
  }

  const tags = unique([
    corpus.includes("iridium") ? "Iridium" : "",
    corpus.includes("orbcomm") ? "Orbcomm" : "",
    corpus.includes("doppler") ? "Doppler" : "",
    corpus.includes("pseudorange") ? "pseudorange" : "",
    corpus.includes("leo") ? "LEO SOP" : "",
    corpus.includes("gnss denied") || corpus.includes("gnss-denied") ? "GNSS denied" : "",
    corpus.includes("imu") ? "IMU" : "",
    corpus.includes("orbit") ? "orbit error" : "",
    corpus.includes("clock") || corpus.includes("频偏") ? "timing bias" : ""
  ]).slice(0, 6);

  const keywords = unique([
    ...tags,
    primaryCategory,
    corpus.includes("ukf") ? "UKF" : "",
    corpus.includes("wls") ? "WLS" : ""
  ]).slice(0, 6);

  const subcategories = unique(
    [
      includesAny(corpus, ["toa", "tdoa"]) ? "TOA/TDOA" : "",
      includesAny(corpus, ["doa", "aoa"]) ? "DOA/AOA" : "",
      includesAny(corpus, ["doppler", "fdoa"]) ? "Doppler/FDOA" : "",
      includesAny(corpus, ["pseudorange", "carrier phase", "载波相位"]) ? "伪距/载波相位" : "",
      includesAny(corpus, ["pvt", "observation model", "观测模型"]) ? "PVT求解与观测建模" : "",
      includesAny(corpus, ["orbit", "轨道误差"]) ? "轨道误差补偿" : "",
      includesAny(corpus, ["ephemeris", "tle", "星历"]) ? "星历增强/TLE修正" : "",
      includesAny(corpus, ["clock", "frequency offset", "timing", "钟差", "频偏", "同步"]) ? "钟差/频偏/时间同步" : "",
      includesAny(corpus, ["hardware", "antenna", "硬件", "相位中心"]) ? "天线相位中心与硬件偏差" : "",
      includesAny(corpus, ["weak signal", "detection", "积累", "弱信号"]) ? "弱信号积累与检测" : "",
      includesAny(corpus, ["multipath", "nlos", "遮挡", "多路径"]) ? "多路径/NLOS/遮挡" : "",
      includesAny(corpus, ["acquisition", "tracking", "capture", "跟踪", "捕获"]) ? "信号捕获与跟踪" : "",
      includesAny(corpus, ["imu", "inertial"]) ? "IMU融合" : "",
      includesAny(corpus, ["map", "height aiding", "kinematic", "constraint", "高度", "运动学"]) ? "地图/高度/运动学约束" : "",
      includesAny(corpus, ["multi-constellation", "multi-leo", "fusion", "orbcomm", "iridium"]) ? "多星座/多系统融合" : "",
      includesAny(corpus, ["kalman", "factor graph", "smoothing", "filter"]) ? "滤波/因子图/平滑" : "",
      includesAny(corpus, ["review", "survey", "overview", "tutorial", "综述"]) ? "综述/教程" : "",
      includesAny(corpus, ["dataset", "benchmark", "field test", "外场"]) ? "数据集/平台/外场实验" : "",
      includesAny(corpus, ["performance", "accuracy", "rms", "误差分析"]) ? "性能评估/误差分析" : ""
    ].filter((item): item is (typeof SUBCATEGORY_CANDIDATES)[number] => SUBCATEGORY_CANDIDATES.includes(item as (typeof SUBCATEGORY_CANDIDATES)[number]))
  ).slice(0, 3);

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
}): PaperAnalysisOutput {
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
    title: input.title,
    researchQuestion: "当前为本地兜底结果，研究问题需要后续由 agent 基于正文重新抽取。",
    coreMethod: "当前为本地兜底结果，核心方法需要后续由 agent 基于正文重新抽取。",
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
    ],
    experimentalMethodology: "当前为本地兜底结果，实验方法细节需要后续由 agent 基于正文重新抽取。",
    performanceMetrics: [
      "当前为本地兜底结果，性能指标尚未从正文中可靠抽取。"
    ],
    primaryCategory: input.classification.primaryCategory,
    subcategories: input.classification.subcategories,
    tags: input.classification.tags,
    keywords: input.classification.keywords,
    confidence: input.classification.confidence,
    needsReview: input.classification.needsReview
  };
}
