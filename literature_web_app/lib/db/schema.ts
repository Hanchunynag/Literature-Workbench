import { getDb } from "@/lib/db/client";

function hasColumn(tableName: string, columnName: string) {
  const db = getDb();
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>;
  return columns.some((column) => column.name === columnName);
}

export function ensureSchema() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS papers (
      id TEXT PRIMARY KEY,
      file_hash TEXT,
      batch_id TEXT NOT NULL DEFAULT '',
      file_id TEXT NOT NULL DEFAULT '',
      title TEXT,
      year INTEGER,
      authors_json TEXT NOT NULL DEFAULT '[]',
      original_file_name TEXT NOT NULL,
      stored_file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      topic TEXT,
      note TEXT,
      status TEXT NOT NULL,
      recognition_state TEXT NOT NULL DEFAULT 'pending',
      recognition_note TEXT,
      agent_processed INTEGER NOT NULL DEFAULT 0,
      markdown_path TEXT,
      extracted_text TEXT,
      extracted_char_count INTEGER NOT NULL DEFAULT 0,
      error_message TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS paper_classifications (
      paper_id TEXT PRIMARY KEY REFERENCES papers(id) ON DELETE CASCADE,
      primary_category TEXT NOT NULL,
      subcategories_json TEXT NOT NULL,
      tags_json TEXT NOT NULL,
      keywords_json TEXT NOT NULL,
      confidence REAL NOT NULL,
      needs_review INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS paper_summaries (
      paper_id TEXT PRIMARY KEY REFERENCES papers(id) ON DELETE CASCADE,
      short_summary TEXT NOT NULL,
      core_contribution TEXT NOT NULL,
      relevance_note TEXT NOT NULL,
      innovation_note TEXT NOT NULL,
      what_this_paper_does_json TEXT NOT NULL,
      claimed_innovations_json TEXT NOT NULL,
      useful_to_my_topic_json TEXT NOT NULL,
      limitations_json TEXT NOT NULL,
      candidate_ideas_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  if (!hasColumn("papers", "file_hash")) {
    db.exec(`ALTER TABLE papers ADD COLUMN file_hash TEXT;`);
  }

  if (!hasColumn("papers", "batch_id")) {
    db.exec(`ALTER TABLE papers ADD COLUMN batch_id TEXT NOT NULL DEFAULT '';`);
  }
  db.exec(`
    UPDATE papers
    SET batch_id = 'legacy_batch_' || replace(substr(created_at, 1, 10), '-', '')
    WHERE batch_id IS NULL OR batch_id = '';
  `);

  if (!hasColumn("papers", "file_id")) {
    db.exec(`ALTER TABLE papers ADD COLUMN file_id TEXT NOT NULL DEFAULT '';`);
  }
  db.exec(`
    UPDATE papers
    SET file_id = 'legacy_' || replace(substr(id, 1, 8), '-', '')
    WHERE file_id IS NULL OR file_id = '';
  `);

  if (!hasColumn("papers", "recognition_state")) {
    db.exec(`ALTER TABLE papers ADD COLUMN recognition_state TEXT NOT NULL DEFAULT 'pending';`);
  }
  db.exec(`
    UPDATE papers
    SET recognition_state = 'legacy_unknown'
    WHERE recognition_state IS NULL OR recognition_state = '' OR recognition_state = 'pending';
  `);

  if (!hasColumn("papers", "recognition_note")) {
    db.exec(`ALTER TABLE papers ADD COLUMN recognition_note TEXT;`);
  }

  if (!hasColumn("papers", "agent_processed")) {
    db.exec(`ALTER TABLE papers ADD COLUMN agent_processed INTEGER NOT NULL DEFAULT 0;`);
  }

  if (!hasColumn("papers", "markdown_path")) {
    db.exec(`ALTER TABLE papers ADD COLUMN markdown_path TEXT;`);
  }

  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_papers_file_hash
    ON papers(file_hash)
    WHERE file_hash IS NOT NULL;
  `);
}
