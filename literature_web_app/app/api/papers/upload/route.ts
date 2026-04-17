import { createHash, randomUUID } from "crypto";
import { readFile } from "fs/promises";

import { NextResponse } from "next/server";

import {
  createPaper,
  findPaperByFileHash,
  listPaperFilesMissingHash,
  updatePaperFileHash
} from "@/lib/db/papers";
import { buildBatchId, createBatchManifest } from "@/lib/pipeline/batch-manifest";
import { ensureSchema } from "@/lib/db/schema";
import { processPaper } from "@/lib/pipeline/process-paper";
import { saveBatchManifest, saveUploadedPdf } from "@/lib/storage/file-store";

export const runtime = "nodejs";

let paperProcessingQueue: Promise<void> = Promise.resolve();

function createFileHash(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function backfillMissingPaperHashes() {
  const records = listPaperFilesMissingHash();

  for (const record of records) {
    try {
      const buffer = await readFile(record.file_path);
      const fileHash = createFileHash(buffer);
      const existingPaper = findPaperByFileHash(fileHash);

      if (existingPaper && existingPaper.id !== record.id) {
        continue;
      }

      updatePaperFileHash(record.id, fileHash);
    } catch {
      // Ignore missing or unreadable historical files; they can still be viewed but won't dedupe.
    }
  }
}

function comparePaperProcessingOrder(
  left: { fileId: string; paperId: string },
  right: { fileId: string; paperId: string }
) {
  return left.fileId.localeCompare(right.fileId) || left.paperId.localeCompare(right.paperId);
}

function enqueuePaperProcessing(items: Array<{ fileId: string; paperId: string }>) {
  const queuedItems = [...items].sort(comparePaperProcessingOrder);

  paperProcessingQueue = paperProcessingQueue
    .catch(() => undefined)
    .then(async () => {
      for (const item of queuedItems) {
        try {
          await processPaper(item.paperId);
        } catch (error) {
          console.error("processPaper failed", { paperId: item.paperId, error });
        }
      }
    });
}

export async function POST(request: Request) {
  ensureSchema();

  try {
    const formData = await request.formData();
    const files = formData.getAll("paper").filter((value): value is File => value instanceof File);
    const topic = String(formData.get("topic") ?? "").trim();
    const note = String(formData.get("note") ?? "").trim();

    if (files.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          message: "缺少 PDF 文件。"
        },
        { status: 400 }
      );
    }

    for (const file of files) {
      const looksLikePdf =
        file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

      if (!looksLikePdf) {
        return NextResponse.json(
          {
            ok: false,
            message: "目前只支持 PDF 上传。"
          },
          { status: 400 }
        );
      }
    }

    await backfillMissingPaperHashes();
    const batchId = buildBatchId();
    const manifestFiles: Array<{
      fileId: string;
      originalName: string;
      storagePath: string;
      sha256: string;
    }> = [];
    const items: Array<{
      paperId: string;
      batchId: string;
      fileId: string;
      fileName: string;
      status: string;
      duplicate: boolean;
    }> = [];

    for (const [index, file] of files.entries()) {
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const fileHash = createFileHash(fileBuffer);
      const existingPaper = findPaperByFileHash(fileHash);

      if (existingPaper) {
        items.push({
          paperId: existingPaper.id,
          batchId: existingPaper.batchId,
          fileId: existingPaper.fileId,
          fileName: file.name,
          status: existingPaper.status,
          duplicate: true
        });
        continue;
      }

      const paperId = randomUUID();
      const fileId = `f${String(index + 1).padStart(3, "0")}`;
      const saved = await saveUploadedPdf({
        batchId,
        paperId,
        fileName: file.name,
        buffer: fileBuffer
      });

      manifestFiles.push({
        fileId,
        originalName: file.name,
        storagePath: saved.absolutePath,
        sha256: fileHash
      });

      const createdId = createPaper({
        id: paperId,
        fileHash,
        batchId,
        fileId,
        originalFileName: file.name,
        storedFileName: saved.storedFileName,
        filePath: saved.absolutePath,
        topic,
        note
      });

      items.push({
        paperId: createdId,
        batchId,
        fileId,
        fileName: file.name,
        status: "uploaded",
        duplicate: false
      });
    }

    if (manifestFiles.length > 0) {
      const manifest = createBatchManifest({
        batchId,
        files: manifestFiles
      });
      await saveBatchManifest(manifest.batchId, manifest.manifest);
    }

    enqueuePaperProcessing(
      items
        .filter((entry) => !entry.duplicate)
        .map((entry) => ({
          fileId: entry.fileId,
          paperId: entry.paperId
        }))
    );

    if (items.length === 1) {
      const item = items[0];
      return NextResponse.json({
        ok: true,
        duplicate: item.duplicate,
        batchId: item.batchId,
        fileId: item.fileId,
        paperId: item.paperId,
        status: item.status
      });
    }

    return NextResponse.json({
      ok: true,
      batchId,
      count: items.length,
      items,
      status: "uploaded"
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "上传失败。"
      },
      { status: 500 }
    );
  }
}
