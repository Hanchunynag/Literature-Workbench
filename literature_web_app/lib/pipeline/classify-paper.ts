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
  conclusionExcerpt?: string;
  keywords?: string[];
  extractedText: string;
}) {
  return {
    data: await classifyWithAgent(input),
    source: "agent" as const
  };
}
