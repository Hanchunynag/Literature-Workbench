export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("paper");

  if (!(file instanceof File)) {
    return Response.json(
      {
        ok: false,
        message: "没有收到 PDF 文件。"
      },
      { status: 400 }
    );
  }

  return Response.json({
    ok: true,
    fileName: file.name,
    message: "上传链路占位已打通，后面这里会接对象存储和后台处理任务。",
    nextStep: "下一步把这个接口接到 Supabase Storage + processing job。"
  });
}
