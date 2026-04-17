import { NextResponse } from "next/server";

import { ensureSchema } from "@/lib/db/schema";
import { getMaintenanceSweepState, triggerMaintenanceSweep } from "@/lib/pipeline/maintenance-sweep";

export const runtime = "nodejs";

export async function GET() {
  ensureSchema();

  return NextResponse.json({
    ok: true,
    state: getMaintenanceSweepState()
  });
}

export async function POST() {
  ensureSchema();
  const result = triggerMaintenanceSweep(3);

  return NextResponse.json({
    ok: true,
    started: result.started,
    queuedPaperIds: result.queuedPaperIds,
    state: getMaintenanceSweepState()
  });
}
