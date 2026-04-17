import { z } from "zod";

import { Agent } from "@/lib/agents/sdk";
import { buildAgentModel } from "@/lib/agents/build-model";
import { parseStructuredAgentJson } from "@/lib/agents/json-output";
import { buildPaperAnalysisProtocol } from "@/lib/agents/paper-analysis-protocol";
import { summarizerPrompt } from "@/lib/agents/prompts";
import { saveAgentExchangeArtifact } from "@/lib/storage/file-store";

export const summarySchema = z.object({
  batchId: z.string(),
  fileId: z.string(),
  shortSummary: z.string(),
  coreContribution: z.string(),
  relevanceNote: z.string(),
  innovationNote: z.string(),
  whatThisPaperDoes: z.array(z.string()).min(2).max(5),
  claimedInnovations: z.array(z.string()).min(1).max(4),
  usefulToMyTopic: z.array(z.string()).min(1).max(4),
  limitations: z.array(z.string()).min(1).max(4),
  candidateIdeas: z.array(z.string()).max(3)
});

export type SummaryOutput = z.infer<typeof summarySchema>;

export async function summarizeWithAgent(input: {
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
  const builtModel = buildAgentModel({
    providerId: process.env.PAPER_SUMMARIZER_PROVIDER?.trim() || "hermes",
    modelName: process.env.PAPER_SUMMARIZER_MODEL
  });

  const agent = new Agent({
    name: "Paper Summarizer",
    model: builtModel.model,
    instructions: summarizerPrompt
  });

  const protocolPayload = buildPaperAnalysisProtocol({
    batchId: input.batchId,
    fileId: input.fileId,
    fileName: input.fileName,
    title: input.title,
    authors: input.authors,
    year: input.year,
    abstractText: input.abstractText,
    conclusionExcerpt: input.conclusionExcerpt,
    keywords: input.keywords
  });
  const requestBody = JSON.stringify(protocolPayload, null, 2);

  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const attemptNumber = attempt + 1;
    const startedAt = new Date().toISOString();
    let rawOutput = "";

    await saveAgentExchangeArtifact({
      paperId: input.paperId,
      type: "summary",
      attempt: attemptNumber,
      payload: {
        status: "pending",
        phase: "summary",
        attempt: attemptNumber,
        startedAt,
        providerId: builtModel.providerId,
        providerLabel: builtModel.providerLabel,
        model: builtModel.modelName,
        agentName: "Paper Summarizer",
        instructions: summarizerPrompt,
        requestPayload: protocolPayload,
        requestBody
      }
    });

    try {
      const result = await builtModel.runner.run(
        agent,
        requestBody
      );
      rawOutput = String(result.finalOutput ?? "");

      const parsed = parseStructuredAgentJson(
        rawOutput,
        summarySchema,
        "总结结果",
        {
          batchId: input.batchId,
          fileId: input.fileId
        }
      );

      await saveAgentExchangeArtifact({
        paperId: input.paperId,
        type: "summary",
        attempt: attemptNumber,
        payload: {
          status: "succeeded",
          phase: "summary",
          attempt: attemptNumber,
          startedAt,
          finishedAt: new Date().toISOString(),
          providerId: builtModel.providerId,
          providerLabel: builtModel.providerLabel,
          model: builtModel.modelName,
          agentName: "Paper Summarizer",
          instructions: summarizerPrompt,
          requestPayload: protocolPayload,
          requestBody,
          rawFinalOutput: rawOutput,
          parsedOutput: parsed
        }
      });

      return parsed;
    } catch (error) {
      await saveAgentExchangeArtifact({
        paperId: input.paperId,
        type: "summary",
        attempt: attemptNumber,
        payload: {
          status: "failed",
          phase: "summary",
          attempt: attemptNumber,
          startedAt,
          finishedAt: new Date().toISOString(),
          providerId: builtModel.providerId,
          providerLabel: builtModel.providerLabel,
          model: builtModel.modelName,
          agentName: "Paper Summarizer",
          instructions: summarizerPrompt,
          requestPayload: protocolPayload,
          requestBody,
          rawFinalOutput: rawOutput || null,
          errorMessage: error instanceof Error ? error.message : "unknown error"
        }
      });
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("总结失败。");
}
