import { randomUUID } from "crypto";

export type BatchManifestFile = {
  file_id: string;
  original_name: string;
  storage_path: string;
  sha256: string;
  file_type: "pdf";
};

export type BatchManifest = {
  batch_id: string;
  task_type: "document_classification";
  files: BatchManifestFile[];
};

export function buildBatchId() {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    "_",
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0")
  ].join("");

  return `batch_${stamp}_${randomUUID().slice(0, 6)}`;
}

export function createBatchManifest(input: {
  batchId?: string;
  files: Array<{
    fileId: string;
    originalName: string;
    storagePath: string;
    sha256: string;
  }>;
}) {
  const batchId = input.batchId ?? buildBatchId();

  const manifest: BatchManifest = {
    batch_id: batchId,
    task_type: "document_classification",
    files: input.files.map((file) => ({
      file_id: file.fileId,
      original_name: file.originalName,
      storage_path: file.storagePath,
      sha256: file.sha256,
      file_type: "pdf"
    }))
  };

  return {
    batchId,
    manifest
  };
}
