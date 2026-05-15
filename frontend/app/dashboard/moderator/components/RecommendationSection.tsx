"use client";

interface RecommendationSectionProps { data: any; }

const riskBadge = (niveau: string) => {
  if (niveau === "CRITICAL") return "bg-red-100 text-red-600";
  if (niveau === "HIGH") return "bg-orange-100 text-orange-600";
  return "bg-yellow-100 text-yellow-600";
};

export default function RecommendationSection({ data }: RecommendationSectionProps) {
  if (!data) return null;

  const recs = data.recommendations ?? {};
  const topGenres: { genre: string; total: number }[] = data.top_genres ?? [];
  const atRiskUsers: any[] = data.top_at_risk_users ?? [];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-base font-semibold text-gray-800 mb-5">Recommandations de Livres</h2>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-violet-50 rounded-xl p-4 border border-violet-100">
          <p className="text-xs text-gray-500 mb-1">Recommandations estimées</p>
          <p className="text-2xl font-bold text-violet-600">{recs.total_recommendations ?? 0}</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
          <p className="text-xs text-gray-500 mb-1">Couverture utilisateurs</p>
          <p className="text-2xl font-bold text-yellow-600">{(recs.coverage ?? 0).toFixed(1)}%</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
          <p className="text-xs text-gray-500 mb-1">Utilisateurs avec livres</p>
          <p className="text-xl font-bold text-emerald-600">{recs.users_with_books ?? 0}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <p className="text-xs text-gray-500 mb-1">Livres disponibles</p>
          <p className="text-xl font-bold text-blue-600">{recs.total_books ?? 0}</p>
        </div>
      </div>

      {/* Top genres */}
      {topGenres.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Genres les plus lus</p>
          <div className="flex flex-wrap gap-2">
            {topGenres.map((g, i) => (
              <span key={i} className="px-3 py-1 bg-violet-50 border border-violet-200 text-violet-700 text-xs font-medium rounded-full">
                {g.genre} ({g.total})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* At-risk users */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Utilisateurs prioritaires (risque churn)</p>
        {atRiskUsers.length === 0 ? (
          <p className="text-sm text-gray-400">Aucun utilisateur à risque détecté.</p>
        ) : (
          <div className="space-y-2">
            {atRiskUsers.slice(0, 3).map((user: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-800">{user.name ?? `${user.prenom ?? ""} ${user.nom ?? ""}`.trim()}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>
                <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${riskBadge(user.niveau_risque)}`}>
                  {user.churn_risk?.toFixed(0) ?? Math.round(user.score * 100)}% risque
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
