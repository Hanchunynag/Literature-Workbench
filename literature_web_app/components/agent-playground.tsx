"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import type { PublicAgentProvider } from "@/lib/agent-catalog";

type AgentPlaygroundProps = {
  providers: PublicAgentProvider[];
};

type AgentResult = {
  providerId: string;
  providerLabel: string;
  model: string;
  output: string;
};

export function AgentPlayground({ providers }: AgentPlaygroundProps) {
  const [providerId, setProviderId] = useState(providers[0]?.id ?? "");
  const [selectedModel, setSelectedModel] = useState(providers[0]?.defaultModel ?? "");
  const [customModel, setCustomModel] = useState("");
  const [paperTitle, setPaperTitle] = useState("");
  const [abstractText, setAbstractText] = useState("");
  const [topic, setTopic] = useState("LEO SOP / GNSS denied");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState(
    "这篇论文更适合作为混合观测定位的基线，还是更适合作为轨道误差补偿参考？"
  );
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AgentResult | null>(null);

  const currentProvider = useMemo(() => {
    return providers.find((provider) => provider.id === providerId) ?? providers[0] ?? null;
  }, [providerId, providers]);

  useEffect(() => {
    if (!currentProvider) {
      return;
    }

    setSelectedModel(currentProvider.defaultModel);
    setCustomModel("");
  }, [currentProvider]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setError("");

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          providerId,
          model: selectedModel,
          customModel,
          paperTitle,
          abstractText,
          topic,
          note,
          message
        })
      });

      const payload = (await response.json()) as
        | ({ ok: true } & AgentResult)
        | { ok: false; message: string };

      if (!response.ok || !payload.ok) {
        setResult(null);
        setError(payload.ok ? "Agent 请求失败。" : payload.message);
        return;
      }

      setResult({
        providerId: payload.providerId,
        providerLabel: payload.providerLabel,
        model: payload.model,
        output: payload.output
      });
    } catch {
      setResult(null);
      setError("Agent 请求失败，请检查接口和环境变量。");
    } finally {
      setIsPending(false);
    }
  }

  if (providers.length === 0) {
    return (
      <div className="result-box error">
        <p>还没有可用的 provider。</p>
        <p>先在 `.env.local` 里配置至少一组 API Key，然后重启开发服务器。</p>
      </div>
    );
  }

  return (
    <div className="agent-layout">
      <form className="agent-form" onSubmit={handleSubmit}>
        <div className="agent-provider-grid">
          <label className="field">
            <span>Provider</span>
            <select value={providerId} onChange={(event) => setProviderId(event.target.value)}>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>预设模型</span>
            <select
              value={selectedModel}
              onChange={(event) => setSelectedModel(event.target.value)}
            >
              {(currentProvider?.models ?? []).map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="field">
          <span>自定义模型名</span>
          <input
            placeholder="留空则使用上面的预设模型"
            type="text"
            value={customModel}
            onChange={(event) => setCustomModel(event.target.value)}
          />
        </label>

        <label className="field">
          <span>论文标题（可选）</span>
          <input
            placeholder="例如：Joint pseudo-range and Doppler positioning..."
            type="text"
            value={paperTitle}
            onChange={(event) => setPaperTitle(event.target.value)}
          />
        </label>

        <label className="field">
          <span>摘要 / 提取文本（可选）</span>
          <textarea
            placeholder="贴一段摘要、提取文本或你想让 agent 读取的上下文"
            rows={5}
            value={abstractText}
            onChange={(event) => setAbstractText(event.target.value)}
          />
        </label>

        <div className="agent-provider-grid">
          <label className="field">
            <span>研究专题</span>
            <input
              type="text"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
            />
          </label>

          <label className="field">
            <span>你的备注</span>
            <input
              placeholder="例如：想重点判断它对 robust WLS 有没有帮助"
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>
        </div>

        <label className="field">
          <span>想问 Agent 的问题</span>
          <textarea
            rows={4}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
        </label>

        <button className="primary-button" disabled={isPending} type="submit">
          {isPending ? "正在调用 Agent..." : "运行 Agent"}
        </button>
      </form>

      <aside className="agent-output">
        <p className="section-label">Model Lab</p>
        <h3>一套界面，切不同模型</h3>

        <div className="agent-chip-row">
          {providers.map((provider) => (
            <span
              key={provider.id}
              className={provider.id === providerId ? "tag-pill tag-pill-strong" : "tag-pill"}
            >
              {provider.label}
            </span>
          ))}
        </div>

        <ul className="clean-list">
          <li>OpenAI 默认走 Responses API。</li>
          <li>OpenRouter / Groq 走 OpenAI-compatible Chat Completions 路径。</li>
          <li>你可以先选预设模型，也可以手动输入自定义模型名。</li>
          <li>站内 mock 文献会作为工具供 agent 检索。</li>
        </ul>

        {error ? (
          <div className="result-box error">
            <p>{error}</p>
          </div>
        ) : null}

        {result ? (
          <div className="result-box success">
            <div className="agent-result-head">
              <span className="tag-pill tag-pill-strong">{result.providerLabel}</span>
              <span className="tag-pill">{result.model}</span>
            </div>
            <p className="agent-result-copy">{result.output}</p>
          </div>
        ) : (
          <div className="result-box">
            <p>Agent 返回结果会显示在这里。</p>
          </div>
        )}
      </aside>
    </div>
  );
}
