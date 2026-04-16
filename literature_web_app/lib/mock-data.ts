import { Paper, TopicSnapshot } from "@/lib/types";

export const topicSnapshot: TopicSnapshot = {
  title: "GNSS 拒止环境下基于 LEO 机会信号的导航与定位",
  currentLines: [
    "Iridium + Orbcomm 多星座融合",
    "Doppler / 伪距混合定位",
    "参考站驱动的星历误差补偿",
    "解析模型 + residual learning 轨道修正"
  ],
  keyQuestions: [
    "多星座观测质量怎么进入分层权重设计",
    "星历修正不确定度怎么传播到用户定位层",
    "Doppler-only 和 joint pseudo-range + Doppler 的边界在哪里"
  ]
};

export const papers: Paper[] = [
  {
    id: "2025-yang-standalone-doppler",
    title:
      "Error Correction Analysis and Enhanced Algorithm for Standalone Doppler-Based Positioning Using Iridium-Next and Orbcomm Constellations",
    year: 2025,
    authors: ["Yang", "Zhang", "Kassas"],
    primaryCategory: "定位方法",
    subcategories: ["LEO SOP", "Doppler positioning", "GNSS denied"],
    tags: ["Iridium", "Orbcomm", "多历元", "误差修正"],
    keywords: [
      "Iridium-Next",
      "Orbcomm",
      "standalone Doppler",
      "multi-epoch aggregation"
    ],
    coreContribution:
      "构建了双星座 Doppler-only 定位链路，并把误差修正、多历元聚合和正则化整合进统一求解框架。",
    relevanceNote:
      "和你当前的 Iridium-Orbcomm GNSS-denied 主线最贴近，适合作为基线系统。",
    innovationNote:
      "更偏系统整合与算法增强，方法创新集中在误差修正和求解稳定化。",
    whatThisPaperDoes: [
      "针对双星座 Doppler-only 定位的误差来源做了系统梳理。",
      "把多历元观测聚合到统一求解流程中，提高稳定性。",
      "通过误差补偿和正则化改进单次解算的鲁棒性。"
    ],
    claimedInnovations: [
      "提出面向 Iridium-Next 和 Orbcomm 的增强型 Doppler-only 定位算法。",
      "将误差修正、多历元累积和正则化联动设计。"
    ],
    usefulToMyTopic: [
      "可直接作为双星座 Doppler-only 的对照基线。",
      "适合继续向 robust WLS / HVCE 方向扩展。",
      "能帮助拆分“观测提取问题”和“权重建模问题”。"
    ],
    limitations: [
      "仍以 Doppler-only 为主，对混合观测不完整。",
      "没有把轨道误差后验协方差系统传递到定位层。"
    ],
    candidateIdeas: [
      "candidate: 在双星座 Doppler-only 基线之上叠加分层加权和鲁棒抑制。 "
    ]
  },
  {
    id: "2025-xu-joint-pseudorange-doppler",
    title:
      "Joint pseudo-range and Doppler positioning method with LEO Satellites' signals of opportunity",
    year: 2025,
    authors: ["Xu", "Li", "Wang"],
    primaryCategory: "定位方法",
    subcategories: ["LEO SOP", "pseudorange positioning", "Doppler positioning"],
    tags: ["混合观测", "可观性", "Iridium", "Starlink"],
    keywords: ["pseudorange", "Doppler", "EPDOP", "mixed observations"],
    coreContribution:
      "提出联合伪距与 Doppler 的混合定位框架，并用 EPDOP 评估混合观测几何质量。",
    relevanceNote:
      "对你后续把 Iridium / Orbcomm 做成混合观测联合求解非常关键。",
    innovationNote:
      "主要创新在混合观测建模和几何分析，而不是鲁棒权重本身。",
    whatThisPaperDoes: [
      "构建联合伪距和 Doppler 的观测模型。",
      "分析混合观测对可观性的提升作用。",
      "通过实验说明混合观测优于单一观测类型。"
    ],
    claimedInnovations: [
      "提出 joint pseudo-range + Doppler 的 SOP 定位框架。",
      "引入用于混合观测的 EPDOP 指标。"
    ],
    usefulToMyTopic: [
      "适合作为混合观测求解主线的理论入口。",
      "有助于后续把加权策略扩展到不同观测类型。"
    ],
    limitations: [
      "没有深入讨论鲁棒估计。",
      "双星座异质质量差异的处理仍不充分。"
    ],
    candidateIdeas: [
      "candidate: 显式传播不同观测类型与不同星座的不确定度到联合 WLS / VarPro。"
    ]
  },
  {
    id: "2024-hayek-timing-spatial",
    title:
      "Modeling and Compensation of Timing and Spatial Ephemeris Errors of Non-Cooperative LEO Satellites With Application to PNT",
    year: 2024,
    authors: ["Hayek", "Mina", "Kassas"],
    primaryCategory: "轨道与星历误差建模",
    subcategories: ["orbit error compensation", "timing error", "LEO SOP"],
    tags: ["星历误差", "时间误差", "UKF", "参考站辅助"],
    keywords: ["timing error", "spatial error", "UKF", "Doppler"],
    coreContribution:
      "统一建模 timing / spatial 星历误差对多类观测的影响，并用 UKF 完成补偿。",
    relevanceNote:
      "是你做 light-time modeling 和 orbit-error compensation 的关键参考。",
    innovationNote:
      "方法贡献在于统一误差模型和快速补偿框架。",
    whatThisPaperDoes: [
      "推导时间与空间星历误差如何影响 Doppler、载波等观测。",
      "用参考站辅助方式估计并补偿这些误差。",
      "验证补偿对下游 PNT 性能的增益。"
    ],
    claimedInnovations: [
      "统一建模 timing / spatial ephemeris errors。",
      "提出基于 UKF 的补偿框架。"
    ],
    usefulToMyTopic: [
      "适合做参考站辅助星历修正的先验层。",
      "有助于把时间误差显式纳入主定位模型。",
      "能和 residual learning 做双层修正结合。"
    ],
    limitations: [
      "仍偏重参考站辅助场景。",
      "用户端鲁棒定位设计不是重点。"
    ],
    candidateIdeas: [
      "candidate: 先做解析 timing/spatial 补偿，再学习剩余 along-track 与 timing 残差。"
    ]
  },
  {
    id: "2024-jardak-multi-leo",
    title: "Leveraging Multi-LEO Satellite Signals for Opportunistic Positioning",
    year: 2024,
    authors: ["Jardak", "Kassas"],
    primaryCategory: "多星座融合与观测建模",
    subcategories: ["LEO SOP", "multi-constellation fusion"],
    tags: ["Iridium", "Orbcomm", "NOAA", "质量差异"],
    keywords: ["multi-LEO", "Doppler", "Iridium-next", "Orbcomm"],
    coreContribution:
      "基于真实信号评估不同 LEO 星座的 Doppler 质量，并量化多星座融合的实际收益边界。",
    relevanceNote:
      "这篇最重要的价值是提醒你：融合收益取决于质量建模，不是星座越多越好。",
    innovationNote:
      "更偏工程验证和经验总结，方法创新有限。",
    whatThisPaperDoes: [
      "比较不同 LEO 星座的信号可用性和 Doppler 表现。",
      "分析多星座融合在实际场景下的收益与限制。",
      "展示质量差异会显著影响融合效果。"
    ],
    claimedInnovations: [
      "更偏工程整合/实验验证，方法创新有限。"
    ],
    usefulToMyTopic: [
      "直接支撑你后续做质量感知加权。",
      "能帮助定义 Iridium / Orbcomm 融合时的先验质量差异。"
    ],
    limitations: [
      "更强调经验评估而非统一优化框架。",
      "没有把质量建模上升到系统化权重设计。"
    ],
    candidateIdeas: [
      "candidate: 把星座层质量差异和观测层残差一致地并入分层权重。"
    ]
  }
];

export function getPaperById(id: string) {
  return papers.find((paper) => paper.id === id);
}

export function getLibraryStats() {
  const categories = new Set(papers.map((paper) => paper.primaryCategory));
  const tags = new Set(papers.flatMap((paper) => paper.tags));

  return {
    paperCount: papers.length,
    categoryCount: categories.size,
    tagCount: tags.size
  };
}
