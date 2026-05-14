"use client";

interface ChurnSectionProps {
  data: any;
}

export default function ChurnSection({ data }: ChurnSectionProps) {
  if (!data) {
    return (
      <div style={{
        background: "linear-gradient(135deg, #1a1a1a 0%, #242424 100%)",
        border: "1px solid #333", borderRadius: "0.75rem", padding: "1.5rem",
      }}>
        <h2 style={{ color: "#c9a84c", margin: "0 0 1rem", fontSize: "1.1rem", fontWeight: 600 }}>
          Churn Prediction
        </h2>
        <div style={{ color: "#555", fontSize: "0.9rem" }}>Données non disponibles.</div>
      </div>
    );
  }

  // data vient de /api/moderator/dashboard-summary
  // Il contient : churn_distribution, churn_rate_percent, total_scored_users, ml_model
  const dist = data.churn_distribution ?? { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  const churnRate = data.churn_rate_percent ?? 0;
  const totalScored = data.total_scored_users ?? 0;
  const mlMetrics = data.ml_model?.metrics ?? {};
  const modelName = data.ml_model?.model_name ?? "Modèle ML";

  const riskColors: Record<string, string> = {
    LOW: "#34d399",
    MEDIUM: "#fbbf24",
    HIGH: "#f97316",
    CRITICAL: "#ef4444",
  };

  return (
    <div style={{
      background: "linear-gradient(135deg, #1a1a1a 0%, #242424 100%)",
      border: "1px solid #333", borderRadius: "0.75rem", padding: "1.5rem",
    }}>
      <h2 style={{ color: "#c9a84c", margin: "0 0 1.5rem", fontSize: "1.1rem", fontWeight: 600 }}>
        Churn Prediction
      </h2>

      {/* KPIs churn */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <div style={{ color: "#888", fontSize: "0.85rem", marginBottom: "0.4rem" }}>Taux de churn</div>
          <div style={{ color: "#ef4444", fontSize: "1.8rem", fontWeight: 700 }}>
            {churnRate.toFixed(1)}%
          </div>
        </div>
        <div>
          <div style={{ color: "#888", fontSize: "0.85rem", marginBottom: "0.4rem" }}>Utilisateurs scorés</div>
          <div style={{ color: "#a78bfa", fontSize: "1.8rem", fontWeight: 700 }}>{totalScored}</div>
        </div>
      </div>

      {/* Distribution par niveau de risque */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ color: "#888", fontSize: "0.85rem", marginBottom: "0.75rem", fontWeight: 600 }}>
          Distribution du risque
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
          {Object.entries(dist).map(([level, count]) => (
            <div key={level} style={{
              padding: "0.6rem 0.8rem",
              background: "#111",
              border: `1px solid ${riskColors[level] ?? "#333"}22`,
              borderRadius: "0.4rem",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ color: riskColors[level] ?? "#888", fontSize: "0.8rem", fontWeight: 600 }}>
                {level}
              </span>
              <span style={{ color: "#ddd", fontSize: "0.9rem", fontWeight: 700 }}>
                {count as number}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Métriques du modèle ML */}
      {Object.keys(mlMetrics).length > 0 && (
        <div>
          <div style={{ color: "#888", fontSize: "0.85rem", marginBottom: "0.75rem", fontWeight: 600 }}>
            Métriques {modelName}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            {["accuracy", "precision", "recall", "roc_auc"].map((key) =>
              mlMetrics[key] != null ? (
                <div key={key} style={{
                  padding: "0.5rem 0.75rem",
                  background: "#111",
                  border: "1px solid #222",
                  borderRadius: "0.4rem",
                }}>
                  <div style={{ color: "#666", fontSize: "0.75rem" }}>{key.toUpperCase()}</div>
                  <div style={{ color: "#60a5fa", fontSize: "1rem", fontWeight: 700 }}>
                    {(mlMetrics[key] * 100).toFixed(1)}%
                  </div>
                </div>
              ) : null
            )}
          </div>
        </div>
      )}

      {totalScored === 0 && (
        <div style={{
          marginTop: "1rem", padding: "0.75rem",
          background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)",
          borderRadius: "0.4rem", color: "#c9a84c", fontSize: "0.82rem",
        }}>
          ℹ️ Aucun score churn calculé. Lancez le pipeline de prédiction pour voir les données.
        </div>
      )}
    </div>
  );
}
