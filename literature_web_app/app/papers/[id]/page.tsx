import Link from "next/link";
import { notFound } from "next/navigation";

import { TagPill } from "@/components/tag-pill";
import { getPaperById } from "@/lib/mock-data";

type PaperDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PaperDetailPage({ params }: PaperDetailPageProps) {
  const { id } = await params;
  const paper = getPaperById(id);

  if (!paper) {
    notFound();
  }

  return (
    <div className="page-stack">
      <Link className="text-link" href="/library">
        返回文献库
      </Link>

      <section className="panel detail-hero">
        <div className="detail-meta-row">
          <TagPill tone="strong">{paper.primaryCategory}</TagPill>
          <span className="muted-text">{paper.year}</span>
        </div>
        <h1>{paper.title}</h1>
        <p className="paper-authors">{paper.authors.join(", ")}</p>
        <p className="detail-summary">{paper.coreContribution}</p>

        <div className="tag-row">
          {paper.subcategories.map((item) => (
            <TagPill key={item}>{item}</TagPill>
          ))}
        </div>
      </section>

      <section className="detail-grid">
        <article className="panel">
          <h2>Paper Snapshot</h2>
          <dl className="snapshot-grid">
            <div>
              <dt>关键词</dt>
              <dd>{paper.keywords.join(" / ")}</dd>
            </div>
            <div>
              <dt>适用性判断</dt>
              <dd>{paper.relevanceNote}</dd>
            </div>
            <div>
              <dt>创新性判断</dt>
              <dd>{paper.innovationNote}</dd>
            </div>
          </dl>
        </article>

        <article className="panel">
          <h2>论文在做什么</h2>
          <ul className="clean-list">
            {paper.whatThisPaperDoes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <h2>论文声称的创新点</h2>
          <ul className="clean-list">
            {paper.claimedInnovations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <h2>对当前研究的启发</h2>
          <ul className="clean-list">
            {paper.usefulToMyTopic.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <h2>局限与边界</h2>
          <ul className="clean-list">
            {paper.limitations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <h2>可延展设想</h2>
          <ul className="clean-list">
            {paper.candidateIdeas.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
