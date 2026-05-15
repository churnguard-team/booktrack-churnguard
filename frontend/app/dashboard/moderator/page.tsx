"use client";

import { useEffect, useState } from "react";
import DashboardShell from "../DashboardShell";

const API = "http://localhost:8000";

const MOCK: any = {
  kpis: {
    total_users: 312, active_users: 278, new_users_30d: 47, new_users_7d: 12,
    total_books: 50, active_subscriptions: 189, premium_subscriptions: 64,
    free_subscriptions: 125, churn_rate_percent: 23.7, at_risk_count: 71,
  },
  churn: {
    distribution: { LOW: 142, MEDIUM: 87, HIGH: 53, CRITICAL: 18 },
    rate_percent: 23.7, total_scored: 300,
    at_risk_users: [
      { name: "Alice Martin", email: "alice@example.com", churn_risk: 91, niveau_risque: "CRITICAL" },
      { name: "Bob Dupont",   email: "bob@example.com",   churn_risk: 78, niveau_risque: "HIGH" },
      { name: "Clara Petit",  email: "clara@example.com", churn_risk: 65, niveau_risque: "HIGH" },
    ],
  },
  ml_model: {
    model_name: "random_forest",
    metrics: { accuracy: 0.804, precision: 0.670, recall: 0.516, f1: 0.583, roc_auc: 0.843 },
    feature_importance: { pages_lues: 0.18, nb_livres_lus: 0.15, jours_depuis_connexion: 0.14, note_moyenne: 0.12 },
  },
  reading_stats: { lus: 834, en_cours: 203, abandonnes: 91, note_moyenne: 3.8 },
  top_genres: [
    { genre: "Fantastique", total: 89 }, { genre: "Science-Fiction", total: 74 },
    { genre: "Policier", total: 61 },    { genre: "Classique", total: 55 },
    { genre: "Romance", total: 42 },
  ],
  recent_events: [
    { type: "book_added", total: 134 }, { type: "login", total: 98 },
    { type: "book_read", total: 67 },   { type: "comment", total: 34 },
  ],
  monthly_signups: [
    { month: "Jan", total: 18 }, { month: "Fév", total: 24 },
    { month: "Mar", total: 31 }, { month: "Avr", total: 28 },
    { month: "Mai", total: 42 }, { month: "Jun", total: 47 },
  ],
};

const RISK_STYLE: Record<string, string> = {
  LOW:      "bg-emerald-50 text-emerald-700 border-emerald-200",
  MEDIUM:   "bg-yellow-50  text-yellow-700  border-yellow-200",
  HIGH:     "bg-orange-50  text-orange-700  border-orange-200",
  CRITICAL: "bg-red-50     text-red-700     border-red-200",
};

function KpiCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className={`rounded-2xl p-5 border ${color}`}>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function BarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-gray-500 w-20 shrink-0 text-right">{d.label}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-3">
            <div className={`h-3 rounded-full ${d.color}`} style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
          <span className="text-xs font-semibold text-gray-700 w-8 text-right">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function ModeratorDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/moderator/full-stats`);
      if (!res.ok) throw new Error();
      setData(await res.json());
      setUsingMock(false);
    } catch {
      setData(MOCK);
      setUsingMock(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const d = data;

  return (
    <DashboardShell allowedRoles={["MODERATOR", "SUPER_ADMIN"]}>
      <div className="min-h-screen bg-gray-50 p-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tableau de bord Modérateur</h1>
            <p className="text-sm text-gray-500 mt-1">Churn · Abonnements · Activité · Modèle ML</p>
          </div>
          <button onClick={fetchAll} className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors">
            ↻ Actualiser
          </button>
        </div>

        {usingMock && (
          <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-700 text-sm">
            ⚠️ Backend non disponible — données de démonstration affichées. Lancez le backend sur le port 8000.
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center min-h-64 text-gray-400 text-sm">Chargement...</div>
        )}

        {!loading && d && (
          <>
            {/* ── KPIs principaux ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <KpiCard label="Utilisateurs total"    value={d.kpis.total_users}            sub={`${d.kpis.active_users} actifs`}          color="bg-white border-gray-100" />
              <KpiCard label="Nouveaux (30j)"        value={d.kpis.new_users_30d}          sub={`+${d.kpis.new_users_7d} cette semaine`}  color="bg-blue-50 border-blue-100" />
              <KpiCard label="Abonnements actifs"    value={d.kpis.active_subscriptions}   sub={`${d.kpis.premium_subscriptions} Premium · ${d.kpis.free_subscriptions} Free`} color="bg-violet-50 border-violet-100" />
              <KpiCard label="Taux de churn"         value={`${d.kpis.churn_rate_percent}%`} sub={`${d.kpis.at_risk_count} utilisateurs à risque`} color="bg-red-50 border-red-100" />
            </div>

            {/* ── Ligne 2 : Churn + Abonnements ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

              {/* Churn distribution */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-base font-semibold text-gray-800 mb-4">Distribution du risque churn</h2>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {Object.entries(d.churn.distribution).map(([level, count]) => (
                    <div key={level} className={`flex justify-between items-center px-4 py-3 rounded-xl border text-sm font-semibold ${RISK_STYLE[level] ?? "bg-gray-50 border-gray-200 text-gray-600"}`}>
                      <span>{level}</span>
                      <span className="text-lg font-bold">{count as number}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="text-center flex-1">
                    <p className="text-xs text-gray-500">Scorés</p>
                    <p className="text-xl font-bold text-gray-800">{d.churn.total_scored}</p>
                  </div>
                  <div className="w-px h-10 bg-gray-200" />
                  <div className="text-center flex-1">
                    <p className="text-xs text-gray-500">Taux churn</p>
                    <p className="text-xl font-bold text-red-600">{d.churn.rate_percent}%</p>
                  </div>
                </div>
              </div>

              {/* Abonnements + lecture */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-base font-semibold text-gray-800 mb-4">Abonnements & Lecture</h2>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">Premium</p>
                    <p className="text-2xl font-bold text-violet-700">{d.kpis.premium_subscriptions}</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">Free</p>
                    <p className="text-2xl font-bold text-blue-700">{d.kpis.free_subscriptions}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500">Lus</p>
                    <p className="text-lg font-bold text-emerald-700">{d.reading_stats.lus}</p>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500">En cours</p>
                    <p className="text-lg font-bold text-yellow-700">{d.reading_stats.en_cours}</p>
                  </div>
                  <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500">Abandonnés</p>
                    <p className="text-lg font-bold text-red-700">{d.reading_stats.abandonnes}</p>
                  </div>
                </div>
                {d.reading_stats.note_moyenne && (
                  <p className="text-xs text-gray-400 mt-3 text-center">Note moyenne : ⭐ {d.reading_stats.note_moyenne} / 5</p>
                )}
              </div>
            </div>

            {/* ── Ligne 3 : ML Model + Utilisateurs à risque ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

              {/* ML Metrics */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-base font-semibold text-gray-800 mb-1">Modèle ML — {d.ml_model?.model_name ?? "Random Forest"}</h2>
                <p className="text-xs text-gray-400 mb-4">Métriques d&apos;entraînement (XGBoost / Random Forest)</p>
                {d.ml_model?.metrics && Object.keys(d.ml_model.metrics).length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {[
                        { key: "accuracy",  label: "Accuracy",  color: "text-blue-600   bg-blue-50   border-blue-100" },
                        { key: "precision", label: "Precision", color: "text-violet-600 bg-violet-50 border-violet-100" },
                        { key: "recall",    label: "Recall",    color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
                        { key: "roc_auc",   label: "ROC AUC",   color: "text-orange-600 bg-orange-50 border-orange-100" },
                        { key: "f1",        label: "F1 Score",  color: "text-pink-600   bg-pink-50   border-pink-100" },
                      ].filter(m => d.ml_model.metrics[m.key] != null).map(m => (
                        <div key={m.key} className={`rounded-xl p-3 border ${m.color}`}>
                          <p className="text-xs font-medium opacity-70">{m.label}</p>
                          <p className="text-xl font-bold">{(d.ml_model.metrics[m.key] * 100).toFixed(1)}%</p>
                        </div>
                      ))}
                    </div>
                    {d.ml_model.feature_importance && Object.keys(d.ml_model.feature_importance).length > 0 && (
                      <>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Importance des features</p>
                        <BarChart data={Object.entries(d.ml_model.feature_importance).slice(0, 5).map(([k, v]) => ({
                          label: k.replace(/_/g, " "),
                          value: Math.round((v as number) * 100),
                          color: "bg-blue-400",
                        }))} />
                      </>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-400">Modèle non chargé — vérifiez saved_models/</p>
                )}
              </div>

              {/* Utilisateurs à risque */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-base font-semibold text-gray-800 mb-4">Utilisateurs à risque élevé</h2>
                {d.churn.at_risk_users.length === 0 ? (
                  <p className="text-sm text-gray-400">Aucun utilisateur à risque détecté.</p>
                ) : (
                  <div className="space-y-3">
                    {d.churn.at_risk_users.map((u: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{u.name}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-2 py-1 rounded-lg text-xs font-bold border ${RISK_STYLE[u.niveau_risque] ?? ""}`}>
                            {u.churn_risk}%
                          </span>
                          <p className="text-xs text-gray-400 mt-0.5">{u.niveau_risque}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Ligne 4 : Genres + Inscriptions mensuelles ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

              {/* Top genres */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-base font-semibold text-gray-800 mb-4">Genres les plus lus</h2>
                <BarChart data={d.top_genres.map((g: any, i: number) => ({
                  label: g.genre,
                  value: g.total,
                  color: ["bg-violet-400", "bg-blue-400", "bg-emerald-400", "bg-yellow-400", "bg-orange-400"][i % 5],
                }))} />
              </div>

              {/* Inscriptions mensuelles */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-base font-semibold text-gray-800 mb-4">Nouvelles inscriptions (6 mois)</h2>
                {d.monthly_signups.length === 0 ? (
                  <p className="text-sm text-gray-400">Pas de données disponibles.</p>
                ) : (
                  <>
                    <BarChart data={d.monthly_signups.map((m: any) => ({
                      label: m.month, value: m.total, color: "bg-blue-400",
                    }))} />
                    <p className="text-xs text-gray-400 mt-3 text-right">
                      Total : {d.monthly_signups.reduce((s: number, m: any) => s + m.total, 0)} inscriptions
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* ── Activité récente ── */}
            {d.recent_events.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-base font-semibold text-gray-800 mb-4">Activité récente (7 derniers jours)</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {d.recent_events.map((e: any, i: number) => (
                    <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
                      <p className="text-xs text-gray-500 mb-1">{e.type.replace(/_/g, " ")}</p>
                      <p className="text-2xl font-bold text-gray-800">{e.total}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardShell>
  );
}
