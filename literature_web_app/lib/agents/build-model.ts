import OpenAI from "openai";

import {
  createAgentRunner,
  OpenAIChatCompletionsModel,
  OpenAIResponsesModel
} from "@/lib/agents/sdk";
import {
  getFallbackProvider,
  getInternalAgentProvider,
  type AgentProviderId
} from "@/lib/agent-catalog";

type BuildAgentModelInput = {
  providerId?: string;
  modelName?: string;
};

export function buildAgentModel(input: BuildAgentModelInput) {
  const fallbackProvider = getFallbackProvider();
  const selectedProvider =
    (input.providerId
      ? getInternalAgentProvider(input.providerId as AgentProviderId)
      : null) ?? fallbackProvider;

  if (!selectedProvider) {
    throw new Error("没有可用的 agent provider。请先配置 API Key。");
  }

  const modelName = input.modelName?.trim() || selectedProvider.defaultModel;

  const client = new OpenAI({
    apiKey: selectedProvider.apiKey,
    baseURL: selectedProvider.baseURL,
    defaultHeaders: selectedProvider.defaultHeaders
  });

  return {
    providerId: selectedProvider.id,
    providerLabel: selectedProvider.label,
    modelName,
    runner: createAgentRunner(client),
    model:
      selectedProvider.transport === "responses"
        ? new OpenAIResponsesModel(client, modelName)
        : new OpenAIChatCompletionsModel(client, modelName)
  };
}
