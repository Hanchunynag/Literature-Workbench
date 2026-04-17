import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";

const execFileAsync = promisify(execFile);

export type PythonPdfExtractionResult = {
  sourcePdf: string;
  fileStem: string;
  pageCount: number;
  title: string;
  authors: string[];
  year: string;
  keywordsCandidate: string[];
  extractStatus: string;
  extractor: string;
  textCharCount: number;
  updatedAt: string;
  fullText: string;
  previewText: string;
  abstractText: string;
  introductionPreview: string;
  contributionExcerpt: string;
  conclusionPreview: string;
  cleanSummary: string;
};

function getPythonBin() {
  return process.env.PDF_PYTHON_BIN?.trim() || "python3";
}

function getExtractorBackend() {
  return process.env.PDF_EXTRACTOR_BACKEND?.trim().toLowerCase() || "marker";
}

function getExtractorScriptPath() {
  const backend = getExtractorBackend();

  if (backend === "pypdf") {
    return path.join(process.cwd(), "scripts", "extract_pdf_keyinfo.py");
  }

  if (backend === "langchain") {
    return path.join(process.cwd(), "scripts", "extract_pdf_keyinfo_langchain.py");
  }

  return path.join(process.cwd(), "scripts", "extract_pdf_keyinfo_marker.py");
}

export async function extractPdfKeyInfoWithPython(pdfPath: string) {
  const { stdout } = await execFileAsync(getPythonBin(), [getExtractorScriptPath(), "--pdf", pdfPath], {
    maxBuffer: 20 * 1024 * 1024
  });

  return JSON.parse(stdout) as PythonPdfExtractionResult;
}
