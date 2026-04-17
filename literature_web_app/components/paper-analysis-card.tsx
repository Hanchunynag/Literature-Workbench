import type { PaperAnalysis } from "@/lib/types/analysis";

type PaperAnalysisCardProps = {
  analysis: PaperAnalysis;
};

export function PaperAnalysisCard({ analysis }: PaperAnalysisCardProps) {
  return (
    <>
      <article className="panel">
        <h2>研究问题</h2>
        <p>{analysis.researchQuestion}</p>
      </article>

      <article className="panel">
        <h2>核心方法</h2>
        <p>{analysis.coreMethod}</p>
      </article>

      <article className="panel">
        <h2>实验方法</h2>
        <p>{analysis.experimentalMethodology}</p>
      </article>

      <article className="panel">
        <h2>性能指标</h2>
        <ul className="clean-list">
          {analysis.performanceMetrics.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </article>
    </>
  );
}
