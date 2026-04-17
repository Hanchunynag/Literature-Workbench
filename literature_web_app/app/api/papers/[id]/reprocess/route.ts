import { NextResponse } from "next/server";

import { getPaperRecord, updatePaperError, updatePaperStatus } from "@/lib/db/papers";
import { ensureSchema } from "@/lib/db/schema";
import { processPaper } from "@/lib/pipeline/process-paper";

export const runtime = "nodejs";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_: Request, { params }: RouteProps) {
  ensureSchema();
  const { id } = await params;
  const paper = getPaperRecord(id);

  if (!paper) {
    return NextResponse.json(
      {
        ok: false,
        message: "Paper not found."
      },
      { status: 404 }
    );
  }

  updatePaperError(id, null);
  updatePaperStatus(id, "uploaded");

  void processPaper(id).catch((error) => {
    console.error("reprocess failed", error);
  });

  return NextResponse.json({
    ok: true,
    paperId: id,
    status: "uploaded"
  });
}
