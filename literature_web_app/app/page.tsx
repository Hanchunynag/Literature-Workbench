import Link from "next/link";

import { PaperCard } from "@/components/paper-card";
import { TagPill } from "@/components/tag-pill";
import { listPapers } from "@/lib/db/papers";
import { topicSnapshot } from "@/lib/mock-data";

const collectionSignals = [
  {
    title: "Method-first curation",
    body: "把文献按定位方法、轨道误差建模和多星座观测组织，先突出问题结构，再进入单篇细读。"
  },
  {
    title: "Research-facing language",
    body: "页面更像研究展厅而不是上传后台，强调主题脉络、贡献边界与可延展问题。"
  },
  {
    title: "Fast scanning rhythm",
    body: "首页负责建立全局认知，文献库负责快速切换视角，详情页负责承接深入阅读。"
  }
];

export const dynamic = "force-dynamic";

export default function HomePage() {
  const allPapers = listPapers();
  const recentPapers = allPapers.slice(0, 3);
  const featuredPaper = recentPapers[0] ?? null;
  const stats = {
    paperCount: allPapers.length,
    categoryCount: new Set(
      allPapers.map((paper) => paper.primaryCategory).filter(Boolean)
    ).size,
    tagCount: new Set(allPapers.flatMap((paper) => paper.tags)).size
  };

  return (
    <div className="page-stack">
      <section className="hero-grid">
        <div className="hero-card hero-primary">
          <p className="eyebrow">Curated Research Atlas</p>
          <h1>把 LEO SOP 文献做成一座可浏览的研究展厅。</h1>
          <p className="hero-copy">
            这一版只做网站体验本身：用更清晰的视觉层次，把研究主线、方法分野和代表论文整理成一个适合浏览与阅读的站点。
          </p>

          <div className="hero-actions">
            <Link className="primary-button" href="/upload">
              上传论文
            </Link>
            <Link className="secondary-button" href="/library">
              浏览文献库
            </Link>
            {featuredPaper ? (
              <Link className="secondary-button" href={`/papers/${featuredPaper.id}`}>
                查看精选论文
              </Link>
            ) : null}
          </div>
        </div>

        <div className="hero-card hero-stats">
          <div className="stat-item">
            <strong>{stats.paperCount}</strong>
            <span>最近论文</span>
          </div>
          <div className="stat-item">
            <strong>{stats.categoryCount}</strong>
            <span>一级方向</span>
          </div>
          <div className="stat-item">
            <strong>{stats.tagCount}</strong>
            <span>交叉标签</span>
          </div>
          <div className="hero-note">
            <p className="section-label">Site Direction</p>
            <p>保留网站内上传入口与浏览阅读体验，但不再承载本地脚本管理、分类链路或处理编排。</p>
          </div>
        </div>
      </section>

      <section className="two-column-grid">
        <div className="panel">
          <div className="panel-head">
            <h2>当前研究主题</h2>
            <TagPill tone="strong">Current Topic</TagPill>
          </div>

          <h3>{topicSnapshot.title}</h3>

          <div className="info-columns">
            <div>
              <p className="section-label">当前主线</p>
              <ul className="clean-list">
                {topicSnapshot.currentLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>

            <div>
              <p className="section-label">关键问题</p>
              <ul className="clean-list">
                {topicSnapshot.keyQuestions.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>策展信号</h2>
          </div>
          <div className="feature-grid">
            {collectionSignals.map((signal) => (
              <article key={signal.title} className="feature-card">
                <p className="section-label">{signal.title}</p>
                <p>{signal.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>最近论文</h2>
          <Link className="text-link" href="/library">
            查看全部
          </Link>
        </div>

        <div className="card-grid">
          {recentPapers.map((paper) => (
            <PaperCard key={paper.id} paper={paper} />
          ))}
        </div>
      </section>
    </div>
  );
}
