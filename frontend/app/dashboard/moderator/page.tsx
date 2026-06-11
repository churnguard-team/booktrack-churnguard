"use client";

import { useEffect, useState } from "react";
import DashboardShell from "../DashboardShell";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const RISK_STYLE: Record<string, string> = {
  LOW:      "bg-emerald-50 text-emerald-700 border-emerald-200",
  MEDIUM:   "bg-yellow-50  text-yellow-700  border-yellow-200",
  HIGH:     "bg-orange-50  text-orange-700  border-orange-200",
  CRITICAL: "bg-red-50     text-red-700     border-red-200",
};

function KPI({ label, value, sub, color = "bg-white border-gray-100" }: {
  label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${color}`}>
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
    </div>
  );
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-right text-xs text-gray-500">{label}</span>
      <div className="flex-1 rounded-full bg-gray-100 h-3">
        <div className={`h-3 rounded-full ${color}`} style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }} />
      </div>
      <span className="w-8 text-right text-xs font-semibold text-gray-700">{value}</span>
    </div>
  );
}

export default function ModeratorDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [runMsg, setRunMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/dashboard/stats`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStats(await res.json());
    } catch (e: any) {
      setError("Impossible de joindre le backend — " + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function runChurn() {
    setRunning(true);
    setRunMsg(null);
    try {
      const res = await fetch(`${API}/api/retention/run-daily`, { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setRunMsg({ ok: true, text: "Détection churn lancée en arrière-plan. Les emails vont partir sous peu." });
      setTimeout(load, 4000); // recharge les stats après 4s
    } catch (e: any) {
      setRunMsg({ ok: false, text: "Erreur : " + e.message });
    } finally {
      setRunning(false);
    }
  }

  useEffect(() => { load(); }, []);

  const d = stats;
  const churn = d?.churn_distribution ?? { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  const totalChurn = Object.values(churn).reduce((a: number, b) => a + (b as number), 0);
  const freeUsers = (d?.kpis.total_users ?? 0) - (d?.kpis.premium_subscriptions ?? 0);

  return (
    <DashboardShell allowedRoles={["MODERATOR", "SUPER_ADMIN"]}>
      <div className="min-h-screen bg-gray-50 p-6">

        {/* ── Header ── */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Modérateur</h1>
            <p className="mt-1 text-sm text-gray-500">Utilisateurs · Abonnements · Churn · Lecture · Rétention</p>
          </div>
          <div className="flex gap-3">
            <button onClick={load} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              ↻ Actualiser
            </button>
            <button
              onClick={runChurn}
              disabled={running}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {running ? "Analyse en cours…" : "🚨 Lancer détection churn & emails"}
            </button>
          </div>
        </div>

        {/* ── Banners ── */}
        {runMsg && (
          <div className={`mb-5 rounded-xl border p-4 text-sm ${runMsg.ok ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-700"}`}>
            {runMsg.ok ? "✅" : "❌"} {runMsg.text}
          </div>
        )}
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <div className="flex h-64 items-center justify-center text-gray-400">Chargement…</div>
        ) : d && (
          <>
            {/* ── Section 1 : KPIs principaux ── */}
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Vue générale</p>
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KPI label="Utilisateurs total"   value={d.kpis.total_users}          sub={`${d.kpis.active_users} actifs`}           color="bg-white border-gray-100" />
              <KPI label="Nouveaux (30j)"        value={d.kpis.new_users_30d}        sub="inscriptions ce mois"                      color="bg-blue-50 border-blue-100" />
              <KPI label="Livres catalogue"      value={d.kpis.total_books}          sub="disponibles"                               color="bg-white border-gray-100" />
              <KPI label="Abonnements actifs"    value={d.kpis.active_subscriptions} sub={`${d.kpis.premium_subscriptions} Premium`} color="bg-violet-50 border-violet-100" />
            </div>

            {/* ── Section 2 : Abonnements FREE vs PREMIUM ── */}
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Abonnements</p>
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KPI label="FREE"                  value={freeUsers}                                color="bg-gray-50 border-gray-200" />
              <KPI label="PREMIUM"               value={d.kpis.premium_subscriptions}            color="bg-violet-50 border-violet-200" />
              <KPI label="Taux premium"           value={`${d.kpis.total_users > 0 ? ((d.kpis.premium_subscriptions / d.kpis.total_users) * 100).toFixed(1) : 0}%`} color="bg-white border-gray-100" />
              <KPI label="Emails rétention envoyés" value={(d.retention_distribution?.SENT ?? 0)} color="bg-emerald-50 border-emerald-100" />
            </div>

            {/* ── Section 3 : Churn ── */}
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Churn ML</p>
            <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KPI label="Taux de churn"         value={`${d.kpis.churn_rate_percent}%`} sub="HIGH + CRITICAL"           color="bg-red-50 border-red-100" />
              <KPI label="Utilisateurs à risque" value={d.kpis.at_risk_count}             sub="HIGH + CRITICAL scorés"   color="bg-orange-50 border-orange-100" />
              <KPI label="Scorés total"          value={totalChurn}                        sub="avec prédiction ML"       color="bg-white border-gray-100" />
              <KPI label="Non scorés"            value={Math.max(0, d.kpis.total_users - totalChurn)} sub="→ cliquer 'Lancer détection'" color="bg-yellow-50 border-yellow-100" />
            </div>

            {/* Churn distribution détaillée */}
            <div className="mb-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <p className="mb-4 text-sm font-semibold text-gray-700">Distribution des niveaux de risque</p>
                <div className="grid grid-cols-2 gap-3">
                  {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map(level => (
                    <div key={level} className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold ${RISK_STYLE[level]}`}>
                      <span>{level}</span>
                      <span className="text-xl font-bold">{churn[level]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Utilisateurs à risque */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <p className="mb-4 text-sm font-semibold text-gray-700">Top utilisateurs à risque</p>
                {d.at_risk_users.length === 0 ? (
                  <p className="text-sm text-gray-400">Aucun — lancez la détection churn d'abord.</p>
                ) : (
                  <div className="space-y-2">
                    {d.at_risk_users.slice(0, 5).map((u: any, i: number) => (
                      <div key={i} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{u.prenom} {u.nom}</p>
                          <p className="text-xs text-gray-400">{u.email} · {u.abonnement}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-lg border px-2 py-1 text-xs font-bold ${RISK_STYLE[u.niveau_risque]}`}>
                            {Math.round(u.score * 100)}% — {u.niveau_risque}
                          </span>
                          <button
                            disabled={sendingEmail === u.user_id}
                            onClick={async () => {
                              setSendingEmail(u.user_id);
                              setRunMsg(null);
                              try {
                                const res = await fetch(`${API}/api/retention/send-email`, {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ user_id: u.user_id, discount_percent: 30 }),
                                });
                                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                                setRunMsg({ ok: true, text: `Email envoyé à ${u.prenom} ${u.nom} (${u.email})` });
                              } catch (e: any) {
                                setRunMsg({ ok: false, text: "Erreur envoi email : " + e.message });
                              } finally {
                                setSendingEmail(null);
                              }
                            }}
                            className="rounded-lg bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            {sendingEmail === u.user_id ? "…" : "✉ Email"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Section 4 : Lecture ── */}
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Activité de lecture</p>
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KPI label="Livres lus"        value={d.reading_stats.lus}         color="bg-emerald-50 border-emerald-100" />
              <KPI label="En cours"          value={d.reading_stats.en_cours}    color="bg-blue-50 border-blue-100" />
              <KPI label="Abandonnés"        value={d.reading_stats.abandonnes}  color="bg-red-50 border-red-100" />
              <KPI label="Note moyenne"      value={d.reading_stats.note_moyenne ? `⭐ ${d.reading_stats.note_moyenne}/5` : "—"} color="bg-yellow-50 border-yellow-100" />
            </div>

            {/* ── Section 5 : Activité récente + Rétention ── */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Activité 7j */}
              {d.recent_events.length > 0 && (
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <p className="mb-4 text-sm font-semibold text-gray-700">Activité (7 derniers jours)</p>
                  <div className="space-y-3">
                    {d.recent_events.map((e: any) => (
                      <Bar
                        key={e.type}
                        label={e.type.replace(/_/g, " ")}
                        value={e.total}
                        max={Math.max(...d.recent_events.map((x: any) => x.total))}
                        color="bg-blue-400"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Rétention emails */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <p className="mb-4 text-sm font-semibold text-gray-700">Campagnes de rétention (emails)</p>
                {Object.keys(d.retention_distribution).length === 0 ? (
                  <p className="text-sm text-gray-400">Aucun email envoyé encore — lancez la détection churn.</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(d.retention_distribution).map(([status, count]) => (
                      <Bar
                        key={status}
                        label={status}
                        value={count as number}
                        max={Math.max(...Object.values(d.retention_distribution) as number[])}
                        color={status === "SENT" ? "bg-emerald-400" : status === "FAILED" ? "bg-red-400" : "bg-gray-300"}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
