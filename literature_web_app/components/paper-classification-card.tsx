import { TagPill } from "@/components/tag-pill";
import type { PaperClassification } from "@/lib/types/classification";

type PaperClassificationCardProps = {
  classification: PaperClassification;
};

export function PaperClassificationCard({
  classification
}: PaperClassificationCardProps) {
  return (
    <article className="panel">
      <div className="panel-head">
        <h2>结构化分类</h2>
        <TagPill tone="strong">{classification.primaryCategory}</TagPill>
      </div>

      <dl className="snapshot-grid">
        <div>
          <dt>置信度</dt>
          <dd>{classification.confidence.toFixed(2)}</dd>
        </div>
        <div>
          <dt>需要人工确认</dt>
          <dd>{classification.needsReview ? "是" : "否"}</dd>
        </div>
        <div>
          <dt>子方向</dt>
          <dd>{classification.subcategories.join(" / ") || "暂无"}</dd>
        </div>
        <div>
          <dt>关键词</dt>
          <dd>{classification.keywords.join(" / ") || "暂无"}</dd>
        </div>
      </dl>

      <div className="tag-row">
        {classification.tags.map((tag) => (
          <TagPill key={tag}>{tag}</TagPill>
        ))}
      </div>
    </article>
  );
}
