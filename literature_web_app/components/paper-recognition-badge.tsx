import { TagPill } from "@/components/tag-pill";
import type { PaperRecognitionState, PaperStatus } from "@/lib/types/paper";

const recognitionLabels: Record<PaperRecognitionState, string> = {
  pending: "待识别",
  recognized: "agent已识别",
  local_only: "仅本地结果",
  needs_review: "待重识别",
  legacy_unknown: "历史待补识别"
};

type PaperRecognitionBadgeProps = {
  recognitionState: PaperRecognitionState;
  status: PaperStatus;
};

export function PaperRecognitionBadge({
  recognitionState,
  status
}: PaperRecognitionBadgeProps) {
  if (status === "extracting" || status === "classifying" || status === "summarizing") {
    return <TagPill>识别中</TagPill>;
  }

  return (
    <TagPill tone={recognitionState === "recognized" ? "strong" : undefined}>
      {recognitionLabels[recognitionState]}
    </TagPill>
  );
}
