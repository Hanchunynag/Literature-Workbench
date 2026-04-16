"use client";

import { FormEvent, useState } from "react";

type ClassificationResult = {
  primaryCategory: string;
  subcategories: string[];
  tags: string[];
  confidence: number;
  needsReview: boolean;
  coreContribution: string;
  relevanceNote: string;
  innovationNote: string;
  whatThisPaperDoes: string[];
  claimedInnovations: string[];
  usefulToMyTopic: string[];
  limitations: string[];
  candidateIdeas: string[];
};

type ApiResult =
  | {
      ok: true;
      classification: ClassificationResult;
    }
  | {
      ok: false;
      message: string;
    };

export function ClassifyDemoForm() {
  const [isPending, setIsPending] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setResult(null);

    const formData = new FormData(event.currentTarget);
    const keywordText = String(formData.get("keywords") ?? "");

    try {
      const response = await fetch("/api/classify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: formData.get("title"),
          abstractText: formData.get("abstractText"),
          note: formData.get("note"),
          keywords: keywordText
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        })
      });

      const payload = (await response.json()) as ApiResult;
      setResult(payload);
    } catch {
      setResult({
        ok: false,
        message: "调用分类 agent 失败。"
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Agent 分类演示</h2>
        <p className="muted-text">这里展示真实项目里 agent 的接入位置。</p>
      </div>

      <form
        className="upload-form"
        onSubmit={onSubmit}
      >
        <label className="field">
          <span>论文标题</span>
          <input
            defaultValue="Joint pseudo-range and Doppler positioning method with LEO Satellites' signals of opportunity"
            name="title"
            required
            type="text"
          />
        </label>

        <label className="field">
          <span>摘要 / 提取文本</span>
          <textarea
            defaultValue="This paper proposes a joint pseudorange and Doppler positioning framework for LEO signals of opportunity and evaluates geometry with EPDOP."
            name="abstractText"
            required
            rows={5}
          />
        </label>

        <label className="field">
          <span>关键词</span>
          <input
            defaultValue="LEO SOP, pseudorange, Doppler, Iridium, Starlink"
            name="keywords"
            type="text"
          />
        </label>

        <label className="field">
          <span>你的备注</span>
          <textarea
            defaultValue="我想知道它对 Iridium-Orbcomm 混合观测和鲁棒加权有没有参考价值。"
            name="note"
            rows={3}
          />
        </label>

        <button className="primary-button" disabled={isPending} type="submit">
          {isPending ? "正在调用 agent..." : "调用后端 agent 分类"}
        </button>
      </form>

      {result ? (
        result.ok ? (
          <div className="result-box success">
            <p>一级方向: {result.classification.primaryCategory}</p>
            <p>置信度: {result.classification.confidence}</p>
            <p>需要人工确认: {String(result.classification.needsReview)}</p>
            <p>核心贡献: {result.classification.coreContribution}</p>
            <p>适用性判断: {result.classification.relevanceNote}</p>
            <p>标签: {result.classification.tags.join(" / ")}</p>
          </div>
        ) : (
          <div className="result-box error">
            <p>{result.message}</p>
          </div>
        )
      ) : null}
    </div>
  );
}
