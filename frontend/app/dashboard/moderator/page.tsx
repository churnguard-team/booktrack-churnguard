"use client";
import DashboardShell from "../DashboardShell";

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{ padding: "0.2rem 0.6rem", borderRadius: "99px", fontSize: "0.7rem", fontWeight: 700, color, background: bg, letterSpacing: "0.04em" }}>
      {label}
    </span>
  );
}

export default function ModeratorDashboard() {
  const pendingBooks = [
    { title: "L'Art du Silence", auteur: "Karim Mansouri", genre: "Roman", date: "12 Jan 2026", status: "EN_ATTENTE" },
    { title: "Algorithmes du Cœur", auteur: "Leila Benali", genre: "Science-Fiction", date: "11 Jan 2026", status: "EN_ATTENTE" },
    { title: "Les Dunes d'Or", auteur: "Youssef Alami", genre: "Historique", date: "10 Jan 2026", status: "EN_REVISION" },
    { title: "Mémoires Digitales", auteur: "Sara Tazi", genre: "Essai", date: "09 Jan 2026", status: "EN_ATTENTE" },
  ];

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    EN_ATTENTE:  { label: "En attente",  color: "#fbbf24", bg: "rgba(251,191,36,0.1)" },
    EN_REVISION: { label: "En révision", color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
    APPROUVE:    { label: "Approuvé",    color: "#34d399", bg: "rgba(52,211,153,0.1)" },
    REJETE:      { label: "Rejeté",      color: "#f87171", bg: "rgba(248,113,113,0.1)" },
  };

  return (
    <DashboardShell allowedRoles={["MODERATOR", "SUPER_ADMIN"]}>
      <div style={{ padding: "2rem", color: "#f5f0e8" }}>
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ fontSize: "0.7rem", color: "#c9a84c", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.4rem" }}>
            Espace modération
          </div>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800, color: "#f5f0e8", letterSpacing: "-0.02em" }}>
            Tableau de Modération
          </h1>
          <p style={{ margin: "0.4rem 0 0", color: "#555", fontSize: "0.875rem" }}>
            Validation des contenus, gestion des auteurs et contrôle éditorial
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
          {[
            { label: "En attente", value: 12, color: "#fbbf24" },
            { label: "Approuvés ce mois", value: 47, color: "#34d399" },
            { label: "Rejetés", value: 5, color: "#f87171" },
            { label: "Auteurs actifs", value: 24, color: "#c9a84c" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: "#161616", border: "1px solid #1e1e1e", borderRadius: "12px", padding: "1.25rem" }}>
              <div style={{ fontSize: "0.7rem", color: "#555", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>{label}</div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Livres en attente */}
        <div style={{ background: "#161616", border: "1px solid #1e1e1e", borderRadius: "12px", padding: "1.5rem", marginBottom: "1rem" }}>
          <h3 style={{ margin: "0 0 1.25rem", fontSize: "0.85rem", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Livres en attente de validation
          </h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1e1e1e" }}>
                {["Titre", "Auteur", "Genre", "Soumis le", "Statut", "Actions"].map(h => (
                  <th key={h} style={{ padding: "0.6rem 0.75rem", textAlign: "left", color: "#444", fontWeight: 600, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pendingBooks.map((book, i) => {
                const cfg = statusConfig[book.status];
                return (
                  <tr key={i} style={{ borderBottom: "1px solid #111" }}>
                    <td style={{ padding: "0.85rem 0.75rem", color: "#f5f0e8", fontWeight: 600 }}>{book.title}</td>
                    <td style={{ padding: "0.85rem 0.75rem", color: "#888" }}>{book.auteur}</td>
                    <td style={{ padding: "0.85rem 0.75rem", color: "#666" }}>{book.genre}</td>
                    <td style={{ padding: "0.85rem 0.75rem", color: "#555", fontSize: "0.78rem" }}>{book.date}</td>
                    <td style={{ padding: "0.85rem 0.75rem" }}>
                      <Badge label={cfg.label} color={cfg.color} bg={cfg.bg} />
                    </td>
                    <td style={{ padding: "0.85rem 0.75rem" }}>
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        <button style={{ padding: "0.3rem 0.65rem", borderRadius: "6px", border: "none", background: "rgba(52,211,153,0.1)", color: "#34d399", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer" }}>
                          Approuver
                        </button>
                        <button style={{ padding: "0.3rem 0.65rem", borderRadius: "6px", border: "none", background: "rgba(248,113,113,0.1)", color: "#f87171", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer" }}>
                          Rejeter
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
