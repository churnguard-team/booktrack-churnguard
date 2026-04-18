import ChurnBar from "./ChurnBar";
import RiskBadge from "./RiskBadge";

// ── Types ──────────────────────────────────────────────────────────────────
type DashboardStats = {
  kpis: {
    total_users: number;
    active_users: number;
    total_books: number;
    active_subscriptions: number;
    premium_subscriptions: number;
    churn_rate_percent: number;
    at_risk_count: number;
    new_users_30d: number;
  };
  churn_distribution: { LOW: number; MEDIUM: number; HIGH: number; CRITICAL: number };
  at_risk_users: {
    id: string;
    email: string;
    nom: string;
    prenom: string;
    score: number;
    niveau_risque: string;
    date_calcul: string | null;
    abonnement: string;
  }[];
  reading_stats: { lus: number; en_cours: number; abandonnes: number; note_moyenne: number | null };
  recent_events: { type: string; total: number }[];
  retention_distribution: Record<string, number>;
};

// ── Data fetching ──────────────────────────────────────────────────────────
async function getStats(): Promise<DashboardStats | null> {
  const apiUrl = process.env.API_URL || "http://localhost:8000";
  try {
    const res = await fetch(`${apiUrl}/dashboard/stats`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ── Sub-components ─────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, accent,
}: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "1.25rem 1.5rem",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        gap: "0.3rem",
      }}
    >
      <span style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </span>
      <span style={{ fontSize: "2rem", fontWeight: 800, color: accent ?? "#111827", lineHeight: 1 }}>
        {value}
      </span>
      {sub && <span style={{ fontSize: "0.78rem", color: "#9ca3af" }}>{sub}</span>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "1.5rem",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      <h2 style={{ margin: "0 0 1.25rem", fontSize: "1rem", fontWeight: 700, color: "#111827" }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const stats = await getStats();

  const navStyle: React.CSSProperties = {
    display: "inline-block",
    padding: "0.45rem 0.85rem",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    textDecoration: "none",
    color: "#374151",
    fontSize: "0.85rem",
    fontWeight: 500,
  };

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif", background: "#f9fafb", minHeight: "100vh" }}>
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 800, color: "#111827" }}>
            Dashboard Modérateur
          </h1>
          <p style={{ margin: "0.25rem 0 0", color: "#6b7280", fontSize: "0.875rem" }}>
            Surveillance du churn · Engagement · Rétention
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Link href="/admin/books" style={navStyle}>📚 Livres</Link>
          <Link href="/admin/users" style={navStyle}>👥 Utilisateurs</Link>
        </div>
      </div>

      {!stats ? (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "10px", padding: "1.5rem", color: "#991b1b" }}>
          ⚠️ Impossible de charger les statistiques. Vérifiez que le backend est démarré.
        </div>
      ) : (
        <>
          {/* ── KPI Grid ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: "1rem",
              marginBottom: "1.5rem",
            }}
          >
            <KpiCard label="Utilisateurs" value={stats.kpis.total_users} sub={`${stats.kpis.active_users} actifs`} />
            <KpiCard label="Nouveaux (30j)" value={stats.kpis.new_users_30d} sub="derniers 30 jours" accent="#2563eb" />
            <KpiCard label="Livres" value={stats.kpis.total_books} />
            <KpiCard label="Abonnements actifs" value={stats.kpis.active_subscriptions} sub={`${stats.kpis.premium_subscriptions} premium`} accent="#7c3aed" />
            <KpiCard
              label="Taux de churn"
              value={`${stats.kpis.churn_rate_percent}%`}
              sub="HIGH + CRITICAL"
              accent={stats.kpis.churn_rate_percent > 20 ? "#ef4444" : stats.kpis.churn_rate_percent > 10 ? "#f97316" : "#22c55e"}
            />
            <KpiCard label="Utilisateurs à risque" value={stats.kpis.at_risk_count} sub="HIGH + CRITICAL" accent="#ef4444" />
            <KpiCard
              label="Note moyenne"
              value={stats.reading_stats.note_moyenne ? `${stats.reading_stats.note_moyenne}/5` : "—"}
              sub="lectures notées"
              accent="#f59e0b"
            />
            <KpiCard label="Livres lus" value={stats.reading_stats.lus} sub={`${stats.reading_stats.en_cours} en cours`} />
          </div>

          {/* ── Row 2 : Churn + Rétention ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
            <Section title="📊 Distribution du risque churn">
              <ChurnBar distribution={stats.churn_distribution} />
              <p style={{ marginTop: "1rem", fontSize: "0.78rem", color: "#9ca3af" }}>
                Basé sur les derniers scores ML calculés
              </p>
            </Section>

            <Section title="🔁 Actions de rétention">
              {Object.keys(stats.retention_distribution).length === 0 ? (
                <p style={{ color: "#9ca3af", fontSize: "0.85rem" }}>Aucune action enregistrée</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {Object.entries(stats.retention_distribution).map(([status, count]) => (
                    <div key={status} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.85rem", color: "#374151", fontWeight: 500 }}>{status}</span>
                      <span
                        style={{
                          background: "#f3f4f6",
                          borderRadius: "99px",
                          padding: "0.15rem 0.65rem",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          color: "#111827",
                        }}
                      >
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid #f3f4f6" }}>
                <p style={{ margin: "0 0 0.75rem", fontSize: "0.85rem", fontWeight: 700, color: "#374151" }}>
                  📖 Activité de lecture
                </p>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  {[
                    { label: "Lus", value: stats.reading_stats.lus, color: "#22c55e" },
                    { label: "En cours", value: stats.reading_stats.en_cours, color: "#3b82f6" },
                    { label: "Abandonnés", value: stats.reading_stats.abandonnes, color: "#f97316" },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "1.4rem", fontWeight: 800, color }}>{value}</div>
                      <div style={{ fontSize: "0.72rem", color: "#9ca3af" }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          </div>

          {/* ── Utilisateurs à risque ── */}
          <Section title="🚨 Utilisateurs à risque (HIGH & CRITICAL)">
            {stats.at_risk_users.length === 0 ? (
              <p style={{ color: "#9ca3af", fontSize: "0.85rem" }}>
                ✅ Aucun utilisateur à risque élevé détecté.
              </p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #f3f4f6" }}>
                      {["Utilisateur", "Email", "Abonnement", "Score churn", "Risque", "Calculé le"].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: "0.6rem 0.75rem",
                            textAlign: "left",
                            color: "#6b7280",
                            fontWeight: 600,
                            fontSize: "0.75rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.at_risk_users.map((u, i) => (
                      <tr
                        key={u.id}
                        style={{
                          borderBottom: "1px solid #f9fafb",
                          background: i % 2 === 0 ? "#fff" : "#fafafa",
                        }}
                      >
                        <td style={{ padding: "0.65rem 0.75rem", fontWeight: 600, color: "#111827" }}>
                          {u.prenom} {u.nom}
                        </td>
                        <td style={{ padding: "0.65rem 0.75rem", color: "#6b7280" }}>{u.email}</td>
                        <td style={{ padding: "0.65rem 0.75rem" }}>
                          <span
                            style={{
                              background: u.abonnement === "PREMIUM" ? "#ede9fe" : "#f3f4f6",
                              color: u.abonnement === "PREMIUM" ? "#6d28d9" : "#374151",
                              borderRadius: "99px",
                              padding: "0.15rem 0.55rem",
                              fontSize: "0.72rem",
                              fontWeight: 700,
                            }}
                          >
                            {u.abonnement}
                          </span>
                        </td>
                        <td style={{ padding: "0.65rem 0.75rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <div
                              style={{
                                width: "60px",
                                height: "6px",
                                borderRadius: "99px",
                                background: "#f3f4f6",
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  height: "100%",
                                  width: `${Math.round(u.score * 100)}%`,
                                  background: u.score > 0.8 ? "#ef4444" : "#f97316",
                                  borderRadius: "99px",
                                }}
                              />
                            </div>
                            <span style={{ fontWeight: 700, color: "#111827" }}>
                              {Math.round(u.score * 100)}%
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: "0.65rem 0.75rem" }}>
                          <RiskBadge level={u.niveau_risque} />
                        </td>
                        <td style={{ padding: "0.65rem 0.75rem", color: "#9ca3af", fontSize: "0.78rem" }}>
                          {u.date_calcul ? new Date(u.date_calcul).toLocaleDateString("fr-FR") : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          {/* ── Événements récents ── */}
          {stats.recent_events.length > 0 && (
            <div style={{ marginTop: "1rem" }}>
              <Section title="⚡ Événements récents (7 derniers jours)">
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  {stats.recent_events.map(({ type, total }) => (
                    <div
                      key={type}
                      style={{
                        background: "#f0f9ff",
                        border: "1px solid #bae6fd",
                        borderRadius: "10px",
                        padding: "0.75rem 1.25rem",
                        textAlign: "center",
                        minWidth: "110px",
                      }}
                    >
                      <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0369a1" }}>{total}</div>
                      <div style={{ fontSize: "0.72rem", color: "#0284c7", fontWeight: 600, marginTop: "0.2rem" }}>
                        {type.replace(/_/g, " ")}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          )}

          {/* ── ML Info Banner ── */}
          <div
            style={{
              marginTop: "1rem",
              background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
              borderRadius: "12px",
              padding: "1.5rem 2rem",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: "1rem" }}>🤖 Machine Learning — Churn Prediction</p>
              <p style={{ margin: "0.3rem 0 0", fontSize: "0.82rem", color: "#c7d2fe" }}>
                Les scores sont calculés par un modèle ML (Random Forest / XGBoost) basé sur l'activité,
                les habitudes de lecture, l'historique d'abonnement et les événements utilisateur.
              </p>
            </div>
            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
              {[
                { label: "Modèles entraînés", key: "ml_models" },
                { label: "Scores calculés", value: Object.values(stats.churn_distribution).reduce((a, b) => a + b, 0) },
                { label: "Taux de risque", value: `${stats.kpis.churn_rate_percent}%` },
              ].map(({ label, value }) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800 }}>{value ?? "—"}</div>
                  <div style={{ fontSize: "0.7rem", color: "#a5b4fc" }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
