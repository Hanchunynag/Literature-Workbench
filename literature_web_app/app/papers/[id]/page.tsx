import Link from "next/link";
import { notFound } from "next/navigation";

import { PaperAnalysisCard } from "@/components/paper-analysis-card";
import { PaperClassificationCard } from "@/components/paper-classification-card";
import { PaperStatusBadge } from "@/components/paper-status-badge";
import { PaperSummaryCard } from "@/components/paper-summary-card";
import { TagPill } from "@/components/tag-pill";
import { getPaperDetail } from "@/lib/db/papers";

type PaperDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function PaperDetailPage({ params }: PaperDetailPageProps) {
  const { id } = await params;
  const detail = getPaperDetail(id);

  if (!detail) {
    notFound();
  }

  const { paper, classification, summary, analysis } = detail;

  return (
    <div className="page-stack">
      <Link className="text-link" href="/library">
        返回文献库
      </Link>

      <section className="panel detail-hero">
        <div className="detail-meta-row">
          {classification ? (
            <TagPill tone="strong">{classification.primaryCategory}</TagPill>
          ) : null}
          <PaperStatusBadge status={paper.status} />
          <span className="muted-text">{paper.year ?? "年份待提取"}</span>
        </div>
        <h1>{paper.title ?? paper.originalFileName}</h1>
        <p className="paper-authors">
          {paper.authors.length > 0 ? paper.authors.join(", ") : "作者待提取"}
        </p>
        <p className="detail-summary">
          {summary?.coreContribution ?? "当前仍在处理论文内容，结构化总结完成后会显示在这里。"}
        </p>

        <div className="tag-row">
          {(classification?.subcategories ?? []).map((item) => (
            <TagPill key={item}>{item}</TagPill>
          ))}
        </div>
      </section>

      <section className="detail-grid">
        <article className="panel">
          <h2>Paper Snapshot</h2>
          <dl className="snapshot-grid">
            <div>
              <dt>原始文件</dt>
              <dd>{paper.originalFileName}</dd>
            </div>
            <div>
              <dt>Batch 编号</dt>
              <dd>{paper.batchId}</dd>
            </div>
            <div>
              <dt>研究专题</dt>
              <dd>{paper.topic ?? "未填写"}</dd>
            </div>
            <div>
              <dt>备注</dt>
              <dd>{paper.note ?? "无"}</dd>
            </div>
            <div>
              <dt>提取字符数</dt>
              <dd>{paper.extractedCharCount}</dd>
            </div>
            <div>
              <dt>Markdown 文件</dt>
              <dd>{paper.markdownPath ?? "尚未生成"}</dd>
            </div>
          </dl>
        </article>

        {analysis ? <PaperAnalysisCard analysis={analysis} /> : null}

        {classification ? <PaperClassificationCard classification={classification} /> : null}

        {summary ? <PaperSummaryCard summary={summary} /> : null}

        {analysis ? (
          <article className="panel">
            <h2>原始结构化 JSON</h2>
            <pre>{JSON.stringify(analysis, null, 2)}</pre>
          </article>
        ) : null}

        {paper.status !== "ready" ? (
          <article className="panel">
            <h2>处理状态</h2>
            <p>当前状态：{paper.status}</p>
            {paper.errorMessage ? <p>错误信息：{paper.errorMessage}</p> : null}
            <p>上传后后台会依次执行提取，以及基于 markdown 的单次详细分析与受约束分类。刷新页面即可查看最新结果。</p>
          </article>
        ) : null}
      </section>
    </div>
  );
}
