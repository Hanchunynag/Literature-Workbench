import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { testProviderConnection } from "@/lib/agents/test-provider";
import { getPublicAgentProviders } from "@/lib/agent-catalog";

const testRequestSchema = z.object({
  providerId: z.string().optional(),
  model: z.string().optional(),
  customModel: z.string().optional()
});

export async function POST(request: NextRequest) {
  const providers = getPublicAgentProviders();

  if (providers.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        message: "还没有可用的 provider。请先在 .env.local 里配置 provider。"
      },
      { status: 503 }
    );
  }

  try {
    const payload = testRequestSchema.parse(await request.json());
    const result = await testProviderConnection(payload);

    return NextResponse.json({
      ok: true,
      ...result
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          ok: false,
          message: error.issues[0]?.message ?? "请求参数不合法。"
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "连接测试失败。"
      },
      { status: 500 }
    );
  }
}
