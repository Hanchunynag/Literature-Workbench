import { TagPill } from "@/components/tag-pill";
import type { PaperStatus } from "@/lib/types/paper";

const statusLabels: Record<PaperStatus, string> = {
  uploaded: "uploaded",
  extracting: "extracting",
  classifying: "classifying",
  summarizing: "summarizing",
  ready: "ready",
  failed: "failed"
};

type PaperStatusBadgeProps = {
  status: PaperStatus;
};

export function PaperStatusBadge({ status }: PaperStatusBadgeProps) {
  const tone = status === "ready" ? "strong" : undefined;
  return <TagPill tone={tone}>{statusLabels[status]}</TagPill>;
}
