import { PaperCard } from "@/components/paper-card";
import { papers } from "@/lib/mock-data";

type LibraryPageProps = {
  searchParams?: Promise<{
    q?: string;
    category?: string;
  }>;
};

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const query = resolvedSearchParams.q?.trim().toLowerCase() ?? "";
  const category = resolvedSearchParams.category?.trim() ?? "";
  const featuredTags = Array.from(new Set(papers.flatMap((paper) => paper.tags))).slice(0, 8);

  const categories = Array.from(
    new Set(papers.map((paper) => paper.primaryCategory))
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
            <p className="muted-text">按标题、标签、关键词和一级方向切换阅读视角。</p>
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

      <section className="card-grid">
        {filteredPapers.length > 0 ? (
          filteredPapers.map((paper) => <PaperCard key={paper.id} paper={paper} />)
        ) : (
          <div className="empty-state">
            <h2>没有匹配结果</h2>
            <p>可以换一个关键词，或者先回到全部方向重新浏览。</p>
          </div>
        )}
      </section>
    </div>
  );
}
