import { classifyWithAgent } from "@/lib/agents/classifier-agent";

export async function classifyPaper(input: {
  paperId: string;
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
  return {
    data: await classifyWithAgent(input),
    source: "agent" as const
  };
}
