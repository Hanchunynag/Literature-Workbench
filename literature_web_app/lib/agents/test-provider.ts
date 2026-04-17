import { createProviderClient, getFallbackProvider, getPublicAgentProviders } from "@/lib/agent-catalog";
import { resolveModelName } from "@/lib/agent-catalog";

type TestProviderInput = {
  providerId?: string;
  model?: string;
  customModel?: string;
};

export async function testProviderConnection(input: TestProviderInput) {
  const providers = getPublicAgentProviders();
  const fallbackProvider = getFallbackProvider();

  if (providers.length === 0 || !fallbackProvider) {
    throw new Error("还没有可用的 provider。请先在 .env.local 里配置 API Key。");
  }

  const selectedProvider =
    providers.find((provider) => provider.id === input.providerId) ?? fallbackProvider;
  const modelName = resolveModelName(selectedProvider, input.model, input.customModel);
  const { provider, client } = createProviderClient(selectedProvider.id);

  if (provider.transport === "responses") {
    const response = await client.responses.create({
      model: modelName,
      input: "只回复四个字：连接成功"
    });

    const output =
      response.output_text?.trim() ||
      "未返回文本内容";

    return {
      providerId: provider.id,
      providerLabel: provider.label,
      model: modelName,
      output
    };
  }

  const response = await client.chat.completions.create({
    model: modelName,
    messages: [{ role: "user", content: "只回复四个字：连接成功" }],
    stream: false
  });

  return {
    providerId: provider.id,
    providerLabel: provider.label,
    model: modelName,
    output: response.choices[0]?.message?.content?.trim() || "未返回文本内容"
  };
}
