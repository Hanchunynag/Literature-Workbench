import { AgentPlayground } from "@/components/agent-playground";
import { UploadForm } from "@/components/upload-form";
import { getPublicAgentProviders } from "@/lib/agent-catalog";

const uploadSignals = [
  "上传 PDF 后立即创建论文记录并启动后台处理。",
  "先做提取、分类、总结 3 个步骤，不扩展成复杂多 agent 系统。",
  "文献库和详情页都会直接读取真实数据库结果。"
];

export const dynamic = "force-dynamic";

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
              第一阶段已经接入真实上传、后台处理和结构化结果展示，这里就是主入口。
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
              在同一套前端里切换 provider 和 model，先测连接，再用右侧对话窗口直接测试连续聊天。
            </p>
          </div>
        </div>

        <AgentPlayground providers={providers} />
      </section>
    </div>
  );
}
