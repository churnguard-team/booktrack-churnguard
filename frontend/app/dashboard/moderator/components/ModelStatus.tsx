"use client";

interface ModelStatusProps {
  status: any;
  onRefresh: () => void;
}

export default function ModelStatus({ status, onRefresh }: ModelStatusProps) {
  if (!status) return null;

  const models = [
    { name: "Random Forest", key: "random_forest", color: "#60a5fa" },
    { name: "XGBoost", key: "xgboost", color: "#a78bfa" },
    { name: "Deep Learning", key: "deep_learning", color: "#34d399" },
    { name: "Recommandations", key: "recommendation", color: "#fbbf24" },
  ];

  return (
    <div style={{
      background: "linear-gradient(135deg, #1a1a1a 0%, #242424 100%)",
      border: "1px solid #333",
      borderRadius: "0.75rem",
      padding: "1.5rem",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ color: "#c9a84c", margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>
          État des modèles
        </h2>
        <button
          onClick={onRefresh}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "0.5rem",
            border: "1px solid #c9a84c",
            background: "transparent",
            color: "#c9a84c",
            cursor: "pointer",
            fontSize: "0.85rem",
            fontWeight: 500,
          }}
        >
          Actualiser
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
        {models.map((model) => {
          const modelData = status?.[model.key === "recommendation" ? "recommendation_model" : "churn_models"]?.[model.key];
          const trained = modelData?.trained || false;
          const lastUpdate = modelData?.last_update || "Jamais";

          return (
            <div
              key={model.key}
              style={{
                padding: "1rem",
                background: "#161616",
                border: `1px solid ${trained ? model.color : "#333"}`,
                borderRadius: "0.5rem",
                opacity: trained ? 1 : 0.6,
              }}
            >
              <div style={{ color: model.color, fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                {model.name}
              </div>
              <div style={{
                color: trained ? "#34d399" : "#888",
                fontSize: "0.8rem",
                marginBottom: "0.25rem",
              }}>
                {trained ? "✓ Entraîné" : "✗ Non entraîné"}
              </div>
              <div style={{ color: "#555", fontSize: "0.75rem" }}>
                Mise à jour: {lastUpdate}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
