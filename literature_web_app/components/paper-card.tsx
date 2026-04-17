import Link from "next/link";

import { PaperRecognitionBadge } from "@/components/paper-recognition-badge";
import { PaperStatusBadge } from "@/components/paper-status-badge";
import { TagPill } from "@/components/tag-pill";
import type { PaperListItem } from "@/lib/types/paper";

type PaperCardProps = {
  paper: PaperListItem;
};

export function PaperCard({ paper }: PaperCardProps) {
  return (
    <article className="paper-card">
      <div className="paper-card-top">
        {paper.primaryCategory ? (
          <TagPill tone="strong">{paper.primaryCategory}</TagPill>
        ) : (
          <PaperStatusBadge status={paper.status} />
        )}
        <span className="paper-year">{paper.year ?? "年份待提取"}</span>
      </div>

      <h3>
        <Link href={`/papers/${paper.id}`}>{paper.title}</Link>
      </h3>

      <p className="paper-authors">
        {paper.authors.length > 0 ? paper.authors.join(", ") : "作者待提取"}
      </p>
      <p className="paper-summary">
        {paper.shortSummary ?? "处理中，准备生成结构化总结。"}
      </p>

      <div className="tag-row">
        <PaperRecognitionBadge
          recognitionState={paper.recognitionState}
          status={paper.status}
        />
        {paper.tags.slice(0, 4).map((tag) => (
          <TagPill key={tag}>{tag}</TagPill>
        ))}
        <PaperStatusBadge status={paper.status} />
      </div>
    </article>
  );
}
