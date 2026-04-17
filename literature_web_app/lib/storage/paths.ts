import path from "path";

export const appRoot = process.cwd();
export const dataRoot = path.join(appRoot, "data");
export const papersRoot = path.join(dataRoot, "papers");
export const rawPapersRoot = path.join(papersRoot, "raw");
export const extractedPapersRoot = path.join(papersRoot, "extracted");
export const analysisPapersRoot = path.join(papersRoot, "analysis");
export const databaseFilePath = path.join(dataRoot, "literature.db");
