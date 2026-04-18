"use client";
import DashboardShell from "../DashboardShell";
import Link from "next/link";

export default function UserDashboard() {
  const myBooks = [
    { title: "L'Ombre du Désert", auteur: "K. Mansouri", status: "READING", pages_lues: 145, nb_pages: 312, note: null },
    { title: "Le Dernier Algorithme", auteur: "S. Tazi", status: "READ", pages_lues: 445, nb_pages: 445, note: 5 },
    { title: "Fragments d'Étoiles", auteur: "L. Benali", status: "TO_READ", pages_lues: 0, nb_pages: 128, note: null },
    { title: "Mémoires Digitales", auteur: "Y. Alami", status: "ABANDONED", pages_lues: 60, nb_pages: 290, note: 2 },
  ];

  const statusCfg: Record<string, { label: string; color: string }> = {
    READING:   { label: "En cours",    color: "#60a5fa" },
    READ:      { label: "Lu",          color: "#34d399" },
    TO_READ:   { label: "À lire",      color: "#888" },
    ABANDONED: { label: "Abandonné",   color: "#f87171" },
    FAVOURITE: { label: "Favori",      color: "#c9a84c" },
  };

  return (
    <DashboardShell allowedRoles={["USER", "SUPER_ADMIN"]}>
      <div style={{ padding: "2rem", color: "#f5f0e8" }}>
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ fontSize: "0.7rem", color: "#c9a84c", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.4rem" }}>
            Espace lecteur
          </div>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800, color: "#f5f0e8", letterSpacing: "-0.02em" }}>
            Ma Bibliothèque
          </h1>
          <p style={{ margin: "0.4rem 0 0", color: "#555", fontSize: "0.875rem" }}>
            Suivez vos lectures, notez vos livres, atteignez vos objectifs
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
          {[
            { label: "Livres lus", value: 1, color: "#34d399" },
            { label: "En cours", value: 1, color: "#60a5fa" },
            { label: "À lire", value: 1, color: "#888" },
            { label: "Objectif annuel", value: "1 / 12", color: "#c9a84c" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: "#161616", border: "1px solid #1e1e1e", borderRadius: "12px", padding: "1.25rem" }}>
              <div style={{ fontSize: "0.7rem", color: "#555", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>{label}</div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Abonnement */}
        <div style={{ background: "linear-gradient(135deg, #1a1500, #2a2000)", border: "1px solid #3a2e10", borderRadius: "12px", padding: "1.25rem 1.5rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ fontSize: "0.7rem", color: "#c9a84c", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.3rem" }}>
              Abonnement actuel
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f5f0e8" }}>Plan Gratuit</div>
            <div style={{ fontSize: "0.78rem", color: "#666", marginTop: "0.2rem" }}>Accès limité au catalogue</div>
          </div>
          <button style={{ padding: "0.65rem 1.5rem", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, #c9a84c, #a07830)", color: "#111", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer" }}>
            Passer Premium
          </button>
        </div>

        {/* Mes livres */}
        <div style={{ background: "#161616", border: "1px solid #1e1e1e", borderRadius: "12px", padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <h3 style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Mes lectures
            </h3>
            <Link href="/admin/books" style={{ fontSize: "0.78rem", color: "#c9a84c", textDecoration: "none", fontWeight: 600 }}>
              Parcourir le catalogue →
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {myBooks.map((book, i) => {
              const cfg = statusCfg[book.status];
              const pct = book.nb_pages > 0 ? Math.round((book.pages_lues / book.nb_pages) * 100) : 0;
              return (
                <div key={i} style={{ padding: "1rem", background: "#111", borderRadius: "10px", border: "1px solid #1a1a1a" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: book.status === "READING" ? "0.75rem" : 0 }}>
                    <div>
                      <div style={{ fontWeight: 600, color: "#f5f0e8" }}>{book.title}</div>
                      <div style={{ fontSize: "0.75rem", color: "#555", marginTop: "0.15rem" }}>{book.auteur}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      {book.note && (
                        <span style={{ fontSize: "0.78rem", color: "#c9a84c" }}>{"★".repeat(book.note)}{"☆".repeat(5 - book.note)}</span>
                      )}
                      <span style={{ padding: "0.2rem 0.6rem", borderRadius: "99px", fontSize: "0.7rem", fontWeight: 700, color: cfg.color, background: `${cfg.color}18` }}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                  {book.status === "READING" && (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                        <span style={{ fontSize: "0.72rem", color: "#555" }}>Progression</span>
                        <span style={{ fontSize: "0.72rem", color: "#888" }}>{book.pages_lues} / {book.nb_pages} pages ({pct}%)</span>
                      </div>
                      <div style={{ height: "4px", borderRadius: "99px", background: "#1e1e1e" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: "#60a5fa", borderRadius: "99px" }} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
