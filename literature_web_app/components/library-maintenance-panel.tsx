"use client";

import { useEffect, useState } from "react";

type MaintenanceState = {
  running: boolean;
  lastStartedAt: string | null;
  lastFinishedAt: string | null;
  lastError: string | null;
  lastQueuedPaperIds: string[];
  lastCompletedPaperIds: string[];
  pendingCount: number;
};

type MaintenanceResponse = {
  ok: boolean;
  started?: boolean;
  queuedPaperIds?: string[];
  state: MaintenanceState;
};

function formatTimestamp(value: string | null) {
  if (!value) {
    return "暂无";
  }

  return new Date(value).toLocaleString("zh-CN", {
    hour12: false
  });
}

export function LibraryMaintenancePanel() {
  const [state, setState] = useState<MaintenanceState | null>(null);
  const [message, setMessage] = useState("准备检查本地文献库。");

  useEffect(() => {
    let cancelled = false;

    async function syncStatus() {
      try {
        const response = await fetch("/api/papers/maintenance", {
          method: "GET",
          cache: "no-store"
        });
        const payload = (await response.json()) as MaintenanceResponse;

        if (!cancelled) {
          setState(payload.state);
          if (payload.state.running) {
            setMessage("后台维护仍在进行中，已开始顺序补处理缺失识别的论文。");
          } else if (payload.state.pendingCount > 0) {
            setMessage("当前还有论文待补处理，系统会继续在后台巡检。");
          } else {
            setMessage("当前文献库已完成识别维护。");
          }
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : "获取维护状态失败。");
        }
      }
    }

    async function triggerAndSync() {
      try {
        const response = await fetch("/api/papers/maintenance", {
          method: "POST",
          cache: "no-store"
        });
        const payload = (await response.json()) as MaintenanceResponse;

        if (cancelled) {
          return;
        }

        setState(payload.state);

        if (payload.started && payload.queuedPaperIds && payload.queuedPaperIds.length > 0) {
          setMessage(`后台已开始补处理 ${payload.queuedPaperIds.length} 篇论文。`);
        } else if (payload.state.pendingCount > 0) {
          setMessage("后台维护正在等待下一轮扫描。");
        } else {
          setMessage("当前文献库已完成识别维护。");
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : "触发维护失败。");
        }
      }
    }

    void triggerAndSync();
    const intervalId = window.setInterval(() => {
      void syncStatus();
    }, 8000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="maintenance-panel">
      <div className="maintenance-panel-head">
        <div>
          <p className="eyebrow">Maintenance</p>
          <h2>本地文献维护状态</h2>
        </div>
        <span className={`maintenance-status-pill ${state?.running ? "maintenance-status-running" : ""}`}>
          {state?.running ? "后台维护中" : "后台空闲"}
        </span>
      </div>

      <p className="muted-text">{message}</p>

      <div className="maintenance-stats-grid">
        <div className="maintenance-stat-card">
          <strong>{state?.pendingCount ?? "--"}</strong>
          <span>待补处理论文</span>
        </div>
        <div className="maintenance-stat-card">
          <strong>{state?.lastQueuedPaperIds.length ?? 0}</strong>
          <span>最近一批排队数</span>
        </div>
        <div className="maintenance-stat-card">
          <strong>{state?.lastCompletedPaperIds.length ?? 0}</strong>
          <span>最近一批完成数</span>
        </div>
      </div>

      <div className="maintenance-meta-grid">
        <p>
          <span>最近启动</span>
          <strong>{formatTimestamp(state?.lastStartedAt ?? null)}</strong>
        </p>
        <p>
          <span>最近完成</span>
          <strong>{formatTimestamp(state?.lastFinishedAt ?? null)}</strong>
        </p>
      </div>

      {state?.lastError ? (
        <div className="maintenance-alert">
          <strong>最近一次维护报错</strong>
          <p>{state.lastError}</p>
        </div>
      ) : null}
    </div>
  );
}
