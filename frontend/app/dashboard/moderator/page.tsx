"use client";

import { useEffect, useRef, useState } from "react";
import DashboardShell from "../DashboardShell";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── types ─────────────────────────────────────────────────────────────────────
interface ChurnChart {
  distribution: Record<string, number>;
  trend: { month: string; avg_score: number; nb_users: number }[];
  at_risk_trend: { month: string; at_risk: number; total: number }[];
  total_scored: number;
  churn_rate_percent: number;
}

interface SubChart {
  plans: { FREE: number; PREMIUM: number };
  new_subs_trend: { month: string; free: number; premium: number }[];
  cancellations_trend: { month: string; cancellations: number }[];
  total_active_users: number;
  premium_rate_percent: number;
}

// ── tiny canvas helpers ───────────────────────────────────────────────────────
function drawDonut(
  canvas: HTMLCanvasElement,
  data: { label: string; value: number; color: string }[]
) {
  const ctx = canvas.getContext("2d")!;
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    ctx.fillStyle = "#e5e7eb";
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, H / 2 - 10, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  let start = -Math.PI / 2;
  const cx = W / 2;
  const cy = H / 2;
  const r = H / 2 - 10;
  const inner = r * 0.55;
  for (const d of data) {
    const slice = (d.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, start + slice);
    ctx.closePath();
    ctx.fillStyle = d.color;
    ctx.fill();
    start += slice;
  }
  // hole
  ctx.beginPath();
  ctx.arc(cx, cy, inner, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();
  // center text
  ctx.fillStyle = "#111827";
  ctx.font = `bold ${Math.round(r * 0.38)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(total), cx, cy);
}

function drawBar(
  canvas: HTMLCanvasElement,
  labels: string[],
  datasets: { label: string; values: number[]; color: string }[]
) {
  const ctx = canvas.getContext("2d")!;
  const W = canvas.width;
  const H = canvas.height;
  const PAD = { top: 20, right: 16, bottom: 40, left: 40 };
  ctx.clearRect(0, 0, W, H);

  const allVals = datasets.flatMap((d) => d.values);
  const maxVal = Math.max(...allVals, 1);
  const chartH = H - PAD.top - PAD.bottom;
  const chartW = W - PAD.left - PAD.right;

  // grid lines
  ctx.strokeStyle = "#f3f4f6";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = PAD.top + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(PAD.left, y);
    ctx.lineTo(W - PAD.right, y);
    ctx.stroke();
    ctx.fillStyle = "#9ca3af";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(String(Math.round(maxVal - (maxVal / 4) * i)), PAD.left - 4, y + 3);
  }

  const groupW = chartW / Math.max(labels.length, 1);
  const barW = (groupW * 0.7) / datasets.length;

  labels.forEach((label, i) => {
    const gx = PAD.left + i * groupW + groupW * 0.15;
    datasets.forEach((ds, di) => {
      const val = ds.values[i] ?? 0;
      const bh = (val / maxVal) * chartH;
      const bx = gx + di * barW;
      const by = PAD.top + chartH - bh;
      ctx.fillStyle = ds.color;
      ctx.beginPath();
      ctx.roundRect(bx, by, barW - 2, bh, [3, 3, 0, 0]);
      ctx.fill();
    });
    // x label
    ctx.fillStyle = "#6b7280";
    ctx.font = "9px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(label.slice(5), PAD.left + i * groupW + groupW / 2, H - PAD.bottom + 14);
  });

  // legend
  let lx = PAD.left;
  datasets.forEach((ds) => {
    ctx.fillStyle = ds.color;
    ctx.fillRect(lx, H - 14, 10, 10);
    ctx.fillStyle = "#374151";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(ds.label, lx + 13, H - 5);
    lx += ctx.measureText(ds.label).width + 28;
  });
}

function drawLine(
  canvas: HTMLCanvasElement,
  labels: string[],
  values: number[],
  color: string,
  yLabel = ""
) {
  const ctx = canvas.getContext("2d")!;
  const W = canvas.width;
  const H = canvas.height;
  const PAD = { top: 20, right: 16, bottom: 40, left: 44 };
  ctx.clearRect(0, 0, W, H);

  const maxVal = Math.max(...values, 0.01);
  const chartH = H - PAD.top - PAD.bottom;
  const chartW = W - PAD.left - PAD.right;

  // grid
  ctx.strokeStyle = "#f3f4f6";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = PAD.top + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(PAD.left, y);
    ctx.lineTo(W - PAD.right, y);
    ctx.stroke();
    ctx.fillStyle = "#9ca3af";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "right";
    const v = maxVal - (maxVal / 4) * i;
    ctx.fillText(v < 1 ? v.toFixed(2) : String(Math.round(v)), PAD.left - 4, y + 3);
  }

  if (values.length < 2) return;

  const pts = values.map((v, i) => ({
    x: PAD.left + (i / (values.length - 1)) * chartW,
    y: PAD.top + chartH - (v / maxVal) * chartH,
  }));

  // fill
  ctx.beginPath();
  ctx.moveTo(pts[0].x, PAD.top + chartH);
  pts.forEach((p) => ctx.lineTo(p.x, p.y));
  ctx.lineTo(pts[pts.length - 1].x, PAD.top + chartH);
  ctx.closePath();
  ctx.fillStyle = color + "22";
  ctx.fill();

  // line
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.stroke();

  // dots
  pts.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // x labels
  labels.forEach((l, i) => {
    ctx.fillStyle = "#6b7280";
    ctx.font = "9px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(l.slice(5), pts[i].x, H - PAD.bottom + 14);
  });
}

// ── KPI card ──────────────────────────────────────────────────────────────────
function KPI({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</p>
      <p className="mt-3 text-3xl font-bold text-gray-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
    </div>
  );
}

// ── Legend row ────────────────────────────────────────────────────────────────
function Legend({ items }: { items: { label: string; value: number; color: string }[] }) {
  const total = items.reduce((s, i) => s + i.value, 0);
  return (
    <div className="mt-4 space-y-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full" style={{ background: item.color }} />
            <span className="text-gray-600">{item.label}</span>
          </div>
          <span className="font-semibold text-gray-800">
            {item.value}
            <span className="ml-1 text-xs font-normal text-gray-400">
              ({total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%)
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────
export default function ModeratorDashboard() {
  const [churn, setChurn] = useState<ChurnChart | null>(null);
  const [subs, setSubs] = useState<SubChart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // canvas refs
  const refChurnDonut = useRef<HTMLCanvasElement>(null);
  const refChurnTrend = useRef<HTMLCanvasElement>(null);
  const refAtRisk = useRef<HTMLCanvasElement>(null);
  const refSubsDonut = useRef<HTMLCanvasElement>(null);
  const refNewSubs = useRef<HTMLCanvasElement>(null);
  const refCancels = useRef<HTMLCanvasElement>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [c, s] = await Promise.all([
        fetch(`${API}/dashboard/churn-chart`).then((r) => r.json()),
        fetch(`${API}/dashboard/subscriptions-chart`).then((r) => r.json()),
      ]);
      setChurn(c);
      setSubs(s);
    } catch {
      setError("Impossible de joindre le backend.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // draw churn charts
  useEffect(() => {
    if (!churn) return;
    const RISK_COLORS: Record<string, string> = {
      LOW: "#22c55e",
      MEDIUM: "#f59e0b",
      HIGH: "#f97316",
      CRITICAL: "#ef4444",
    };
    const donutData = ["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((k) => ({
      label: k,
      value: churn.distribution[k] ?? 0,
      color: RISK_COLORS[k],
    }));
    if (refChurnDonut.current) drawDonut(refChurnDonut.current, donutData);

    if (refChurnTrend.current && churn.trend.length > 0) {
      drawLine(
        refChurnTrend.current,
        churn.trend.map((t) => t.month),
        churn.trend.map((t) => t.avg_score),
        "#6366f1"
      );
    }

    if (refAtRisk.current && churn.at_risk_trend.length > 0) {
      drawBar(
        refAtRisk.current,
        churn.at_risk_trend.map((t) => t.month),
        [
          { label: "À risque", values: churn.at_risk_trend.map((t) => t.at_risk), color: "#ef4444" },
          { label: "Total scorés", values: churn.at_risk_trend.map((t) => t.total), color: "#e0e7ff" },
        ]
      );
    }
  }, [churn]);

  // draw subscription charts
  useEffect(() => {
    if (!subs) return;
    const subDonutData = [
      { label: "FREE", value: subs.plans.FREE, color: "#94a3b8" },
      { label: "PREMIUM", value: subs.plans.PREMIUM, color: "#6366f1" },
    ];
    if (refSubsDonut.current) drawDonut(refSubsDonut.current, subDonutData);

    if (refNewSubs.current && subs.new_subs_trend.length > 0) {
      drawBar(
        refNewSubs.current,
        subs.new_subs_trend.map((t) => t.month),
        [
          { label: "FREE", values: subs.new_subs_trend.map((t) => t.free), color: "#94a3b8" },
          { label: "PREMIUM", values: subs.new_subs_trend.map((t) => t.premium), color: "#6366f1" },
        ]
      );
    }

    if (refCancels.current && subs.cancellations_trend.length > 0) {
      drawLine(
        refCancels.current,
        subs.cancellations_trend.map((t) => t.month),
        subs.cancellations_trend.map((t) => t.cancellations),
        "#ef4444"
      );
    }
  }, [subs]);

  const RISK_COLORS: Record<string, string> = {
    LOW: "#22c55e", MEDIUM: "#f59e0b", HIGH: "#f97316", CRITICAL: "#ef4444",
  };

  return (
    <DashboardShell allowedRoles={["MODERATOR", "SUPER_ADMIN"]}>
      <div className="min-h-screen bg-gray-50 p-6">
        {/* header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Modérateur</h1>
            <p className="mt-1 text-sm text-gray-500">
              Churn · Abonnements · Prédictions ML — mis à jour chaque nuit à 2h
            </p>
          </div>
          <button
            onClick={load}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Actualiser
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex h-64 items-center justify-center text-gray-400">Chargement…</div>
        ) : (
          <>
            {/* ── SECTION 1 : CHURN ─────────────────────────────────────── */}
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-gray-400">
              Prédictions Churn
            </h2>

            {/* KPIs churn */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KPI label="Utilisateurs scorés" value={churn?.total_scored ?? 0} />
              <KPI
                label="Taux de churn"
                value={`${churn?.churn_rate_percent ?? 0}%`}
                sub="HIGH + CRITICAL"
              />
              <KPI
                label="À risque élevé"
                value={(churn?.distribution["HIGH"] ?? 0) + (churn?.distribution["CRITICAL"] ?? 0)}
                sub="HIGH + CRITICAL"
              />
              <KPI
                label="Risque faible"
                value={churn?.distribution["LOW"] ?? 0}
                sub="LOW"
              />
            </div>

            {/* Churn charts row */}
            <div className="mb-8 grid gap-6 lg:grid-cols-3">
              {/* Donut distribution */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <p className="mb-3 text-sm font-semibold text-gray-700">Distribution des risques</p>
                <canvas ref={refChurnDonut} width={200} height={200} className="mx-auto block" />
                <Legend
                  items={["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((k) => ({
                    label: k,
                    value: churn?.distribution[k] ?? 0,
                    color: RISK_COLORS[k],
                  }))}
                />
              </div>

              {/* Line — avg score trend */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <p className="mb-3 text-sm font-semibold text-gray-700">
                  Score moyen de churn (12 mois)
                </p>
                {(churn?.trend.length ?? 0) > 0 ? (
                  <canvas ref={refChurnTrend} width={340} height={200} className="w-full" />
                ) : (
                  <EmptyState />
                )}
              </div>

              {/* Bar — at-risk per month */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <p className="mb-3 text-sm font-semibold text-gray-700">
                  Utilisateurs à risque / mois
                </p>
                {(churn?.at_risk_trend.length ?? 0) > 0 ? (
                  <canvas ref={refAtRisk} width={340} height={200} className="w-full" />
                ) : (
                  <EmptyState />
                )}
              </div>
            </div>

            {/* ── SECTION 2 : ABONNEMENTS ───────────────────────────────── */}
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-gray-400">
              Abonnements & Plans
            </h2>

            {/* KPIs subs */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KPI label="Utilisateurs actifs" value={subs?.total_active_users ?? 0} />
              <KPI
                label="Taux premium"
                value={`${subs?.premium_rate_percent ?? 0}%`}
                sub="des utilisateurs actifs"
              />
              <KPI label="Comptes PREMIUM" value={subs?.plans.PREMIUM ?? 0} />
              <KPI label="Comptes FREE" value={subs?.plans.FREE ?? 0} />
            </div>

            {/* Subs charts row */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Donut plans */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <p className="mb-3 text-sm font-semibold text-gray-700">Répartition des plans</p>
                <canvas ref={refSubsDonut} width={200} height={200} className="mx-auto block" />
                <Legend
                  items={[
                    { label: "FREE", value: subs?.plans.FREE ?? 0, color: "#94a3b8" },
                    { label: "PREMIUM", value: subs?.plans.PREMIUM ?? 0, color: "#6366f1" },
                  ]}
                />
              </div>

              {/* Bar — new subs per month */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <p className="mb-3 text-sm font-semibold text-gray-700">
                  Nouveaux abonnements / mois
                </p>
                {(subs?.new_subs_trend.length ?? 0) > 0 ? (
                  <canvas ref={refNewSubs} width={340} height={200} className="w-full" />
                ) : (
                  <EmptyState />
                )}
              </div>

              {/* Line — cancellations */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <p className="mb-3 text-sm font-semibold text-gray-700">
                  Résiliations / mois
                </p>
                {(subs?.cancellations_trend.length ?? 0) > 0 ? (
                  <canvas ref={refCancels} width={340} height={200} className="w-full" />
                ) : (
                  <EmptyState />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}

function EmptyState() {
  return (
    <div className="flex h-[200px] items-center justify-center rounded-xl bg-gray-50 text-sm text-gray-400">
      Pas encore de données
    </div>
  );
}
