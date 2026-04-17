import { z } from "zod";

import { Agent } from "@/lib/agents/sdk";
import { buildAgentModel } from "@/lib/agents/build-model";
import { parseStructuredAgentJson } from "@/lib/agents/json-output";
import { buildPaperAnalysisProtocol } from "@/lib/agents/paper-analysis-protocol";
import { summarizerPrompt, summaryValidatorPrompt } from "@/lib/agents/prompts";
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

function unique(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)));
}

function extractPreferredTerms(input: {
  abstractText?: string;
  conclusionExcerpt?: string;
  keywords?: string[];
}) {
  const corpus = `${input.abstractText ?? ""}\n${input.conclusionExcerpt ?? ""}`;
  const matchedTerms = Array.from(
    corpus.matchAll(/([A-Za-z][A-Za-z0-9\-]+(?: [A-Za-z][A-Za-z0-9\-]+){0,5})\s*\(([A-Z][A-Z0-9\-]{1,10}s?)\)/g)
  ).map((match) => `${match[1]} (${match[2]})`);

  const keywordTerms = (input.keywords ?? []).filter((item) =>
    /[A-Z]{2,}|[A-Za-z]+-[A-Za-z]+|[A-Za-z]{4,}/.test(item)
  );

  return unique([...matchedTerms, ...keywordTerms]).slice(0, 20);
}

function normalizeSummaryTerminology(summary: SummaryOutput, preferredTerms: string[]) {
  const matrixPencilTerm = preferredTerms.find((term) => /matrix pencil/i.test(term));

  if (!matrixPencilTerm) {
    return summary;
  }

  const replaceLiteralTranslation = (value: string) =>
    value.replace(/矩阵铅笔(?:算法)?/g, matrixPencilTerm);

  return {
    ...summary,
    shortSummary: replaceLiteralTranslation(summary.shortSummary),
    coreContribution: replaceLiteralTranslation(summary.coreContribution),
    relevanceNote: replaceLiteralTranslation(summary.relevanceNote),
    innovationNote: replaceLiteralTranslation(summary.innovationNote),
    whatThisPaperDoes: summary.whatThisPaperDoes.map(replaceLiteralTranslation),
    claimedInnovations: summary.claimedInnovations.map(replaceLiteralTranslation),
    usefulToMyTopic: summary.usefulToMyTopic.map(replaceLiteralTranslation),
    limitations: summary.limitations.map(replaceLiteralTranslation),
    candidateIdeas: summary.candidateIdeas.map(replaceLiteralTranslation)
  };
}

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
  const preferredTerms = extractPreferredTerms(input);

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
        requestBody,
        preferredTerms
      }
    });

    try {
      const result = await builtModel.runner.run(
        agent,
        requestBody
      );
      rawOutput = String(result.finalOutput ?? "");

      const draftParsed = parseStructuredAgentJson(
        rawOutput,
        summarySchema,
        "论文信息提炼结果",
        {
          batchId: input.batchId,
          fileId: input.fileId
        }
      );

      const validationAgent = new Agent({
        name: "Paper Summary Validator",
        model: builtModel.model,
        instructions: summaryValidatorPrompt
      });

      const validationPayload = {
        source_protocol: protocolPayload,
        preferred_terms: preferredTerms,
        draft_summary: draftParsed
      };
      const validationRequestBody = JSON.stringify(validationPayload, null, 2);
      const validationResult = await builtModel.runner.run(validationAgent, validationRequestBody);
      const validationRawOutput = String(validationResult.finalOutput ?? "");
      const validatedParsed = normalizeSummaryTerminology(
        parseStructuredAgentJson(
          validationRawOutput,
          summarySchema,
          "论文信息校验结果",
          {
            batchId: input.batchId,
            fileId: input.fileId
          }
        ),
        preferredTerms
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
          instructions: {
            summarizerPrompt,
            summaryValidatorPrompt
          },
          requestPayload: protocolPayload,
          requestBody,
          preferredTerms,
          rawFinalOutput: rawOutput,
          draftParsedOutput: draftParsed,
          validationRequestPayload: validationPayload,
          validationRequestBody,
          validationRawFinalOutput: validationRawOutput,
          parsedOutput: validatedParsed
        }
      });

      return validatedParsed;
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
          instructions: {
            summarizerPrompt,
            summaryValidatorPrompt
          },
          requestPayload: protocolPayload,
          requestBody,
          preferredTerms,
          rawFinalOutput: rawOutput || null,
          errorMessage: error instanceof Error ? error.message : "unknown error"
        }
      });
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("总结失败。");
}
