"use client";

type Props = {
  distribution: { LOW: number; MEDIUM: number; HIGH: number; CRITICAL: number };
};

const LEVELS = [
  { key: "LOW",      label: "Faible",   color: "#22c55e", bg: "#dcfce7" },
  { key: "MEDIUM",   label: "Moyen",    color: "#f59e0b", bg: "#fef3c7" },
  { key: "HIGH",     label: "Élevé",    color: "#f97316", bg: "#ffedd5" },
  { key: "CRITICAL", label: "Critique", color: "#ef4444", bg: "#fee2e2" },
] as const;

export default function ChurnBar({ distribution }: Props) {
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {LEVELS.map(({ key, label, color, bg }) => {
        const count = distribution[key];
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={key}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#374151" }}>{label}</span>
              <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>{count} ({pct}%)</span>
            </div>
            <div style={{ height: "10px", borderRadius: "99px", background: "#f3f4f6", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${pct}%`,
                  background: color,
                  borderRadius: "99px",
                  transition: "width 0.8s ease",
                }}
              />
            </div>
          </div>
        );
      })}
      {total === 0 && (
        <p style={{ color: "#9ca3af", fontSize: "0.85rem", textAlign: "center" }}>
          Aucun score calculé
        </p>
      )}
    </div>
  );
}
