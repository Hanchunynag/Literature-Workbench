import { NextResponse } from "next/server";

import { getPaperStatusRecord } from "@/lib/db/papers";
import { ensureSchema } from "@/lib/db/schema";

export const runtime = "nodejs";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, { params }: RouteProps) {
  ensureSchema();
  const { id } = await params;
  const status = getPaperStatusRecord(id);

  if (!status) {
    return NextResponse.json(
      {
        ok: false,
        message: "Paper not found."
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    ...status
  });
}
