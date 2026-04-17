"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type UploadState = {
  batchId?: string;
  status: string;
  items: Array<{
    paperId: string;
    fileId?: string;
    fileName: string;
    status: string;
    duplicate: boolean;
  }>;
};

export function UploadForm() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const [uploadState, setUploadState] = useState<UploadState | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const files = formData.getAll("paper").filter((value): value is File => value instanceof File);

    try {
      const response = await fetch("/api/papers/upload", {
        method: "POST",
        body: formData
      });

      const payload = (await response.json()) as
        | {
            ok: true;
            batchId?: string;
            status: string;
            paperId?: string;
            fileId?: string;
            duplicate?: boolean;
            items?: Array<{
              paperId: string;
              fileId?: string;
              fileName: string;
              status: string;
              duplicate: boolean;
            }>;
            message?: string;
          }
        | { ok: false; message: string };

      if (!response.ok || !payload.ok) {
        setError(payload.ok ? "上传失败。" : payload.message);
        setUploadState(null);
        return;
      }

      setUploadState({
        batchId: payload.batchId,
        status: payload.status,
        items:
          payload.items ??
          [
            {
              paperId: payload.paperId ?? "",
              fileId: payload.fileId,
              fileName: files[0]?.name ?? "未命名文件",
              status: payload.status,
              duplicate: Boolean(payload.duplicate)
            }
          ]
      });

      if (payload.message) {
        setError(payload.message);
      }

      if (payload.items && payload.items.length > 1) {
        router.push("/library");
        router.refresh();
      } else if (payload.paperId) {
        router.push(`/papers/${payload.paperId}`);
        router.refresh();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "上传失败。");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="upload-panel">
      <form className="upload-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>选择论文 PDF</span>
          <input accept="application/pdf" multiple name="paper" required type="file" />
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
        <h3>真实上传 + 本地处理 pipeline</h3>
        <ul className="clean-list">
          <li>PDF 会保存到本地 `data/papers/raw/`。</li>
          <li>上传前会按 PDF 内容去重，重复论文不会再次进入处理流程。</li>
          <li>一次可以上传多个 PDF，但后台会逐文件提取、逐文件发给 Hermes，不会混发。</li>
          <li>上传成功后立即创建论文记录并异步触发处理。</li>
          <li>处理状态会经历 uploaded / extracting / classifying / summarizing / ready / failed。</li>
        </ul>
      </aside>

      {error ? (
        <div className="result-box error upload-result">
          <p>{error}</p>
        </div>
      ) : null}

      {uploadState ? (
        <div className="result-box success upload-result">
          <p className="section-label">Upload Snapshot</p>
          {uploadState.batchId ? (
            <p>
              <strong>batchId:</strong> {uploadState.batchId}
            </p>
          ) : null}
          <p>
            <strong>状态:</strong> {uploadState.status}
          </p>
          <ul className="clean-list">
            {uploadState.items.map((item) => (
              <li key={`${item.paperId}-${item.fileName}`}>
                {item.fileName} · {item.fileId ?? "legacy"} · {item.duplicate ? "已命中现有论文" : "新论文，已进入流程"}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
