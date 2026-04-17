export type PaperAnalysisProtocol = {
  protocol_version: "1.0";
  task_type: "paper_analysis";
  batch_id: string;
  file_id: string;
  file_name: string;
  metadata: {
    title: string;
    authors: string[];
    year: number | null;
  };
  extracted_content: {
    abstract: string;
    conclusion_excerpt: string;
    keywords: string[];
  };
  constraints: {
    language: "zh";
    max_main_points: 5;
    max_innovations: 3;
    allow_guessing: false;
  };
};

export function buildPaperAnalysisProtocol(input: {
  batchId: string;
  fileId: string;
  fileName: string;
  title: string;
  authors?: string[];
  year: number | null;
  abstractText?: string;
  conclusionExcerpt?: string;
  keywords?: string[];
}) {
  const protocol: PaperAnalysisProtocol = {
    protocol_version: "1.0",
    task_type: "paper_analysis",
    batch_id: input.batchId,
    file_id: input.fileId,
    file_name: input.fileName,
    metadata: {
      title: input.title,
      authors: (input.authors ?? []).map((author) => author.trim()).filter(Boolean).slice(0, 12),
      year: input.year ?? null
    },
    extracted_content: {
      abstract: input.abstractText?.trim() ?? "",
      conclusion_excerpt: input.conclusionExcerpt?.trim() ?? "",
      keywords: (input.keywords ?? []).slice(0, 12)
    },
    constraints: {
      language: "zh",
      max_main_points: 5,
      max_innovations: 3,
      allow_guessing: false
    }
  };

  return protocol;
}
