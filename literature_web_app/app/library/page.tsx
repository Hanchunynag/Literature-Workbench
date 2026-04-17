import { LibraryMaintenancePanel } from "@/components/library-maintenance-panel";
import { PaperStatusBadge } from "@/components/paper-status-badge";
import { PaperCard } from "@/components/paper-card";
import { listPapers } from "@/lib/db/papers";

type LibraryPageProps = {
  searchParams?: Promise<{
    q?: string;
    category?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const query = resolvedSearchParams.q?.trim().toLowerCase() ?? "";
  const category = resolvedSearchParams.category?.trim() ?? "";
  const papers = listPapers();
  const featuredTags = Array.from(
    new Set(papers.flatMap((paper) => [...paper.tags, ...paper.keywords]))
  ).slice(0, 8);

  const categories = Array.from(
    new Set(papers.map((paper) => paper.primaryCategory).filter(Boolean))
  );

  const filteredPapers = papers.filter((paper) => {
    const matchesQuery =
      !query ||
      paper.title.toLowerCase().includes(query) ||
      paper.tags.some((tag) => tag.toLowerCase().includes(query)) ||
      paper.keywords.some((keyword) => keyword.toLowerCase().includes(query));

    const matchesCategory = !category || paper.primaryCategory === category;

    return matchesQuery && matchesCategory;
  });

  return (
    <div className="page-stack">
      <section className="panel library-hero">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Curated Library</p>
            <h1>文献库</h1>
            <p className="muted-text">
              真实数据库结果会显示在这里，上传后的论文会从 uploaded 逐步进入 ready。
            </p>
          </div>
          <div className="library-summary">
            <strong>{filteredPapers.length}</strong>
            <span>篇匹配论文</span>
          </div>
        </div>

        <div className="tag-row">
          {featuredTags.map((tag) => (
            <span key={tag} className="tag-pill">
              {tag}
            </span>
          ))}
          <PaperStatusBadge status="ready" />
          <PaperStatusBadge status="failed" />
        </div>

        <form className="filters-grid" method="get">
          <label className="field">
            <span>搜索标题 / 标签 / 关键词</span>
            <input defaultValue={query} name="q" placeholder="例如：Iridium / Doppler / HVCE" />
          </label>

          <label className="field">
            <span>大类</span>
            <select defaultValue={category} name="category">
              <option value="">全部方向</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <button className="primary-button compact-button" type="submit">
            筛选
          </button>
        </form>
      </section>

      <LibraryMaintenancePanel />

      <section className="card-grid">
        {filteredPapers.length > 0 ? (
          filteredPapers.map((paper) => <PaperCard key={paper.id} paper={paper} />)
        ) : (
          <div className="empty-state">
            <h2>没有匹配结果</h2>
            <p>如果你刚上传了论文，可以稍后刷新，或者回到上传页继续添加新 PDF。</p>
          </div>
        )}
      </section>
    </div>
  );
}
