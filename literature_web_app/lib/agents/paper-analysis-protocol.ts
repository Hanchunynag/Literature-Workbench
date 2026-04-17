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
    introduction_preview: string;
    conclusion_excerpt: string;
    keywords: string[];
    markdown_source_path: string | null;
    markdown_total_chars: number;
    markdown_truncated: boolean;
    markdown_content: string;
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
  introductionPreview?: string;
  conclusionExcerpt?: string;
  keywords?: string[];
  markdownPath?: string | null;
  markdownContent?: string;
  markdownTotalChars?: number;
  markdownTruncated?: boolean;
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
      introduction_preview: input.introductionPreview?.trim() ?? "",
      conclusion_excerpt: input.conclusionExcerpt?.trim() ?? "",
      keywords: (input.keywords ?? []).slice(0, 12),
      markdown_source_path: input.markdownPath?.trim() ?? null,
      markdown_total_chars: input.markdownTotalChars ?? 0,
      markdown_truncated: input.markdownTruncated ?? false,
      markdown_content: input.markdownContent?.trim() ?? ""
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

export type PaperClassificationProtocol = {
  protocol_version: "1.0";
  task_type: "paper_classification";
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
    introduction_preview: string;
    conclusion_excerpt: string;
    keywords: string[];
  };
  summary: {
    short_summary: string;
    core_contribution: string;
    innovation_note: string;
    boundary_note: string;
    what_this_paper_does: string[];
    claimed_innovations: string[];
    limitations: string[];
  };
  constraints: {
    language: "zh";
    allow_guessing: false;
  };
};

export function buildPaperClassificationProtocol(input: {
  batchId: string;
  fileId: string;
  fileName: string;
  title: string;
  authors?: string[];
  year: number | null;
  abstractText?: string;
  introductionPreview?: string;
  conclusionExcerpt?: string;
  keywords?: string[];
  summary: {
    shortSummary: string;
    coreContribution: string;
    innovationNote: string;
    relevanceNote: string;
    whatThisPaperDoes: string[];
    claimedInnovations: string[];
    limitations: string[];
  };
}) {
  const protocol: PaperClassificationProtocol = {
    protocol_version: "1.0",
    task_type: "paper_classification",
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
      introduction_preview: input.introductionPreview?.trim() ?? "",
      conclusion_excerpt: input.conclusionExcerpt?.trim() ?? "",
      keywords: (input.keywords ?? []).slice(0, 12)
    },
    summary: {
      short_summary: input.summary.shortSummary,
      core_contribution: input.summary.coreContribution,
      innovation_note: input.summary.innovationNote,
      boundary_note: input.summary.relevanceNote,
      what_this_paper_does: input.summary.whatThisPaperDoes.slice(0, 6),
      claimed_innovations: input.summary.claimedInnovations.slice(0, 6),
      limitations: input.summary.limitations.slice(0, 6)
    },
    constraints: {
      language: "zh",
      allow_guessing: false
    }
  };

  return protocol;
}
