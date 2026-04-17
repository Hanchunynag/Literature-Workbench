import { existsSync, readFileSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

import {
  analysisPapersRoot,
  extractedPapersRoot,
  rawPapersRoot
} from "@/lib/storage/paths";

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function ensureStorageDirectories() {
  await Promise.all([
    mkdir(rawPapersRoot, { recursive: true }),
    mkdir(extractedPapersRoot, { recursive: true }),
    mkdir(analysisPapersRoot, { recursive: true })
  ]);
}

export async function saveUploadedPdf(input: {
  batchId: string;
  paperId: string;
  fileName: string;
  buffer: Buffer;
}) {
  await ensureStorageDirectories();

  const safeName = sanitizeFileName(input.fileName || "paper.pdf");
  const storedFileName = `${input.paperId}_${safeName}`;
  const batchDirectory = path.join(rawPapersRoot, input.batchId);
  await mkdir(batchDirectory, { recursive: true });
  const absolutePath = path.join(batchDirectory, storedFileName);

  await writeFile(absolutePath, input.buffer);

  return {
    storedFileName,
    absolutePath
  };
}

export async function saveBatchManifest(batchId: string, payload: unknown) {
  await ensureStorageDirectories();
  const batchDirectory = path.join(analysisPapersRoot, "batches", batchId);
  await mkdir(batchDirectory, { recursive: true });
  const absolutePath = path.join(batchDirectory, "manifest.json");
  await writeFile(absolutePath, JSON.stringify(payload, null, 2), "utf-8");
  return absolutePath;
}

export async function saveExtractedArtifact(paperId: string, payload: unknown) {
  await ensureStorageDirectories();
  const absolutePath = path.join(extractedPapersRoot, `${paperId}.json`);
  await writeFile(absolutePath, JSON.stringify(payload, null, 2), "utf-8");
  return absolutePath;
}

export type AnalysisArtifactType = "analysis" | "classification" | "summary";

export async function saveAnalysisArtifact(
  paperId: string,
  type: AnalysisArtifactType,
  payload: unknown
) {
  await ensureStorageDirectories();
  const absolutePath = path.join(analysisPapersRoot, `${paperId}.${type}.json`);
  await writeFile(absolutePath, JSON.stringify(payload, null, 2), "utf-8");
  return absolutePath;
}

export async function saveAgentExchangeArtifact(input: {
  paperId: string;
  type: AnalysisArtifactType;
  attempt: number;
  payload: unknown;
}) {
  await ensureStorageDirectories();
  const logDirectory = path.join(analysisPapersRoot, "agent-logs", input.paperId);
  await mkdir(logDirectory, { recursive: true });
  const absolutePath = path.join(logDirectory, `${input.type}.attempt-${input.attempt}.json`);
  await writeFile(absolutePath, JSON.stringify(input.payload, null, 2), "utf-8");
  return absolutePath;
}

export function readAnalysisArtifactSync<T>(paperId: string, type: AnalysisArtifactType) {
  const absolutePath = path.join(analysisPapersRoot, `${paperId}.${type}.json`);

  if (!existsSync(absolutePath)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(absolutePath, "utf-8")) as T;
  } catch {
    return null;
  }
}
