"use client";

import { useEffect, useState } from "react";
import DashboardShell from "../DashboardShell";

const API_URL = "http://localhost:8000";

const MOCK_STATS = {
  totalUsers: 312,
  activeUsers: 278,
  churnRate: "23.7%",
  atRiskCount: 71,
  premiumSubscriptions: 64,
  freeSubscriptions: 125,
  recentEvents: [
    { label: "Connexion", count: 98 },
    { label: "Livres lus", count: 67 },
    { label: "Commentaires", count: 34 },
  ],
};

export default function ModeratorDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/moderator/dashboard-summary`);
      if (!response.ok) throw new Error("Fetch failed");
      const data = await response.json();
      setStats(data);
      setUsingMock(false);
    } catch {
      setStats(MOCK_STATS);
      setUsingMock(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardShell allowedRoles={["MODERATOR", "SUPER_ADMIN"]}>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Modérateur</h1>
            <p className="mt-2 text-sm text-gray-500">Accédez aux statistiques de churn, aux abonnements et aux alertes.</p>
          </div>
          <button
            type="button"
            onClick={fetchDashboard}
            className="inline-flex items-center justify-center rounded-xl border border-blue-300 bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Actualiser
          </button>
        </div>

        {usingMock && (
          <div className="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
            Backend non disponible, données de démonstration chargées.
          </div>
        )}

        {loading ? (
          <div className="rounded-xl bg-white p-8 text-center text-gray-500">Chargement...</div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-sm uppercase tracking-[0.2em] text-gray-400">Utilisateurs actifs</div>
              <div className="mt-4 text-4xl font-semibold text-gray-900">{stats.activeUsers ?? stats.active_users ?? 0}</div>
              <p className="mt-2 text-sm text-gray-500">Sur {stats.totalUsers ?? stats.total_users ?? 0} utilisateurs au total.</p>
            </div>
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-sm uppercase tracking-[0.2em] text-gray-400">Taux de churn</div>
              <div className="mt-4 text-4xl font-semibold text-gray-900">{stats.churnRate ?? stats.churn_rate ?? "N/A"}</div>
              <p className="mt-2 text-sm text-gray-500">{stats.atRiskCount ?? stats.at_risk_count ?? 0} utilisateurs à risque.</p>
            </div>
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-sm uppercase tracking-[0.2em] text-gray-400">Abonnements premium</div>
              <div className="mt-4 text-4xl font-semibold text-gray-900">{stats.premiumSubscriptions ?? stats.premium_subscriptions ?? 0}</div>
              <p className="mt-2 text-sm text-gray-500">Free : {stats.freeSubscriptions ?? stats.free_subscriptions ?? 0}</p>
            </div>
          </div>
        )}

        {!loading && stats && (
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Événements récents</h2>
              <div className="mt-4 space-y-3">
                {(stats.recentEvents ?? stats.recent_events ?? []).map((event: any, index: number) => (
                  <div key={index} className="flex items-center justify-between rounded-2xl bg-gray-50 p-4">
                    <span className="text-sm text-gray-700">{event.label}</span>
                    <span className="text-lg font-semibold text-gray-900">{event.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Détails</h2>
              <p className="mt-4 text-sm leading-6 text-gray-600">Cette section fournit un point d'entrée simple pour les modérateurs. Vous pouvez connecter le backend après le redémarrage et ces données seront automatiquement mises à jour.</p>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
