import OpenAI from "openai";

export type AgentTransport = "responses" | "chat_completions";

export type AgentProviderId = "openai" | "openrouter" | "groq" | "hermes";

type InternalAgentProvider = {
  id: AgentProviderId;
  label: string;
  apiKey: string;
  baseURL?: string;
  defaultHeaders?: Record<string, string>;
  transport: AgentTransport;
  models: string[];
  defaultModel: string;
};

export type PublicAgentProvider = Omit<
  InternalAgentProvider,
  "apiKey" | "baseURL" | "defaultHeaders"
>;

function parseModels(rawValue: string | undefined, fallback: string[]) {
  const values = (rawValue ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return values.length > 0 ? values : fallback;
}

function buildProviders(): InternalAgentProvider[] {
  const providers: InternalAgentProvider[] = [];

  if (process.env.OPENAI_API_KEY) {
    const models = parseModels(process.env.OPENAI_MODELS, [
      "gpt-5.4",
      "gpt-5.4-mini",
      "gpt-5.4-nano"
    ]);

    providers.push({
      id: "openai",
      label: "OpenAI",
      apiKey: process.env.OPENAI_API_KEY,
      transport: "responses",
      models,
      defaultModel: models[0]
    });
  }

  if (process.env.OPENROUTER_API_KEY) {
    const models = parseModels(process.env.OPENROUTER_MODELS, [
      "openai/gpt-4.1-mini",
      "anthropic/claude-3.5-sonnet",
      "google/gemini-2.5-flash"
    ]);

    providers.push({
      id: "openrouter",
      label: "OpenRouter",
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL ?? "http://localhost:3000",
        "X-Title": process.env.OPENROUTER_SITE_NAME ?? "Literature Workbench"
      },
      transport: "chat_completions",
      models,
      defaultModel: models[0]
    });
  }

  if (process.env.GROQ_API_KEY) {
    const models = parseModels(process.env.GROQ_MODELS, [
      "llama-3.3-70b-versatile",
      "qwen-qwq-32b"
    ]);

    providers.push({
      id: "groq",
      label: "Groq",
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
      transport: "chat_completions",
      models,
      defaultModel: models[0]
    });
  }

  const hermesApiKey = process.env.HERMES_API_KEY?.trim();
  const hermesBaseURL = process.env.HERMES_BASE_URL?.trim();

  if (hermesApiKey || hermesBaseURL) {
    const models = parseModels(process.env.HERMES_MODELS, ["hermes-agent"]);

    providers.push({
      id: "hermes",
      label: "Hermes",
      apiKey: hermesApiKey || "hermes-local",
      baseURL: hermesBaseURL || "http://127.0.0.1:8642/v1",
      transport: "chat_completions",
      models,
      defaultModel: models[0]
    });
  }

  return providers;
}

export function getPublicAgentProviders(): PublicAgentProvider[] {
  return buildProviders().map(({ apiKey: _apiKey, baseURL: _baseURL, defaultHeaders: _defaultHeaders, ...provider }) => provider);
}

export function getInternalAgentProvider(providerId: AgentProviderId) {
  return buildProviders().find((provider) => provider.id === providerId) ?? null;
}

export function getFallbackProvider() {
  return buildProviders()[0] ?? null;
}

export function createProviderClient(providerId: AgentProviderId) {
  const provider = getInternalAgentProvider(providerId);

  if (!provider) {
    throw new Error("当前 provider 未配置 API Key。");
  }

  return {
    provider,
    client: new OpenAI({
      apiKey: provider.apiKey,
      baseURL: provider.baseURL,
      defaultHeaders: provider.defaultHeaders
    })
  };
}

export function resolveModelName(
  provider: PublicAgentProvider,
  selectedModel?: string,
  customModel?: string
) {
  const custom = customModel?.trim();

  if (custom) {
    return custom;
  }

  const selected = selectedModel?.trim();

  if (selected && provider.models.includes(selected)) {
    return selected;
  }

  return provider.defaultModel;
}
