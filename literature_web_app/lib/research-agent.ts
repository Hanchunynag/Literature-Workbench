import { Agent, OpenAIChatCompletionsModel, OpenAIResponsesModel, run, tool } from "@openai/agents";
import OpenAI from "openai";
import { z } from "zod";

import {
  getFallbackProvider,
  getInternalAgentProvider,
  getPublicAgentProviders,
  type AgentProviderId
} from "@/lib/agent-catalog";
import { getPaperById, papers, topicSnapshot } from "@/lib/mock-data";

const searchLibraryTool = tool({
  name: "search_library",
  description: "按标题、关键词、标签和一级方向搜索当前站点里的论文条目。",
  parameters: z.object({
    query: z.string().min(1, "query is required")
  }),
  async execute({ query }) {
    const normalized = query.trim().toLowerCase();

    const results = papers
      .filter((paper) => {
        return (
          paper.title.toLowerCase().includes(normalized) ||
          paper.primaryCategory.toLowerCase().includes(normalized) ||
          paper.tags.some((tag) => tag.toLowerCase().includes(normalized)) ||
          paper.keywords.some((keyword) => keyword.toLowerCase().includes(normalized))
        );
      })
      .slice(0, 3)
      .map((paper) => {
        return [
          `${paper.title} (${paper.year})`,
          `分类: ${paper.primaryCategory}`,
          `关键词: ${paper.keywords.join(" / ")}`,
          `核心贡献: ${paper.coreContribution}`
        ].join("\n");
      });

    return results.length > 0 ? results.join("\n\n") : "没有找到匹配论文。";
  }
});

const getPaperDetailsTool = tool({
  name: "get_paper_details",
  description: "根据论文 id 获取更完整的站点内论文信息。",
  parameters: z.object({
    paperId: z.string().min(1, "paperId is required")
  }),
  async execute({ paperId }) {
    const paper = getPaperById(paperId);

    if (!paper) {
      return "没有找到该论文。";
    }

    return [
      `${paper.title} (${paper.year})`,
      `作者: ${paper.authors.join(", ")}`,
      `一级方向: ${paper.primaryCategory}`,
      `核心贡献: ${paper.coreContribution}`,
      `适用性判断: ${paper.relevanceNote}`,
      `创新性判断: ${paper.innovationNote}`,
      `局限: ${paper.limitations.join(" / ")}`
    ].join("\n");
  }
});

type RunResearchAgentInput = {
  providerId?: string;
  model?: string;
  customModel?: string;
  paperTitle?: string;
  abstractText?: string;
  topic?: string;
  note?: string;
  message: string;
};

function buildModel(providerId: AgentProviderId, modelName: string) {
  const provider = getInternalAgentProvider(providerId);

  if (!provider) {
    throw new Error("当前 provider 未配置 API Key。");
  }

  const client = new OpenAI({
    apiKey: provider.apiKey,
    baseURL: provider.baseURL,
    defaultHeaders: provider.defaultHeaders
  });

  if (provider.transport === "responses") {
    return new OpenAIResponsesModel(client, modelName);
  }

  return new OpenAIChatCompletionsModel(client, modelName);
}

export async function runResearchAgent(input: RunResearchAgentInput) {
  const publicProviders = getPublicAgentProviders();
  const fallbackProvider = getFallbackProvider();

  if (publicProviders.length === 0 || !fallbackProvider) {
    throw new Error("还没有可用的 provider。请先在 .env.local 里配置 API Key。");
  }

  const selectedProvider =
    publicProviders.find((provider) => provider.id === input.providerId) ??
    fallbackProvider;

  const modelName =
    input.customModel?.trim() ||
    input.model?.trim() ||
    selectedProvider.defaultModel;

  const agent = new Agent({
    name: "Literature Research Assistant",
    model: buildModel(selectedProvider.id, modelName),
    instructions: `
你是一个 LEO SOP 文献网站里的研究助手。

你的任务：
1. 回答用户关于论文主题、方法、创新边界和阅读顺序的问题。
2. 当站点内已有论文信息时，优先使用工具检索并基于这些信息回答。
3. 如果用户给了论文标题、摘要或备注，就结合这些上下文一起分析。
4. 明确区分“站内已有事实”和“你给出的建议”。
5. 回答用中文，结构清楚、简洁、保守，不夸大结论。

当前站点研究主题：
${topicSnapshot.title}

当前主线：
${topicSnapshot.currentLines.map((line) => `- ${line}`).join("\n")}

关键问题：
${topicSnapshot.keyQuestions.map((line) => `- ${line}`).join("\n")}
    `.trim(),
    tools: [searchLibraryTool, getPaperDetailsTool]
  });

  const promptParts = [
    `用户问题:\n${input.message.trim()}`,
    input.paperTitle?.trim() ? `论文标题:\n${input.paperTitle.trim()}` : null,
    input.abstractText?.trim() ? `摘要 / 提取文本:\n${input.abstractText.trim()}` : null,
    input.topic?.trim() ? `研究专题:\n${input.topic.trim()}` : null,
    input.note?.trim() ? `用户备注:\n${input.note.trim()}` : null
  ].filter(Boolean);

  const result = await run(agent, promptParts.join("\n\n"));

  return {
    providerId: selectedProvider.id,
    providerLabel: selectedProvider.label,
    model: modelName,
    output: String(result.finalOutput ?? "")
  };
}
