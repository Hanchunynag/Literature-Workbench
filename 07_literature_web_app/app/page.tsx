import Link from "next/link";

import { PaperCard } from "@/components/paper-card";
import { TagPill } from "@/components/tag-pill";
import { getLibraryStats, papers, topicSnapshot } from "@/lib/mock-data";

export default function HomePage() {
  const stats = getLibraryStats();
  const recentPapers = papers.slice(0, 3);

  return (
    <div className="page-stack">
      <section className="hero-grid">
        <div className="hero-card hero-primary">
          <p className="eyebrow">Personal research cockpit</p>
          <h1>上传即处理，不再等固定时间批量跑脚本。</h1>
          <p className="hero-copy">
            这版骨架已经把网站的核心形态搭出来了：文献库、详情页、上传入口和后续可接的处理链路。
          </p>

          <div className="hero-actions">
            <Link className="primary-button" href="/upload">
              上传新论文
            </Link>
            <Link className="secondary-button" href="/library">
              查看文献库
            </Link>
          </div>
        </div>

        <div className="hero-card hero-stats">
          <div className="stat-item">
            <strong>{stats.paperCount}</strong>
            <span>已挂载示例论文</span>
          </div>
          <div className="stat-item">
            <strong>{stats.categoryCount}</strong>
            <span>一级方向</span>
          </div>
          <div className="stat-item">
            <strong>{stats.tagCount}</strong>
            <span>交叉标签</span>
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
            <h2>你接下来要接的真实能力</h2>
          </div>
          <ul className="clean-list">
            <li>对象存储: 保存 PDF 原件</li>
            <li>数据库: 存论文、分类、标签、笔记</li>
            <li>异步任务: 上传后立即提取和查重</li>
            <li>处理服务: 接你现有 PDF 提取逻辑</li>
          </ul>
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
