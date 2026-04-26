"use client";

interface ChurnSectionProps {
  data: any;
}

export default function ChurnSection({ data }: ChurnSectionProps) {
  if (!data) return null;

  return (
    <div style={{
      background: "linear-gradient(135deg, #1a1a1a 0%, #242424 100%)",
      border: "1px solid #333",
      borderRadius: "0.75rem",
      padding: "1.5rem",
    }}>
      <h2 style={{ color: "#c9a84c", margin: "0 0 1.5rem", fontSize: "1.1rem", fontWeight: 600 }}>
        Prédictions de Churn
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <div style={{ color: "#888", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
            Utilisateurs à risque
          </div>
          <div style={{ color: "#34d399", fontSize: "1.8rem", fontWeight: 700 }}>
            {data.total_at_risk || 0}
          </div>
        </div>
        <div>
          <div style={{ color: "#888", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
            Taux de churn estimé
          </div>
          <div style={{ color: "#60a5fa", fontSize: "1.8rem", fontWeight: 700 }}>
            {(data.churn_rate || 0).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Risk Distribution */}
      <div>
        <div style={{ color: "#888", fontSize: "0.85rem", marginBottom: "0.75rem", fontWeight: 600 }}>
          Distribution des risques
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          {["FAIBLE", "MOYEN", "ÉLEVÉ", "CRITIQUE"].map((level, idx) => {
            const colors = ["#34d399", "#fbbf24", "#f97316", "#ef4444"];
            const count = data.distribution?.[level] || 0;
            const total = data.total_at_risk || 1;
            const percent = Math.round((count / total) * 100) || 0;

            return (
              <div key={level}>
                <div style={{ fontSize: "0.75rem", color: "#888", marginBottom: "0.25rem" }}>
                  {level}
                </div>
                <div style={{
                  background: "#111",
                  borderRadius: "0.25rem",
                  height: "6px",
                  overflow: "hidden",
                }}>
                  <div style={{
                    background: colors[idx],
                    height: "100%",
                    width: `${percent}%`,
                    transition: "width 0.3s",
                  }} />
                </div>
                <div style={{ fontSize: "0.75rem", color: colors[idx], marginTop: "0.25rem", fontWeight: 600 }}>
                  {count} ({percent}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
        <button style={{
          flex: 1,
          padding: "0.75rem",
          borderRadius: "0.5rem",
          border: "1px solid #60a5fa",
          background: "transparent",
          color: "#60a5fa",
          cursor: "pointer",
          fontSize: "0.85rem",
          fontWeight: 600,
        }}>
          Voir les détails
        </button>
        <button style={{
          flex: 1,
          padding: "0.75rem",
          borderRadius: "0.5rem",
          border: "1px solid #c9a84c",
          background: "transparent",
          color: "#c9a84c",
          cursor: "pointer",
          fontSize: "0.85rem",
          fontWeight: 600,
        }}>
          Former le modèle
        </button>
      </div>
    </div>
  );
}
