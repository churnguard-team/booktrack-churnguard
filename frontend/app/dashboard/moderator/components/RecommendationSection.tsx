"use client";

interface RecommendationSectionProps {
  data: any;
}

const riskColor = (niveau: string) => {
  if (niveau === "CRITICAL") return "#ef4444";
  if (niveau === "HIGH") return "#f97316";
  return "#fbbf24";
};

export default function RecommendationSection({ data }: RecommendationSectionProps) {
  if (!data) return null;

  const recs = data.recommendations ?? {};
  const topGenres: { genre: string; total: number }[] = data.top_genres ?? [];
  const atRiskUsers: any[] = data.top_at_risk_users ?? [];

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #1a1a1a 0%, #242424 100%)",
        border: "1px solid #333",
        borderRadius: "0.75rem",
        padding: "1.5rem",
      }}
    >
      <h2 style={{ color: "#c9a84c", margin: "0 0 1.5rem", fontSize: "1.1rem", fontWeight: 600 }}>
        Recommandations de Livres
      </h2>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <div style={{ color: "#888", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
            Recommandations estimées
          </div>
          <div style={{ color: "#a78bfa", fontSize: "1.8rem", fontWeight: 700 }}>
            {recs.total_recommendations ?? 0}
          </div>
        </div>
        <div>
          <div style={{ color: "#888", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
            Couverture utilisateurs
          </div>
          <div style={{ color: "#fbbf24", fontSize: "1.8rem", fontWeight: 700 }}>
            {(recs.coverage ?? 0).toFixed(1)}%
          </div>
        </div>
        <div>
          <div style={{ color: "#888", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
            Utilisateurs avec livres
          </div>
          <div style={{ color: "#34d399", fontSize: "1.4rem", fontWeight: 700 }}>
            {recs.users_with_books ?? 0}
          </div>
        </div>
        <div>
          <div style={{ color: "#888", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
            Livres disponibles
          </div>
          <div style={{ color: "#60a5fa", fontSize: "1.4rem", fontWeight: 700 }}>
            {recs.total_books ?? 0}
          </div>
        </div>
      </div>

      {/* Top genres */}
      {topGenres.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ color: "#888", fontSize: "0.85rem", marginBottom: "0.75rem", fontWeight: 600 }}>
            Genres les plus lus
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {topGenres.map((g, i) => (
              <span
                key={i}
                style={{
                  padding: "0.3rem 0.7rem",
                  borderRadius: "1rem",
                  background: "rgba(167,139,250,0.1)",
                  border: "1px solid rgba(167,139,250,0.3)",
                  color: "#a78bfa",
                  fontSize: "0.8rem",
                }}
              >
                {g.genre} ({g.total})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Utilisateurs prioritaires (à risque) */}
      <div>
        <div style={{ color: "#888", fontSize: "0.85rem", marginBottom: "0.75rem", fontWeight: 600 }}>
          Utilisateurs prioritaires (risque churn)
        </div>
        {atRiskUsers.length === 0 ? (
          <div style={{ color: "#555", fontSize: "0.85rem" }}>Aucun utilisateur à risque détecté.</div>
        ) : (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {atRiskUsers.slice(0, 3).map((user: any, idx: number) => (
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
                    {user.name}
                  </div>
                  <div style={{ color: "#666", fontSize: "0.8rem" }}>{user.email}</div>
                </div>
                <div
                  style={{
                    padding: "0.4rem 0.8rem",
                    borderRadius: "0.25rem",
                    background: `rgba(239,68,68,0.1)`,
                    color: riskColor(user.niveau_risque),
                    fontSize: "0.8rem",
                    fontWeight: 600,
                  }}
                >
                  {user.churn_risk.toFixed(0)}% risque
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
