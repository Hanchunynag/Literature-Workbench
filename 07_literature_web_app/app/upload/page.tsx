import { ClassifyDemoForm } from "@/components/classify-demo-form";
import { UploadForm } from "@/components/upload-form";

export default function UploadPage() {
  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-head">
          <h1>上传即处理</h1>
          <p className="muted-text">
            这一页先把交互路径搭起来，后面会接真实文件存储、查重和提取服务。
          </p>
        </div>

        <UploadForm />
      </section>

      <ClassifyDemoForm />
    </div>
  );
}
