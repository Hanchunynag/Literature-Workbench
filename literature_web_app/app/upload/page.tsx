import { AgentPlayground } from "@/components/agent-playground";
import { UploadForm } from "@/components/upload-form";
import { getPublicAgentProviders } from "@/lib/agent-catalog";

const uploadSignals = [
  "让上传成为站点中的自然入口，而不是后台管理面板。",
  "保留表单和状态反馈，方便继续推进高保真设计。",
  "把上传后的后续处理留到未来版本，不在当前网站实现。"
];

export default function UploadPage() {
  const providers = getPublicAgentProviders();

  return (
    <div className="page-stack">
      <section className="panel upload-hero">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Upload Entry</p>
            <h1>上传论文</h1>
            <p className="muted-text">
              这里保留网站里的上传入口，方便你继续打磨完整产品体验。
            </p>
          </div>
        </div>

        <div className="upload-signal-grid">
          {uploadSignals.map((signal) => (
            <article key={signal} className="feature-card">
              <p>{signal}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <UploadForm />
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Agent Playground</p>
            <h2>多模型 Agent 试验台</h2>
            <p className="muted-text">
              在同一套前端里切换 provider 和 model，直接比较输出风格与分析能力。
            </p>
          </div>
        </div>

        <AgentPlayground providers={providers} />
      </section>
    </div>
  );
}
