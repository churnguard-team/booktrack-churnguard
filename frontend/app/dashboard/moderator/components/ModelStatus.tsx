"use client";

interface ModelStatusProps { status: any; onRefresh: () => void; }

export default function ModelStatus({ status, onRefresh }: ModelStatusProps) {
  if (!status) return null;

  const models = [
    { label: "Random Forest", data: status?.churn_models?.random_forest, color: "blue" },
    { label: "XGBoost",       data: status?.churn_models?.xgboost,       color: "violet" },
    { label: "Recommandations", data: status?.recommendation,            color: "emerald" },
  ];

  const colorMap: Record<string, string> = {
    blue:    "bg-blue-50 border-blue-200 text-blue-700",
    violet:  "bg-violet-50 border-violet-200 text-violet-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-base font-semibold text-gray-800">État des modèles</h2>
        <button
          onClick={onRefresh}
          className="px-4 py-1.5 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
        >
          Actualiser
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {models.map((m) => {
          const trained = m.data?.trained ?? false;
          const lastUpdate = m.data?.last_update ?? "—";
          return (
            <div key={m.label} className={`rounded-xl p-4 border ${trained ? colorMap[m.color] : "bg-gray-50 border-gray-200 text-gray-400"}`}>
              <p className="text-sm font-semibold mb-1">{m.label}</p>
              <p className="text-xs font-medium">{trained ? "✓ Actif" : "✗ Non disponible"}</p>
              <p className="text-xs mt-1 opacity-70">{lastUpdate}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
