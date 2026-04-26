"use client";

interface RecommendationSectionProps {
  data: any;
}

export default function RecommendationSection({ data }: RecommendationSectionProps) {
  if (!data) return null;

  return (
    <div style={{
      background: "linear-gradient(135deg, #1a1a1a 0%, #242424 100%)",
      border: "1px solid #333",
      borderRadius: "0.75rem",
      padding: "1.5rem",
    }}>
      <h2 style={{ color: "#c9a84c", margin: "0 0 1.5rem", fontSize: "1.1rem", fontWeight: 600 }}>
        Recommandations de Livres
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <div style={{ color: "#888", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
            Recommandations générées
          </div>
          <div style={{ color: "#a78bfa", fontSize: "1.8rem", fontWeight: 700 }}>
            {data.recommendations?.total_recommendations || 0}
          </div>
        </div>
        <div>
          <div style={{ color: "#888", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
            Couverture utilisateurs
          </div>
          <div style={{ color: "#fbbf24", fontSize: "1.8rem", fontWeight: 700 }}>
            {(data.recommendations?.coverage || 0).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Top At-Risk Users */}
      <div>
        <div style={{ color: "#888", fontSize: "0.85rem", marginBottom: "0.75rem", fontWeight: 600 }}>
          Utilisateurs prioritaires
        </div>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {(data.top_at_risk_users || []).slice(0, 3).map((user: any, idx: number) => (
            <div
              key={idx}
              style={{
                padding: "0.75rem",
                background: "#111",
                border: "1px solid #222",
                borderRadius: "0.5rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ color: "#ddd", fontSize: "0.9rem", fontWeight: 500 }}>
                  {user.name || `Utilisateur ${user.id}`}
                </div>
                <div style={{ color: "#666", fontSize: "0.8rem" }}>
                  {user.email || "email@example.com"}
                </div>
              </div>
              <div style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "0.25rem",
                background: "rgba(239, 68, 68, 0.1)",
                color: "#ef4444",
                fontSize: "0.8rem",
                fontWeight: 600,
              }}>
                {(user.churn_risk || 0).toFixed(0)}% risque
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
        <button style={{
          flex: 1,
          padding: "0.75rem",
          borderRadius: "0.5rem",
          border: "1px solid #a78bfa",
          background: "transparent",
          color: "#a78bfa",
          cursor: "pointer",
          fontSize: "0.85rem",
          fontWeight: 600,
        }}>
          Voir les recs
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
          Générer batch
        </button>
      </div>
    </div>
  );
}
