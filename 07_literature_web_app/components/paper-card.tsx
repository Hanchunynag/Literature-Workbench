import Link from "next/link";

import { TagPill } from "@/components/tag-pill";
import { Paper } from "@/lib/types";

type PaperCardProps = {
  paper: Paper;
};

export function PaperCard({ paper }: PaperCardProps) {
  return (
    <article className="paper-card">
      <div className="paper-card-top">
        <TagPill tone="strong">{paper.primaryCategory}</TagPill>
        <span className="paper-year">{paper.year}</span>
      </div>

      <h3>
        <Link href={`/papers/${paper.id}`}>{paper.title}</Link>
      </h3>

      <p className="paper-authors">{paper.authors.join(", ")}</p>
      <p className="paper-summary">{paper.coreContribution}</p>

      <div className="tag-row">
        {paper.tags.slice(0, 4).map((tag) => (
          <TagPill key={tag}>{tag}</TagPill>
        ))}
      </div>
    </article>
  );
}
