import type { PaperSummary } from "@/lib/types/summary";

type PaperSummaryCardProps = {
  summary: PaperSummary;
};

export function PaperSummaryCard({ summary }: PaperSummaryCardProps) {
  return (
    <>
      <article className="panel">
        <h2>论文摘要</h2>
        <p className="detail-summary">{summary.shortSummary}</p>
      </article>

      <article className="panel">
        <h2>核心贡献</h2>
        <p>{summary.coreContribution}</p>
      </article>

      <article className="panel">
        <h2>适用性判断</h2>
        <p>{summary.relevanceNote}</p>
      </article>

      <article className="panel">
        <h2>创新性判断</h2>
        <p>{summary.innovationNote}</p>
      </article>

      <article className="panel">
        <h2>论文在做什么</h2>
        <ul className="clean-list">
          {summary.whatThisPaperDoes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </article>

      <article className="panel">
        <h2>论文声称的创新点</h2>
        <ul className="clean-list">
          {summary.claimedInnovations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </article>

      <article className="panel">
        <h2>对当前研究的启发</h2>
        <ul className="clean-list">
          {summary.usefulToMyTopic.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </article>

      <article className="panel">
        <h2>局限与边界</h2>
        <ul className="clean-list">
          {summary.limitations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </article>

      <article className="panel">
        <h2>可延展设想</h2>
        <ul className="clean-list">
          {summary.candidateIdeas.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </article>
    </>
  );
}
