"use client";

import { FormEvent, useState } from "react";

type UploadState = {
  fileName: string;
  topic: string;
  note: string;
};

export function UploadForm() {
  const [isPending, setIsPending] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    const file = formData.get("paper");
    const topic = String(formData.get("topic") ?? "").trim();
    const note = String(formData.get("note") ?? "").trim();

    await new Promise((resolve) => setTimeout(resolve, 500));

    setUploadState({
      fileName: file instanceof File ? file.name : "未命名文件",
      topic: topic || "未指定专题",
      note: note || "无备注"
    });
    setIsPending(false);
  }

  return (
    <div className="upload-panel">
      <form className="upload-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>选择论文 PDF</span>
          <input accept="application/pdf" name="paper" required type="file" />
        </label>

        <label className="field">
          <span>关联研究专题</span>
          <input
            defaultValue="LEO SOP / GNSS denied"
            name="topic"
            placeholder="例如：Iridium-Orbcomm 融合 / Robust WLS"
            type="text"
          />
        </label>

        <label className="field">
          <span>阅读备注</span>
          <textarea
            defaultValue="这篇希望重点查看混合观测建模与轨道误差补偿部分。"
            name="note"
            placeholder="写下你希望后续重点看的方向"
            rows={5}
          />
        </label>

        <button className="primary-button" disabled={isPending} type="submit">
          {isPending ? "正在整理上传信息..." : "加入网站工作流"}
        </button>
      </form>

      <aside className="upload-aside">
        <p className="section-label">Upload Experience</p>
        <h3>上传入口保留，但只做网站交互</h3>
        <ul className="clean-list">
          <li>保留文件选择、研究专题和备注输入。</li>
          <li>保留界面反馈，方便继续做真实产品设计。</li>
          <li>不恢复本地脚本、自动分类或处理队列。</li>
        </ul>
      </aside>

      {uploadState ? (
        <div className="result-box success upload-result">
          <p className="section-label">Upload Snapshot</p>
          <h3>{uploadState.fileName}</h3>
          <p>
            <strong>专题:</strong> {uploadState.topic}
          </p>
          <p>
            <strong>备注:</strong> {uploadState.note}
          </p>
        </div>
      ) : null}
    </div>
  );
}
