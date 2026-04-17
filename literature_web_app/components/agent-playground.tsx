"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import type { AgentProviderId, PublicAgentProvider } from "@/lib/agent-catalog";

type AgentPlaygroundProps = {
  providers: PublicAgentProvider[];
};

type AgentResult = {
  providerId: string;
  providerLabel: string;
  model: string;
  output: string;
};

type ConnectionTestResult = {
  providerLabel: string;
  model: string;
  output: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export function AgentPlayground({ providers }: AgentPlaygroundProps) {
  const [providerId, setProviderId] = useState<AgentProviderId | "">(providers[0]?.id ?? "");
  const [selectedModel, setSelectedModel] = useState(providers[0]?.defaultModel ?? "");
  const [customModel, setCustomModel] = useState("");
  const [paperTitle, setPaperTitle] = useState("");
  const [abstractText, setAbstractText] = useState("");
  const [topic, setTopic] = useState("LEO SOP / GNSS denied");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState(
    "这篇论文更适合作为混合观测定位的基线，还是更适合作为轨道误差补偿参考？"
  );
  const [chatInput, setChatInput] = useState("你好，请先介绍一下你自己能做什么。");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isChatPending, setIsChatPending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AgentResult | null>(null);
  const [connectionError, setConnectionError] = useState("");
  const [connectionResult, setConnectionResult] = useState<ConnectionTestResult | null>(null);
  const [chatError, setChatError] = useState("");

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

  useEffect(() => {
    setChatMessages([]);
    setChatError("");
    setConnectionError("");
    setConnectionResult(null);
  }, [providerId, selectedModel]);

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

  async function handleConnectionTest() {
    setIsTestingConnection(true);
    setConnectionError("");
    setConnectionResult(null);

    try {
      const response = await fetch("/api/agent/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          providerId,
          model: selectedModel,
          customModel
        })
      });

      const payload = (await response.json()) as
        | ({ ok: true } & ConnectionTestResult)
        | { ok: false; message: string };

      if (!response.ok || !payload.ok) {
        setConnectionError(payload.ok ? "连接测试失败。" : payload.message);
        return;
      }

      setConnectionResult({
        providerLabel: payload.providerLabel,
        model: payload.model,
        output: payload.output
      });
    } catch {
      setConnectionError("连接测试失败，请检查 provider 配置。");
    } finally {
      setIsTestingConnection(false);
    }
  }

  async function handleChatSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedInput = chatInput.trim();

    if (!trimmedInput) {
      return;
    }

    const nextMessages = [
      ...chatMessages,
      {
        id: `${Date.now()}-user`,
        role: "user" as const,
        content: trimmedInput
      }
    ];

    setChatMessages(nextMessages);
    setChatInput("");
    setChatError("");
    setIsChatPending(true);

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
          messages: nextMessages.map(({ role, content }) => ({ role, content }))
        })
      });

      const payload = (await response.json()) as
        | ({ ok: true } & AgentResult)
        | { ok: false; message: string };

      if (!response.ok || !payload.ok) {
        setChatError(payload.ok ? "对话请求失败。" : payload.message);
        return;
      }

      setChatMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          content: payload.output
        }
      ]);
    } catch {
      setChatError("对话请求失败，请检查 provider 和网络配置。");
    } finally {
      setIsChatPending(false);
    }
  }

  function handleClearChat() {
    setChatMessages([]);
    setChatError("");
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
      <div className="agent-control-stack">
        <form className="agent-form" onSubmit={handleSubmit}>
          <div className="agent-provider-grid">
            <label className="field">
              <span>Provider</span>
              <select
                value={providerId}
                onChange={(event) => setProviderId(event.target.value as AgentProviderId)}
              >
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

          <div className="agent-button-row">
            <button className="primary-button" disabled={isPending} type="submit">
              {isPending ? "正在调用 Agent..." : "运行单次分析"}
            </button>

            <button
              className="secondary-button"
              disabled={isTestingConnection}
              onClick={handleConnectionTest}
              type="button"
            >
              {isTestingConnection ? "正在测试连接..." : "测试当前 Provider 连接"}
            </button>
          </div>
        </form>

        <form className="agent-chat-panel" onSubmit={handleChatSubmit}>
          <div className="panel-head">
            <div>
              <p className="eyebrow">Chat Window</p>
              <h3>对话测试窗口</h3>
              <p className="muted-text">这里用于直接测试你和当前模型的连续对话。</p>
            </div>
            <button className="secondary-button" onClick={handleClearChat} type="button">
              清空对话
            </button>
          </div>

          <div className="chat-transcript">
            {chatMessages.length > 0 ? (
              chatMessages.map((item) => (
                <article
                  key={item.id}
                  className={item.role === "user" ? "chat-bubble chat-bubble-user" : "chat-bubble"}
                >
                  <p className="section-label">
                    {item.role === "user" ? "You" : currentProvider?.label ?? "Assistant"}
                  </p>
                  <p>{item.content}</p>
                </article>
              ))
            ) : (
              <div className="empty-chat">
                <p>这里会显示你和当前模型的多轮对话。</p>
                <p>先点一次连接测试，再直接开始和它连续聊天就可以。</p>
              </div>
            )}
          </div>

          <label className="field">
            <span>发送给当前模型的话</span>
            <textarea
              placeholder="例如：请先用三句话介绍你能如何帮助我分析这篇论文。"
              rows={4}
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
            />
          </label>

          <div className="agent-button-row">
            <button className="primary-button" disabled={isChatPending} type="submit">
              {isChatPending ? "对话中..." : "发送消息"}
            </button>
          </div>

          {chatError ? (
            <div className="result-box error">
              <p>{chatError}</p>
            </div>
          ) : null}
        </form>
      </div>

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
          <li>Hermes 按 OpenAI-compatible Chat Completions 测试。</li>
          <li>你可以先选预设模型，也可以手动输入自定义模型名。</li>
          <li>站内 mock 文献会作为工具供 agent 检索。</li>
        </ul>

        {error ? (
          <div className="result-box error">
            <p>{error}</p>
          </div>
        ) : null}

        {connectionError ? (
          <div className="result-box error">
            <p>{connectionError}</p>
          </div>
        ) : null}

        {connectionResult ? (
          <div className="result-box success">
            <div className="agent-result-head">
              <span className="tag-pill tag-pill-strong">{connectionResult.providerLabel}</span>
              <span className="tag-pill">{connectionResult.model}</span>
            </div>
            <p className="agent-result-copy">{connectionResult.output}</p>
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
            <p>单次分析结果会显示在这里。</p>
          </div>
        )}
      </aside>
    </div>
  );
}
