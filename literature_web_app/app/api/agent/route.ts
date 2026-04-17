import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getPublicAgentProviders } from "@/lib/agent-catalog";
import { runResearchAgent } from "@/lib/research-agent";

const agentRequestSchema = z.object({
  providerId: z.string().optional(),
  model: z.string().optional(),
  customModel: z.string().optional(),
  paperTitle: z.string().optional(),
  abstractText: z.string().optional(),
  topic: z.string().optional(),
  note: z.string().optional(),
  message: z.string().optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1)
      })
    )
    .optional()
});

export async function GET() {
  return NextResponse.json({
    ok: true,
    providers: getPublicAgentProviders()
  });
}

export async function POST(request: NextRequest) {
  const providers = getPublicAgentProviders();

  if (providers.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        message: "还没有可用的 provider。请先在 .env.local 里配置 OPENAI_API_KEY、OPENROUTER_API_KEY 或 GROQ_API_KEY。"
      },
      { status: 503 }
    );
  }

  try {
    const payload = agentRequestSchema.parse(await request.json());
    const hasSingleMessage = Boolean(payload.message?.trim());
    const hasMessages = Boolean(payload.messages && payload.messages.length > 0);

    if (!hasSingleMessage && !hasMessages) {
      return NextResponse.json(
        {
          ok: false,
          message: "message is required"
        },
        { status: 400 }
      );
    }

    const result = await runResearchAgent(payload);

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
        message: error instanceof Error ? error.message : "Agent 请求失败。"
      },
      { status: 500 }
    );
  }
}
