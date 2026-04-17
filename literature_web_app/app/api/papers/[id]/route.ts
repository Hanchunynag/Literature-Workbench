import { NextResponse } from "next/server";

import { getPaperDetail } from "@/lib/db/papers";
import { ensureSchema } from "@/lib/db/schema";

export const runtime = "nodejs";

type RouteProps = {
  params: {
    id: string;
  };
};

export async function GET(_: Request, { params }: RouteProps) {
  ensureSchema();
  const { id } = params;
  const detail = getPaperDetail(id);

  if (!detail) {
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
    ...detail
  });
}
