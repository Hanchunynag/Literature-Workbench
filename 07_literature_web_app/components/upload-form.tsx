"use client";

import { FormEvent, useState } from "react";

type UploadResult = {
  ok: boolean;
  message: string;
  fileName?: string;
  nextStep?: string;
};

export function UploadForm() {
  const [result, setResult] = useState<UploadResult | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    setIsPending(true);

    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      const payload = (await response.json()) as UploadResult;
      setResult(payload);
    } catch {
      setResult({
        ok: false,
        message: "占位上传请求失败，后面接真实后端时这里会补完整错误提示。"
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="upload-panel">
      <form className="upload-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>选择 PDF</span>
          <input accept="application/pdf" name="paper" required type="file" />
        </label>

        <label className="field">
          <span>研究专题</span>
          <input
            defaultValue="当前主线"
            name="project"
            placeholder="例如：LEO SOP / GNSS denied"
            type="text"
          />
        </label>

        <label className="field">
          <span>备注</span>
          <textarea
            name="note"
            placeholder="例如：这篇想重点看轨道误差建模部分"
            rows={4}
          />
        </label>

        <button className="primary-button" disabled={isPending} type="submit">
          {isPending ? "正在提交占位任务..." : "上传并触发处理"}
        </button>
      </form>

      <aside className="upload-aside">
        <h3>这一步后面会接什么</h3>
        <ol>
          <li>保存 PDF 到对象存储</li>
          <li>创建 paper 记录</li>
          <li>触发后台提取任务</li>
          <li>执行查重、分类和摘要生成</li>
          <li>回写详情页与处理状态</li>
        </ol>
      </aside>

      {result ? (
        <div className={result.ok ? "result-box success" : "result-box error"}>
          <p>{result.message}</p>
          {result.fileName ? <p>文件: {result.fileName}</p> : null}
          {result.nextStep ? <p>下一步: {result.nextStep}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
