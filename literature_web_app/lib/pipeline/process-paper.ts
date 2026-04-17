import {
  clearPaperAnalysis,
  getPaperRecord,
  saveClassification,
  saveExtraction,
  saveSummary,
  updatePaperError,
  updatePaperRecognition,
  updatePaperStatus
} from "@/lib/db/papers";
import { extractPaper } from "@/lib/pipeline/extract-paper";
import { deriveRecognitionState } from "@/lib/pipeline/recognition-state";
import { summarizePaper } from "@/lib/pipeline/summarize-paper";
import { saveAnalysisArtifact } from "@/lib/storage/file-store";

export async function processPaper(paperId: string) {
  const paper = getPaperRecord(paperId);

  if (!paper) {
    throw new Error("Paper not found.");
  }

  clearPaperAnalysis(paperId);
  updatePaperError(paperId, null);
  updatePaperRecognition(paperId, {
    recognitionState: "pending",
    recognitionNote: "等待重新识别。",
    agentProcessed: false
  });

  try {
    updatePaperStatus(paperId, "extracting");
    const extracted = await extractPaper(paper);
    saveExtraction(paperId, {
      title: extracted.title,
      year: extracted.year,
      authors: extracted.authors,
      markdownPath: extracted.markdownPath,
      extractedText: extracted.extractedText
    });

    updatePaperStatus(paperId, "summarizing");
    const summary = await summarizePaper({
      paperId,
      batchId: paper.batchId,
      fileId: paper.fileId,
      fileName: paper.originalFileName,
      title: extracted.title ?? paper.originalFileName,
      authors: extracted.authors,
      year: extracted.year,
      abstractText: extracted.abstractText,
      introductionPreview: extracted.introductionPreview,
      conclusionExcerpt: extracted.conclusionPreview,
      keywords: extracted.keywordsCandidate,
      markdownPath: extracted.markdownPath,
      extractedText: extracted.extractedText
    });
    await saveAnalysisArtifact(paperId, "analysis", summary.data);
    saveSummary(paperId, {
      shortSummary: summary.data.shortSummary,
      coreContribution: summary.data.coreContribution,
      relevanceNote: summary.data.relevanceNote,
      innovationNote: summary.data.innovationNote,
      whatThisPaperDoes: summary.data.whatThisPaperDoes,
      claimedInnovations: summary.data.claimedInnovations,
      usefulToMyTopic: summary.data.usefulToMyTopic,
      limitations: summary.data.limitations,
      candidateIdeas: summary.data.candidateIdeas
    });
    await saveAnalysisArtifact(paperId, "summary", {
      paperId,
      shortSummary: summary.data.shortSummary,
      coreContribution: summary.data.coreContribution,
      relevanceNote: summary.data.relevanceNote,
      innovationNote: summary.data.innovationNote,
      whatThisPaperDoes: summary.data.whatThisPaperDoes,
      claimedInnovations: summary.data.claimedInnovations,
      usefulToMyTopic: summary.data.usefulToMyTopic,
      limitations: summary.data.limitations,
      candidateIdeas: summary.data.candidateIdeas
    });
    saveClassification(paperId, {
      primaryCategory: summary.data.primaryCategory,
      subcategories: summary.data.subcategories,
      tags: summary.data.tags,
      keywords: summary.data.keywords,
      confidence: summary.data.confidence,
      needsReview: summary.data.needsReview
    });
    await saveAnalysisArtifact(paperId, "classification", {
      batchId: summary.data.batchId,
      fileId: summary.data.fileId,
      primaryCategory: summary.data.primaryCategory,
      subcategories: summary.data.subcategories,
      tags: summary.data.tags,
      keywords: summary.data.keywords,
      confidence: summary.data.confidence,
      needsReview: summary.data.needsReview
    });

    const recognition = deriveRecognitionState({
      title: extracted.title ?? paper.originalFileName,
      extractedText: extracted.extractedText,
      shortSummary: summary.data.shortSummary,
      usedAgent: summary.source === "agent"
    });

    updatePaperRecognition(paperId, {
      recognitionState: recognition.recognitionState,
      recognitionNote: recognition.recognitionNote,
      agentProcessed: summary.source === "agent"
    });

    updatePaperStatus(paperId, "ready");
    updatePaperError(paperId, null);
  } catch (error) {
    const message = error instanceof Error ? error.message : "处理失败。";
    updatePaperRecognition(paperId, {
      recognitionState: "needs_review",
      recognitionNote: message,
      agentProcessed: false
    });
    updatePaperStatus(paperId, "failed", { errorMessage: message });
    throw error;
  }
}
