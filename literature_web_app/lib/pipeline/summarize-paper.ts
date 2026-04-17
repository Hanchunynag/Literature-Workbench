import type { ClassificationOutput } from "@/lib/agents/classifier-agent";
import { summarizeWithAgent } from "@/lib/agents/summarizer-agent";

export async function summarizePaper(input: {
  paperId: string;
  batchId: string;
  fileId: string;
  fileName: string;
  title: string;
  authors?: string[];
  year: number | null;
  abstractText?: string;
  conclusionExcerpt?: string;
  keywords?: string[];
  extractedText: string;
  classification: ClassificationOutput;
}) {
  return {
    data: await summarizeWithAgent(input),
    source: "agent" as const
  };
}
