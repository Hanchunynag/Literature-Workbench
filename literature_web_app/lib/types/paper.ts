export const PAPER_STATUSES = [
  "uploaded",
  "extracting",
  "classifying",
  "summarizing",
  "ready",
  "failed"
] as const;

export type PaperStatus = (typeof PAPER_STATUSES)[number];

export const PAPER_RECOGNITION_STATES = [
  "pending",
  "recognized",
  "local_only",
  "needs_review",
  "legacy_unknown"
] as const;

export type PaperRecognitionState = (typeof PAPER_RECOGNITION_STATES)[number];

export type PaperRecord = {
  id: string;
  fileHash: string | null;
  batchId: string;
  fileId: string;
  title: string | null;
  year: number | null;
  authors: string[];
  originalFileName: string;
  storedFileName: string;
  filePath: string;
  topic: string | null;
  note: string | null;
  status: PaperStatus;
  recognitionState: PaperRecognitionState;
  recognitionNote: string | null;
  agentProcessed: boolean;
  extractedText: string | null;
  extractedCharCount: number;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PaperListItem = {
  id: string;
  batchId: string;
  fileId: string;
  title: string;
  year: number | null;
  authors: string[];
  primaryCategory: string | null;
  tags: string[];
  keywords: string[];
  shortSummary: string | null;
  status: PaperStatus;
  recognitionState: PaperRecognitionState;
  agentProcessed: boolean;
  createdAt: string;
};
