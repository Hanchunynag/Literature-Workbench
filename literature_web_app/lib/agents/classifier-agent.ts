import { z } from "zod";

import { Agent } from "@/lib/agents/sdk";
import { buildAgentModel } from "@/lib/agents/build-model";
import { parseStructuredAgentJson } from "@/lib/agents/json-output";
import { buildPaperClassificationProtocol } from "@/lib/agents/paper-analysis-protocol";
import {
  classifierPrompt,
  PRIMARY_CATEGORIES,
  SUBCATEGORY_CANDIDATES
} from "@/lib/agents/prompts";
import { saveAgentExchangeArtifact } from "@/lib/storage/file-store";

export const classificationSchema = z.object({
  batchId: z.string(),
  fileId: z.string(),
  primaryCategory: z.enum(PRIMARY_CATEGORIES),
  subcategories: z.array(z.enum(SUBCATEGORY_CANDIDATES)).max(3),
  tags: z.array(z.string()).max(6),
  keywords: z.array(z.string()).max(6),
  confidence: z.number().min(0).max(1),
  needsReview: z.boolean()
});

export type ClassificationOutput = z.infer<typeof classificationSchema>;

export async function classifyWithAgent(input: {
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
  const builtModel = buildAgentModel({
    providerId: process.env.PAPER_CLASSIFIER_PROVIDER?.trim() || "hermes",
    modelName: process.env.PAPER_CLASSIFIER_MODEL
  });

  const agent = new Agent({
    name: "Paper Classifier",
    model: builtModel.model,
    instructions: classifierPrompt
  });

  const protocolPayload = buildPaperClassificationProtocol({
    batchId: input.batchId,
    fileId: input.fileId,
    fileName: input.fileName,
    title: input.title,
    authors: input.authors,
    year: input.year,
    abstractText: input.abstractText,
    introductionPreview: input.introductionPreview,
    conclusionExcerpt: input.conclusionExcerpt,
    keywords: input.keywords,
    summary: input.summary
  });
  const requestBody = JSON.stringify(protocolPayload, null, 2);

  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const attemptNumber = attempt + 1;
    const startedAt = new Date().toISOString();
    let rawOutput = "";

    await saveAgentExchangeArtifact({
      paperId: input.paperId,
      type: "classification",
      attempt: attemptNumber,
      payload: {
        status: "pending",
        phase: "classification",
        attempt: attemptNumber,
        startedAt,
        providerId: builtModel.providerId,
        providerLabel: builtModel.providerLabel,
        model: builtModel.modelName,
        agentName: "Paper Classifier",
        instructions: classifierPrompt,
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
        classificationSchema,
        "分类结果",
        {
          batchId: input.batchId,
          fileId: input.fileId
        }
      );

      await saveAgentExchangeArtifact({
        paperId: input.paperId,
        type: "classification",
        attempt: attemptNumber,
        payload: {
          status: "succeeded",
          phase: "classification",
          attempt: attemptNumber,
          startedAt,
          finishedAt: new Date().toISOString(),
          providerId: builtModel.providerId,
          providerLabel: builtModel.providerLabel,
          model: builtModel.modelName,
          agentName: "Paper Classifier",
          instructions: classifierPrompt,
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
        type: "classification",
        attempt: attemptNumber,
        payload: {
          status: "failed",
          phase: "classification",
          attempt: attemptNumber,
          startedAt,
          finishedAt: new Date().toISOString(),
          providerId: builtModel.providerId,
          providerLabel: builtModel.providerLabel,
          model: builtModel.modelName,
          agentName: "Paper Classifier",
          instructions: classifierPrompt,
          requestPayload: protocolPayload,
          requestBody,
          rawFinalOutput: rawOutput || null,
          errorMessage: error instanceof Error ? error.message : "unknown error"
        }
      });
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("分类失败。");
}
