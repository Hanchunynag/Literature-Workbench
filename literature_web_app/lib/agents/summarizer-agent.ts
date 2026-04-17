import { readFile } from "fs/promises";

import { z } from "zod";

import { Agent } from "@/lib/agents/sdk";
import { buildAgentModel } from "@/lib/agents/build-model";
import { parseStructuredAgentJson } from "@/lib/agents/json-output";
import { buildPaperAnalysisProtocol } from "@/lib/agents/paper-analysis-protocol";
import {
  PRIMARY_CATEGORIES,
  SUBCATEGORY_CANDIDATES,
  summarizerPrompt,
  summaryValidatorPrompt
} from "@/lib/agents/prompts";
import { saveAgentExchangeArtifact } from "@/lib/storage/file-store";

export const analysisSchema = z.object({
  batchId: z.string(),
  fileId: z.string(),
  title: z.string(),
  researchQuestion: z.string(),
  coreMethod: z.string(),
  shortSummary: z.string(),
  coreContribution: z.string(),
  relevanceNote: z.string(),
  innovationNote: z.string(),
  whatThisPaperDoes: z.array(z.string()).min(2).max(6),
  claimedInnovations: z.array(z.string()).min(1).max(5),
  usefulToMyTopic: z.array(z.string()).min(1).max(5),
  limitations: z.array(z.string()).min(1).max(5),
  candidateIdeas: z.array(z.string()).max(5),
  experimentalMethodology: z.string(),
  performanceMetrics: z.array(z.string()).max(5),
  primaryCategory: z.enum(PRIMARY_CATEGORIES),
  subcategories: z.array(z.enum(SUBCATEGORY_CANDIDATES)).max(3),
  tags: z.array(z.string()).max(6),
  keywords: z.array(z.string()).max(6),
  confidence: z.number().min(0).max(1),
  needsReview: z.boolean()
});

export type PaperAnalysisOutput = z.infer<typeof analysisSchema>;

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

  return unique([...matchedTerms, ...keywordTerms]).slice(0, 24);
}

function normalizeAnalysisTerminology(
  analysis: PaperAnalysisOutput,
  preferredTerms: string[]
) {
  const matrixPencilTerm = preferredTerms.find((term) => /matrix pencil/i.test(term));

  if (!matrixPencilTerm) {
    return analysis;
  }

  const replaceLiteralTranslation = (value: string) =>
    value.replace(/矩阵铅笔(?:算法)?/g, matrixPencilTerm);

  return {
    ...analysis,
    title: replaceLiteralTranslation(analysis.title),
    researchQuestion: replaceLiteralTranslation(analysis.researchQuestion),
    coreMethod: replaceLiteralTranslation(analysis.coreMethod),
    shortSummary: replaceLiteralTranslation(analysis.shortSummary),
    coreContribution: replaceLiteralTranslation(analysis.coreContribution),
    relevanceNote: replaceLiteralTranslation(analysis.relevanceNote),
    innovationNote: replaceLiteralTranslation(analysis.innovationNote),
    experimentalMethodology: replaceLiteralTranslation(analysis.experimentalMethodology),
    whatThisPaperDoes: analysis.whatThisPaperDoes.map(replaceLiteralTranslation),
    claimedInnovations: analysis.claimedInnovations.map(replaceLiteralTranslation),
    usefulToMyTopic: analysis.usefulToMyTopic.map(replaceLiteralTranslation),
    limitations: analysis.limitations.map(replaceLiteralTranslation),
    candidateIdeas: analysis.candidateIdeas.map(replaceLiteralTranslation),
    performanceMetrics: analysis.performanceMetrics.map(replaceLiteralTranslation),
    tags: analysis.tags.map(replaceLiteralTranslation),
    keywords: analysis.keywords.map(replaceLiteralTranslation)
  };
}

const DEFAULT_MAX_MARKDOWN_CHARS = 120_000;

function getMaxMarkdownChars() {
  const configured = Number(process.env.PAPER_MARKDOWN_MAX_CHARS ?? "");

  if (Number.isFinite(configured) && configured >= 10_000) {
    return Math.floor(configured);
  }

  return DEFAULT_MAX_MARKDOWN_CHARS;
}

async function loadMarkdownContext(markdownPath: string | null | undefined, extractedText: string) {
  if (!markdownPath) {
    return {
      markdownPath: null,
      markdownContent: extractedText,
      markdownTotalChars: extractedText.length,
      markdownTruncated: false
    };
  }

  try {
    const markdownContent = await readFile(markdownPath, "utf-8");
    const maxChars = getMaxMarkdownChars();

    return {
      markdownPath,
      markdownContent: markdownContent.slice(0, maxChars),
      markdownTotalChars: markdownContent.length,
      markdownTruncated: markdownContent.length > maxChars
    };
  } catch {
    return {
      markdownPath,
      markdownContent: extractedText,
      markdownTotalChars: extractedText.length,
      markdownTruncated: false
    };
  }
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
  introductionPreview?: string;
  conclusionExcerpt?: string;
  keywords?: string[];
  markdownPath?: string | null;
  extractedText: string;
}) {
  const builtModel = buildAgentModel({
    providerId: process.env.PAPER_SUMMARIZER_PROVIDER?.trim() || "hermes",
    modelName: process.env.PAPER_SUMMARIZER_MODEL
  });

  const agent = new Agent({
    name: "Paper Analyzer",
    model: builtModel.model,
    instructions: summarizerPrompt
  });

  const markdownContext = await loadMarkdownContext(input.markdownPath, input.extractedText);

  const protocolPayload = buildPaperAnalysisProtocol({
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
    markdownPath: markdownContext.markdownPath,
    markdownContent: markdownContext.markdownContent,
    markdownTotalChars: markdownContext.markdownTotalChars,
    markdownTruncated: markdownContext.markdownTruncated
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
      type: "analysis",
      attempt: attemptNumber,
      payload: {
        status: "pending",
        phase: "analysis",
        attempt: attemptNumber,
        startedAt,
        providerId: builtModel.providerId,
        providerLabel: builtModel.providerLabel,
        model: builtModel.modelName,
        agentName: "Paper Analyzer",
        instructions: summarizerPrompt,
        requestPayload: protocolPayload,
        requestBody,
        preferredTerms
      }
    });

    try {
      const result = await builtModel.runner.run(agent, requestBody);
      rawOutput = String(result.finalOutput ?? "");

      const draftParsed = parseStructuredAgentJson(
        rawOutput,
        analysisSchema,
        "论文分析结果",
        {
          batchId: input.batchId,
          fileId: input.fileId
        }
      );

      const validationAgent = new Agent({
        name: "Paper Analysis Validator",
        model: builtModel.model,
        instructions: summaryValidatorPrompt
      });

      const validationPayload = {
        source_protocol: protocolPayload,
        preferred_terms: preferredTerms,
        draft_analysis: draftParsed
      };
      const validationRequestBody = JSON.stringify(validationPayload, null, 2);
      const validationResult = await builtModel.runner.run(validationAgent, validationRequestBody);
      const validationRawOutput = String(validationResult.finalOutput ?? "");
      const validatedParsed = normalizeAnalysisTerminology(
        parseStructuredAgentJson(
          validationRawOutput,
          analysisSchema,
          "论文分析校验结果",
          {
            batchId: input.batchId,
            fileId: input.fileId
          }
        ),
        preferredTerms
      );

      await saveAgentExchangeArtifact({
        paperId: input.paperId,
        type: "analysis",
        attempt: attemptNumber,
        payload: {
          status: "succeeded",
          phase: "analysis",
          attempt: attemptNumber,
          startedAt,
          finishedAt: new Date().toISOString(),
          providerId: builtModel.providerId,
          providerLabel: builtModel.providerLabel,
          model: builtModel.modelName,
          agentName: "Paper Analyzer",
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
        type: "analysis",
        attempt: attemptNumber,
        payload: {
          status: "failed",
          phase: "analysis",
          attempt: attemptNumber,
          startedAt,
          finishedAt: new Date().toISOString(),
          providerId: builtModel.providerId,
          providerLabel: builtModel.providerLabel,
          model: builtModel.modelName,
          agentName: "Paper Analyzer",
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

  throw lastError instanceof Error ? lastError : new Error("论文分析失败。");
}
