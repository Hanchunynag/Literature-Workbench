import { createHash } from "crypto";
import { readFile, rm } from "fs/promises";
import path from "path";

import { getDb } from "@/lib/db/client";
import { ensureSchema } from "@/lib/db/schema";
import {
  analysisPapersRoot,
  extractedPapersRoot
} from "@/lib/storage/paths";

type PaperRow = {
  id: string;
  file_hash: string | null;
  file_path: string;
  stored_file_name: string;
  title: string | null;
  status: string;
  extracted_char_count: number;
  created_at: string;
  updated_at: string;
  has_classification: number;
  has_summary: number;
  short_summary_length: number;
};

const statusRank: Record<string, number> = {
  ready: 6,
  summarizing: 5,
  classifying: 4,
  extracting: 3,
  uploaded: 2,
  failed: 1
};

function hashScore(row: PaperRow) {
  return [
    statusRank[row.status] ?? 0,
    row.has_summary,
    row.has_classification,
    row.short_summary_length,
    row.extracted_char_count,
    Date.parse(row.updated_at) || 0,
    Date.parse(row.created_at) || 0
  ];
}

function compareRows(a: PaperRow, b: PaperRow) {
  const scoreA = hashScore(a);
  const scoreB = hashScore(b);

  for (let index = 0; index < scoreA.length; index += 1) {
    if (scoreA[index] !== scoreB[index]) {
      return scoreB[index] - scoreA[index];
    }
  }

  return a.id.localeCompare(b.id);
}

async function computeFileHash(filePath: string) {
  const buffer = await readFile(filePath);
  return createHash("sha256").update(buffer).digest("hex");
}

async function safeRemove(filePath: string) {
  await rm(filePath, { force: true });
}

async function main() {
  ensureSchema();
  const db = getDb();

  db.exec(`DROP INDEX IF EXISTS idx_papers_file_hash;`);

  const rows = db.prepare(
    `
      SELECT
        p.id,
        p.file_hash,
        p.file_path,
        p.stored_file_name,
        p.title,
        p.status,
        p.extracted_char_count,
        p.created_at,
        p.updated_at,
        CASE WHEN c.paper_id IS NULL THEN 0 ELSE 1 END AS has_classification,
        CASE WHEN s.paper_id IS NULL THEN 0 ELSE 1 END AS has_summary,
        LENGTH(COALESCE(s.short_summary, '')) AS short_summary_length
      FROM papers p
      LEFT JOIN paper_classifications c ON c.paper_id = p.id
      LEFT JOIN paper_summaries s ON s.paper_id = p.id
      ORDER BY p.created_at ASC
    `
  ).all() as PaperRow[];

  for (const row of rows) {
    if (row.file_hash) {
      continue;
    }

    try {
      const fileHash = await computeFileHash(row.file_path);
      db.prepare(`UPDATE papers SET file_hash = ?, updated_at = ? WHERE id = ?`).run(
        fileHash,
        new Date().toISOString(),
        row.id
      );
      row.file_hash = fileHash;
    } catch {
      // Ignore rows whose files are missing; they simply won't participate in hash dedupe.
    }
  }

  const rowsWithHashes = rows.filter((row) => row.file_hash);
  const groups = new Map<string, PaperRow[]>();

  for (const row of rowsWithHashes) {
    const key = row.file_hash as string;
    const current = groups.get(key) ?? [];
    current.push(row);
    groups.set(key, current);
  }

  const duplicateGroups = Array.from(groups.values()).filter((group) => group.length > 1);

  let removedCount = 0;

  for (const group of duplicateGroups) {
    group.sort(compareRows);
    const keeper = group[0];
    const duplicates = group.slice(1);

    console.log(`keep ${keeper.id} (${keeper.stored_file_name})`);

    for (const duplicate of duplicates) {
      console.log(`  remove ${duplicate.id} (${duplicate.stored_file_name})`);

      db.prepare(`DELETE FROM papers WHERE id = ?`).run(duplicate.id);

      await Promise.all([
        safeRemove(duplicate.file_path),
        safeRemove(path.join(extractedPapersRoot, `${duplicate.id}.json`)),
        safeRemove(path.join(analysisPapersRoot, `${duplicate.id}.classification.json`)),
        safeRemove(path.join(analysisPapersRoot, `${duplicate.id}.summary.json`))
      ]);

      removedCount += 1;
    }
  }

  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_papers_file_hash
    ON papers(file_hash)
    WHERE file_hash IS NOT NULL;
  `);

  console.log(
    JSON.stringify(
      {
        duplicateGroups: duplicateGroups.length,
        removedCount
      },
      null,
      2
    )
  );
}

void main();
