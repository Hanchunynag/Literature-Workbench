type TagPillProps = {
  children: React.ReactNode;
  tone?: "default" | "strong";
};

export function TagPill({ children, tone = "default" }: TagPillProps) {
  return (
    <span className={tone === "strong" ? "tag-pill tag-pill-strong" : "tag-pill"}>
      {children}
    </span>
  );
}
