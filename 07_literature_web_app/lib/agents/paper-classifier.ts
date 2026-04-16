import { Agent, run } from "@openai/agents";
import { z } from "zod";

import { PRIMARY_CATEGORIES, SUBCATEGORY_HINTS } from "@/lib/agents/taxonomy";

const classificationSchema = z.object({
  primaryCategory: z.enum(PRIMARY_CATEGORIES),
  subcategories: z.array(z.string()).max(5),
  tags: z.array(z.string()).max(8),
  confidence: z.number().min(0).max(1),
  needsReview: z.boolean(),
  coreContribution: z.string(),
  relevanceNote: z.string(),
  innovationNote: z.string(),
  whatThisPaperDoes: z.array(z.string()).min(2).max(5),
  claimedInnovations: z.array(z.string()).min(1).max(4),
  usefulToMyTopic: z.array(z.string()).min(1).max(4),
  limitations: z.array(z.string()).min(1).max(4),
  candidateIdeas: z.array(z.string()).max(3)
});

export type PaperClassification = z.infer<typeof classificationSchema>;

type ClassifyPaperInput = {
  title: string;
  abstractText: string;
  keywords?: string[];
  note?: string;
};

const classifierAgent = new Agent({
  name: "Literature Classifier",
  model: "gpt-5.4-nano",
  instructions: `
你是个人研究文献网站的论文分类与提要助手。

任务：
1. 阅读给定论文标题、摘要、关键词和用户备注。
2. 从固定一级方向中选择最合适的一个 primaryCategory。
3. 输出若干 subcategories 与 tags，允许提出新标签，但一级方向必须从给定集合中选。
4. 如果信息不足、方向模糊或把握不高，needsReview 设为 true，并优先使用 "待人工确认"。
5. 所有输出必须保守，不夸大创新性。

研究重点：
- LEO SOP positioning/navigation under GNSS-denied environments
- Iridium and Orbcomm fusion
- pseudorange-rate / Doppler-based positioning
- robust WLS / HVCE / VarPro
- orbit error compensation
- light-time modeling
- residual learning for orbit correction

一级方向候选：
${PRIMARY_CATEGORIES.join(" / ")}

可参考的子类提示：
${SUBCATEGORY_HINTS.join(" / ")}

写作约束：
- 用中文输出字段内容
- whatThisPaperDoes 只写论文在做什么
- claimedInnovations 只写论文真正声称的贡献
- usefulToMyTopic 必须和上面的研究重点相关
- candidateIdeas 必须明确区分为我方可延伸想法，不要冒充论文原文结论
  `.trim(),
  outputType: classificationSchema
});

export async function classifyPaperWithAgent(
  input: ClassifyPaperInput
): Promise<PaperClassification> {
  const prompt = `
请对下面论文做结构化分类与阅读提要生成。

Title:
${input.title}

Abstract:
${input.abstractText}

Keywords:
${(input.keywords ?? []).join(", ") || "无"}

User note:
${input.note || "无"}
  `.trim();

  const result = await run(classifierAgent, prompt);

  if (!result.finalOutput) {
    throw new Error("Agent 未返回结构化分类结果。");
  }

  return result.finalOutput;
}
