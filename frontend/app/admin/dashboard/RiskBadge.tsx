type Level = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

const CONFIG: Record<Level, { label: string; color: string; bg: string }> = {
  LOW:      { label: "Faible",   color: "#166534", bg: "#dcfce7" },
  MEDIUM:   { label: "Moyen",    color: "#92400e", bg: "#fef3c7" },
  HIGH:     { label: "Élevé",    color: "#9a3412", bg: "#ffedd5" },
  CRITICAL: { label: "Critique", color: "#991b1b", bg: "#fee2e2" },
};

export default function RiskBadge({ level }: { level: string }) {
  const cfg = CONFIG[level as Level] ?? { label: level, color: "#374151", bg: "#f3f4f6" };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.2rem 0.6rem",
        borderRadius: "99px",
        fontSize: "0.72rem",
        fontWeight: 700,
        letterSpacing: "0.03em",
        color: cfg.color,
        background: cfg.bg,
      }}
    >
      {cfg.label}
    </span>
  );
}
