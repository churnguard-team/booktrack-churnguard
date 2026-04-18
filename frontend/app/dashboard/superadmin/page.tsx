"use client";
import DashboardShell from "../DashboardShell";

function StatCard({ label, value, sub, accent = "#c9a84c" }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div style={{ background: "#161616", border: "1px solid #1e1e1e", borderRadius: "12px", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      <span style={{ fontSize: "0.7rem", color: "#555", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
      <span style={{ fontSize: "2.2rem", fontWeight: 800, color: accent, lineHeight: 1 }}>{value}</span>
      {sub && <span style={{ fontSize: "0.75rem", color: "#444" }}>{sub}</span>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#161616", border: "1px solid #1e1e1e", borderRadius: "12px", padding: "1.5rem" }}>
      <h3 style={{ margin: "0 0 1.25rem", fontSize: "0.85rem", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em" }}>{title}</h3>
      {children}
    </div>
  );
}

export default function SuperAdminDashboard() {
  const roles = [
    { role: "Super Admin", count: 1, color: "#c9a84c" },
    { role: "Administrateur", count: 3, color: "#a78bfa" },
    { role: "Modérateur", count: 5, color: "#34d399" },
    { role: "Auteur", count: 24, color: "#60a5fa" },
    { role: "Utilisateur", count: 1240, color: "#f5f0e8" },
  ];

  const recentActions = [
    { user: "Marie Leclerc", action: "A ajouté un livre", time: "il y a 5 min", role: "Auteur" },
    { user: "Ahmed Benali", action: "A modéré un contenu", time: "il y a 12 min", role: "Modérateur" },
    { user: "Sophie Martin", action: "S'est inscrite", time: "il y a 1h", role: "Utilisateur" },
    { user: "Paul Durand", action: "A mis à jour les stats", time: "il y a 2h", role: "Admin" },
  ];

  return (
    <DashboardShell allowedRoles={["SUPER_ADMIN"]}>
      <div style={{ padding: "2rem", color: "#f5f0e8" }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ fontSize: "0.7rem", color: "#c9a84c", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.4rem" }}>
            Vue globale
          </div>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800, color: "#f5f0e8", letterSpacing: "-0.02em" }}>
            Super Administration
          </h1>
          <p style={{ margin: "0.4rem 0 0", color: "#555", fontSize: "0.875rem" }}>
            Contrôle total de la plateforme BookTrack
          </p>
        </div>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          <StatCard label="Utilisateurs totaux" value="1 273" sub="dont 1 240 actifs" />
          <StatCard label="Livres publiés" value="847" sub="32 en attente" accent="#a78bfa" />
          <StatCard label="Taux de churn" value="8.4%" sub="HIGH + CRITICAL" accent="#f87171" />
          <StatCard label="Revenus mensuels" value="12 400 MAD" sub="abonnements actifs" accent="#34d399" />
          <StatCard label="Nouveaux (30j)" value="142" sub="utilisateurs inscrits" accent="#60a5fa" />
          <StatCard label="Actions rétention" value="38" sub="en cours" accent="#fbbf24" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          {/* Répartition des rôles */}
          <Section title="Répartition des rôles">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {roles.map(({ role, count, color }) => (
                <div key={role} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color }} />
                    <span style={{ fontSize: "0.85rem", color: "#aaa" }}>{role}</span>
                  </div>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color }}>{count}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* Activité récente */}
          <Section title="Activité récente">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {recentActions.map(({ user, action, time, role }, i) => (
                <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0,
                    background: "#1e1e1e", border: "1px solid #2a2a2a",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.7rem", fontWeight: 700, color: "#c9a84c",
                  }}>
                    {user[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.82rem", color: "#ccc", fontWeight: 500 }}>
                      <span style={{ color: "#f5f0e8", fontWeight: 600 }}>{user}</span> — {action}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "#444", marginTop: "0.1rem" }}>
                      {role} · {time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* Santé système */}
        <Section title="Santé de la plateforme">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
            {[
              { label: "API Backend", status: "Opérationnel", ok: true },
              { label: "Base de données", status: "Opérationnel", ok: true },
              { label: "Modèle ML", status: "Non déployé", ok: false },
              { label: "Notifications", status: "Opérationnel", ok: true },
            ].map(({ label, status, ok }) => (
              <div key={label} style={{ padding: "0.75rem 1rem", background: "#111", borderRadius: "8px", border: `1px solid ${ok ? "#1a2a1a" : "#2a1a1a"}` }}>
                <div style={{ fontSize: "0.72rem", color: "#555", marginBottom: "0.3rem" }}>{label}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: ok ? "#34d399" : "#f87171" }} />
                  <span style={{ fontSize: "0.78rem", fontWeight: 600, color: ok ? "#34d399" : "#f87171" }}>{status}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </DashboardShell>
  );
}
