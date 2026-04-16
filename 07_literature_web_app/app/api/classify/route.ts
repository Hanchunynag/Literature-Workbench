import { classifyPaperWithAgent } from "@/lib/agents/paper-classifier";

type ClassifyRequestBody = {
  title?: string;
  abstractText?: string;
  keywords?: string[];
  note?: string;
};

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      {
        ok: false,
        message: "服务端还没有配置 OPENAI_API_KEY，agent 目前无法真正运行。"
      },
      { status: 503 }
    );
  }

  const body = (await request.json()) as ClassifyRequestBody;

  if (!body.title || !body.abstractText) {
    return Response.json(
      {
        ok: false,
        message: "请至少提供 title 和 abstractText。"
      },
      { status: 400 }
    );
  }

  try {
    const classification = await classifyPaperWithAgent({
      title: body.title,
      abstractText: body.abstractText,
      keywords: body.keywords,
      note: body.note
    });

    return Response.json({
      ok: true,
      classification
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "agent 分类请求失败。";

    return Response.json(
      {
        ok: false,
        message
      },
      { status: 500 }
    );
  }
}
