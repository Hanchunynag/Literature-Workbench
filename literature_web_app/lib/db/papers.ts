import { randomUUID } from "crypto";

import { getDb } from "@/lib/db/client";
import { ensureSchema } from "@/lib/db/schema";
import { readAnalysisArtifactSync } from "@/lib/storage/file-store";
import type { PaperAnalysis } from "@/lib/types/analysis";
import type { PaperClassification } from "@/lib/types/classification";
import type {
  PaperRecognitionState,
  PaperRecord,
  PaperListItem,
  PaperStatus
} from "@/lib/types/paper";
import type { PaperSummary } from "@/lib/types/summary";

type PaperRow = {
  id: string;
  file_hash: string | null;
  batch_id: string;
  file_id: string;
  title: string | null;
  year: number | null;
  authors_json: string;
  original_file_name: string;
  stored_file_name: string;
  file_path: string;
  topic: string | null;
  note: string | null;
  status: PaperStatus;
  recognition_state: PaperRecognitionState;
  recognition_note: string | null;
  agent_processed: number;
  markdown_path: string | null;
  extracted_text: string | null;
  extracted_char_count: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

type ClassificationRow = {
  paper_id: string;
  primary_category: string;
  subcategories_json: string;
  tags_json: string;
  keywords_json: string;
  confidence: number;
  needs_review: number;
  created_at: string;
  updated_at: string;
};

type SummaryRow = {
  paper_id: string;
  short_summary: string;
  core_contribution: string;
  relevance_note: string;
  innovation_note: string;
  what_this_paper_does_json: string;
  claimed_innovations_json: string;
  useful_to_my_topic_json: string;
  limitations_json: string;
  candidate_ideas_json: string;
  created_at: string;
  updated_at: string;
};

function now() {
  return new Date().toISOString();
}

function parseJsonArray(value: string | null | undefined) {
  if (!value) {
    return [] as string[];
  }

  try {
    return JSON.parse(value) as string[];
  } catch {
    return [];
  }
}

function mapPaper(row: PaperRow): PaperRecord {
  return {
    id: row.id,
    fileHash: row.file_hash,
    batchId: row.batch_id,
    fileId: row.file_id,
    title: row.title,
    year: row.year,
    authors: parseJsonArray(row.authors_json),
    originalFileName: row.original_file_name,
    storedFileName: row.stored_file_name,
    filePath: row.file_path,
    topic: row.topic,
    note: row.note,
    status: row.status,
    recognitionState: row.recognition_state,
    recognitionNote: row.recognition_note,
    agentProcessed: Boolean(row.agent_processed),
    markdownPath: row.markdown_path,
    extractedText: row.extracted_text,
    extractedCharCount: row.extracted_char_count,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapClassification(row: ClassificationRow | undefined | null): PaperClassification | null {
  if (!row) {
    return null;
  }

  return {
    paperId: row.paper_id,
    primaryCategory: row.primary_category,
    subcategories: parseJsonArray(row.subcategories_json),
    tags: parseJsonArray(row.tags_json),
    keywords: parseJsonArray(row.keywords_json),
    confidence: row.confidence,
    needsReview: Boolean(row.needs_review),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapSummary(row: SummaryRow | undefined | null): PaperSummary | null {
  if (!row) {
    return null;
  }

  return {
    paperId: row.paper_id,
    shortSummary: row.short_summary,
    coreContribution: row.core_contribution,
    relevanceNote: row.relevance_note,
    innovationNote: row.innovation_note,
    whatThisPaperDoes: parseJsonArray(row.what_this_paper_does_json),
    claimedInnovations: parseJsonArray(row.claimed_innovations_json),
    usefulToMyTopic: parseJsonArray(row.useful_to_my_topic_json),
    limitations: parseJsonArray(row.limitations_json),
    candidateIdeas: parseJsonArray(row.candidate_ideas_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function createPaper(input: {
  id?: string;
  fileHash?: string | null;
  batchId: string;
  fileId: string;
  originalFileName: string;
  storedFileName: string;
  filePath: string;
  topic?: string;
  note?: string;
}) {
  ensureSchema();
  const db = getDb();
  const id = input.id ?? randomUUID();
  const timestamp = now();

  db.prepare(
    `
      INSERT INTO papers (
        id, file_hash, batch_id, file_id, title, year, authors_json, original_file_name, stored_file_name, file_path,
        topic, note, status, recognition_state, recognition_note, agent_processed, markdown_path,
        extracted_text, extracted_char_count, error_message, created_at, updated_at
      ) VALUES (
        @id, @fileHash, @batchId, @fileId, NULL, NULL, '[]', @originalFileName, @storedFileName, @filePath,
        @topic, @note, 'uploaded', 'pending', NULL, 0, NULL, NULL, 0, NULL, @createdAt, @updatedAt
      )
    `
  ).run({
    id,
    fileHash: input.fileHash ?? null,
    batchId: input.batchId,
    fileId: input.fileId,
    originalFileName: input.originalFileName,
    storedFileName: input.storedFileName,
    filePath: input.filePath,
    topic: input.topic ?? null,
    note: input.note ?? null,
    createdAt: timestamp,
    updatedAt: timestamp
  });

  return id;
}

export function findPaperByFileHash(fileHash: string) {
  ensureSchema();
  const db = getDb();
  const row = db.prepare(`SELECT * FROM papers WHERE file_hash = ?`).get(fileHash) as PaperRow | undefined;
  return row ? mapPaper(row) : null;
}

export function updatePaperFileHash(paperId: string, fileHash: string) {
  ensureSchema();
  const db = getDb();
  db.prepare(
    `
      UPDATE papers
      SET file_hash = @fileHash,
          updated_at = @updatedAt
      WHERE id = @paperId
    `
  ).run({
    paperId,
    fileHash,
    updatedAt: now()
  });
}

export function listPaperFilesMissingHash() {
  ensureSchema();
  const db = getDb();
  return db
    .prepare(`SELECT id, file_path FROM papers WHERE file_hash IS NULL OR file_hash = ''`)
    .all() as Array<{ id: string; file_path: string }>;
}

export function updatePaperStatus(
  paperId: string,
  status: PaperStatus,
  options?: { errorMessage?: string | null }
) {
  ensureSchema();
  const db = getDb();

  db.prepare(
    `
      UPDATE papers
      SET status = @status,
          error_message = @errorMessage,
          updated_at = @updatedAt
      WHERE id = @paperId
    `
  ).run({
    paperId,
    status,
    errorMessage: options?.errorMessage ?? null,
    updatedAt: now()
  });
}

export function updatePaperRecognition(
  paperId: string,
  payload: {
    recognitionState: PaperRecognitionState;
    recognitionNote?: string | null;
    agentProcessed: boolean;
  }
) {
  ensureSchema();
  const db = getDb();

  db.prepare(
    `
      UPDATE papers
      SET recognition_state = @recognitionState,
          recognition_note = @recognitionNote,
          agent_processed = @agentProcessed,
          updated_at = @updatedAt
      WHERE id = @paperId
    `
  ).run({
    paperId,
    recognitionState: payload.recognitionState,
    recognitionNote: payload.recognitionNote ?? null,
    agentProcessed: payload.agentProcessed ? 1 : 0,
    updatedAt: now()
  });
}

export function saveExtraction(
  paperId: string,
  payload: {
    title: string | null;
    year: number | null;
    authors: string[];
    markdownPath?: string | null;
    extractedText: string;
  }
) {
  ensureSchema();
  const db = getDb();

  db.prepare(
    `
      UPDATE papers
      SET title = @title,
          year = @year,
          authors_json = @authorsJson,
          markdown_path = @markdownPath,
          extracted_text = @extractedText,
          extracted_char_count = @extractedCharCount,
          updated_at = @updatedAt
      WHERE id = @paperId
    `
  ).run({
    paperId,
    title: payload.title,
    year: payload.year,
    authorsJson: JSON.stringify(payload.authors),
    markdownPath: payload.markdownPath ?? null,
    extractedText: payload.extractedText,
    extractedCharCount: payload.extractedText.length,
    updatedAt: now()
  });
}

export function saveClassification(paperId: string, classification: Omit<PaperClassification, "paperId" | "createdAt" | "updatedAt">) {
  ensureSchema();
  const db = getDb();
  const timestamp = now();

  db.prepare(
    `
      INSERT INTO paper_classifications (
        paper_id, primary_category, subcategories_json, tags_json, keywords_json,
        confidence, needs_review, created_at, updated_at
      ) VALUES (
        @paperId, @primaryCategory, @subcategoriesJson, @tagsJson, @keywordsJson,
        @confidence, @needsReview, @createdAt, @updatedAt
      )
      ON CONFLICT(paper_id) DO UPDATE SET
        primary_category = excluded.primary_category,
        subcategories_json = excluded.subcategories_json,
        tags_json = excluded.tags_json,
        keywords_json = excluded.keywords_json,
        confidence = excluded.confidence,
        needs_review = excluded.needs_review,
        updated_at = excluded.updated_at
    `
  ).run({
    paperId,
    primaryCategory: classification.primaryCategory,
    subcategoriesJson: JSON.stringify(classification.subcategories),
    tagsJson: JSON.stringify(classification.tags),
    keywordsJson: JSON.stringify(classification.keywords),
    confidence: classification.confidence,
    needsReview: classification.needsReview ? 1 : 0,
    createdAt: timestamp,
    updatedAt: timestamp
  });
}

export function saveSummary(paperId: string, summary: Omit<PaperSummary, "paperId" | "createdAt" | "updatedAt">) {
  ensureSchema();
  const db = getDb();
  const timestamp = now();

  db.prepare(
    `
      INSERT INTO paper_summaries (
        paper_id, short_summary, core_contribution, relevance_note, innovation_note,
        what_this_paper_does_json, claimed_innovations_json, useful_to_my_topic_json,
        limitations_json, candidate_ideas_json, created_at, updated_at
      ) VALUES (
        @paperId, @shortSummary, @coreContribution, @relevanceNote, @innovationNote,
        @whatThisPaperDoesJson, @claimedInnovationsJson, @usefulToMyTopicJson,
        @limitationsJson, @candidateIdeasJson, @createdAt, @updatedAt
      )
      ON CONFLICT(paper_id) DO UPDATE SET
        short_summary = excluded.short_summary,
        core_contribution = excluded.core_contribution,
        relevance_note = excluded.relevance_note,
        innovation_note = excluded.innovation_note,
        what_this_paper_does_json = excluded.what_this_paper_does_json,
        claimed_innovations_json = excluded.claimed_innovations_json,
        useful_to_my_topic_json = excluded.useful_to_my_topic_json,
        limitations_json = excluded.limitations_json,
        candidate_ideas_json = excluded.candidate_ideas_json,
        updated_at = excluded.updated_at
    `
  ).run({
    paperId,
    shortSummary: summary.shortSummary,
    coreContribution: summary.coreContribution,
    relevanceNote: summary.relevanceNote,
    innovationNote: summary.innovationNote,
    whatThisPaperDoesJson: JSON.stringify(summary.whatThisPaperDoes),
    claimedInnovationsJson: JSON.stringify(summary.claimedInnovations),
    usefulToMyTopicJson: JSON.stringify(summary.usefulToMyTopic),
    limitationsJson: JSON.stringify(summary.limitations),
    candidateIdeasJson: JSON.stringify(summary.candidateIdeas),
    createdAt: timestamp,
    updatedAt: timestamp
  });
}

export function listPapers(): PaperListItem[] {
  ensureSchema();
  const db = getDb();
  const rows = db.prepare(
    `
      SELECT
        p.id,
        p.batch_id,
        p.file_id,
        p.title,
        p.year,
        p.authors_json,
        p.status,
        p.recognition_state,
        p.agent_processed,
        p.created_at,
        c.primary_category,
        c.tags_json,
        c.keywords_json,
        s.short_summary
      FROM papers p
      LEFT JOIN paper_classifications c ON c.paper_id = p.id
      LEFT JOIN paper_summaries s ON s.paper_id = p.id
      ORDER BY p.created_at DESC
    `
  ).all() as Array<{
    id: string;
    batch_id: string;
    file_id: string;
    title: string | null;
    year: number | null;
    authors_json: string;
    status: PaperStatus;
    recognition_state: PaperRecognitionState;
    agent_processed: number;
    created_at: string;
    primary_category: string | null;
    tags_json: string | null;
    keywords_json: string | null;
    short_summary: string | null;
  }>;

  return rows.map((row) => ({
    id: row.id,
    batchId: row.batch_id,
    fileId: row.file_id,
    title: row.title ?? "Untitled Paper",
    year: row.year,
    authors: parseJsonArray(row.authors_json),
    primaryCategory: row.primary_category,
    tags: parseJsonArray(row.tags_json),
    keywords: parseJsonArray(row.keywords_json),
    shortSummary: row.short_summary,
    status: row.status,
    recognitionState: row.recognition_state,
    agentProcessed: Boolean(row.agent_processed),
    createdAt: row.created_at
  }));
}

export function getPaperDetail(paperId: string) {
  ensureSchema();
  const db = getDb();

  const paperRow = db.prepare(`SELECT * FROM papers WHERE id = ?`).get(paperId) as PaperRow | undefined;

  if (!paperRow) {
    return null;
  }

  const classificationRow = db
    .prepare(`SELECT * FROM paper_classifications WHERE paper_id = ?`)
    .get(paperId) as ClassificationRow | undefined;
  const summaryRow = db
    .prepare(`SELECT * FROM paper_summaries WHERE paper_id = ?`)
    .get(paperId) as SummaryRow | undefined;

  return {
    paper: mapPaper(paperRow),
    classification: mapClassification(classificationRow),
    summary: mapSummary(summaryRow),
    analysis: readAnalysisArtifactSync<PaperAnalysis>(paperId, "analysis")
  };
}

export function getPaperRecord(paperId: string) {
  ensureSchema();
  const db = getDb();
  const row = db.prepare(`SELECT * FROM papers WHERE id = ?`).get(paperId) as PaperRow | undefined;
  return row ? mapPaper(row) : null;
}

export function getPaperStatusRecord(paperId: string) {
  const detail = getPaperDetail(paperId);

  if (!detail) {
    return null;
  }

  return {
    id: detail.paper.id,
    status: detail.paper.status,
    title: detail.paper.title,
    errorMessage: detail.paper.errorMessage,
    updatedAt: detail.paper.updatedAt
  };
}

export function clearPaperAnalysis(paperId: string) {
  ensureSchema();
  const db = getDb();
  db.prepare(`DELETE FROM paper_classifications WHERE paper_id = ?`).run(paperId);
  db.prepare(`DELETE FROM paper_summaries WHERE paper_id = ?`).run(paperId);
}

export function updatePaperError(paperId: string, errorMessage: string | null) {
  ensureSchema();
  const db = getDb();
  db.prepare(
    `
      UPDATE papers
      SET error_message = @errorMessage,
          updated_at = @updatedAt
      WHERE id = @paperId
    `
  ).run({
    paperId,
    errorMessage,
    updatedAt: now()
  });
}

export function listPaperIds() {
  ensureSchema();
  const db = getDb();
  return (db.prepare(`SELECT id FROM papers ORDER BY created_at DESC`).all() as Array<{ id: string }>).map(
    (row) => row.id
  );
}

export function listPapersNeedingMaintenance(limit = 4) {
  ensureSchema();
  const db = getDb();

  return (
    db
      .prepare(
        `
          SELECT p.id
          FROM papers p
          LEFT JOIN paper_summaries s ON s.paper_id = p.id
          WHERE p.status NOT IN ('extracting', 'classifying', 'summarizing')
            AND (
              p.status IN ('uploaded', 'failed')
              OR p.recognition_state IN ('pending', 'legacy_unknown', 'local_only', 'needs_review')
              OR p.title IS NULL
              OR TRIM(p.title) = ''
              OR p.extracted_char_count <= 0
              OR s.paper_id IS NULL
            )
          ORDER BY
            CASE p.status
              WHEN 'failed' THEN 0
              WHEN 'uploaded' THEN 1
              ELSE 2
            END,
            p.updated_at ASC
          LIMIT @limit
        `
      )
      .all({ limit }) as Array<{ id: string }>
  ).map((row) => row.id);
}

export function countPapersNeedingMaintenance() {
  ensureSchema();
  const db = getDb();
  const row = db
    .prepare(
      `
        SELECT COUNT(*) AS count
        FROM papers p
        LEFT JOIN paper_summaries s ON s.paper_id = p.id
        WHERE p.status NOT IN ('extracting', 'classifying', 'summarizing')
          AND (
            p.status IN ('uploaded', 'failed')
            OR p.recognition_state IN ('pending', 'legacy_unknown', 'local_only', 'needs_review')
            OR p.title IS NULL
            OR TRIM(p.title) = ''
            OR p.extracted_char_count <= 0
            OR s.paper_id IS NULL
          )
      `
    )
    .get() as { count: number };

  return row.count;
}
