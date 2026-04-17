import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import path from "path";

import { databaseFilePath } from "@/lib/storage/paths";

type DbInstance = ReturnType<typeof createDatabase>;

const globalDb = globalThis as typeof globalThis & {
  literatureDb?: DbInstance;
};

function createDatabase() {
  mkdirSync(path.dirname(databaseFilePath), { recursive: true });
  const db = new Database(databaseFilePath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}

export function getDb() {
  if (!globalDb.literatureDb) {
    globalDb.literatureDb = createDatabase();
  }

  return globalDb.literatureDb;
}
