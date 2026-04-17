import { Agent, Runner, setTracingDisabled, tool } from "@openai/agents-core";
import { OpenAIChatCompletionsModel, OpenAIProvider, OpenAIResponsesModel } from "@openai/agents-openai";
import type OpenAI from "openai";

// Hermes / OpenRouter / Groq 这些 provider 也能通过 Agents SDK 运行，
// 但这里不需要把 traces 再回传给 OpenAI。
setTracingDisabled(true);

export function createAgentRunner(client: OpenAI) {
  return new Runner({
    modelProvider: new OpenAIProvider({
      openAIClient: client
    }),
    tracingDisabled: true,
    traceIncludeSensitiveData: false
  });
}

export { Agent, OpenAIChatCompletionsModel, OpenAIResponsesModel, tool };
