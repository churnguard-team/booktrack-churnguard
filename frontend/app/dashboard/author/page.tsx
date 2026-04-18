"use client";
import { useState } from "react";
import DashboardShell from "../DashboardShell";

export default function AuthorDashboard() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", genre: "", nb_pages: "", langue: "fr" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const myBooks = [
    { title: "L'Ombre du Désert", genre: "Roman", pages: 312, status: "APPROUVE", vues: 1240 },
    { title: "Fragments d'Étoiles", genre: "Poésie", pages: 128, status: "EN_ATTENTE", vues: 0 },
    { title: "Le Dernier Algorithme", genre: "SF", pages: 445, status: "APPROUVE", vues: 3870 },
  ];

  const statusCfg: Record<string, { label: string; color: string; bg: string }> = {
    APPROUVE:   { label: "Publié",      color: "#34d399", bg: "rgba(52,211,153,0.1)" },
    EN_ATTENTE: { label: "En attente",  color: "#fbbf24", bg: "rgba(251,191,36,0.1)" },
    REJETE:     { label: "Rejeté",      color: "#f87171", bg: "rgba(248,113,113,0.1)" },
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/books`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, nb_pages: form.nb_pages ? Number(form.nb_pages) : undefined }),
      });
      if (res.ok) { setSuccess(true); setShowForm(false); setForm({ title: "", description: "", genre: "", nb_pages: "", langue: "fr" }); }
    } finally { setSubmitting(false); }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "0.7rem 0.9rem", boxSizing: "border-box",
    background: "#111", border: "1px solid #2a2a2a", borderRadius: "8px",
    color: "#f5f0e8", fontSize: "0.875rem", outline: "none",
  };

  return (
    <DashboardShell allowedRoles={["AUTHOR", "SUPER_ADMIN"]}>
      <div style={{ padding: "2rem", color: "#f5f0e8" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ fontSize: "0.7rem", color: "#c9a84c", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.4rem" }}>
              Espace auteur
            </div>
            <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800, color: "#f5f0e8", letterSpacing: "-0.02em" }}>
              Mes Publications
            </h1>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{
            padding: "0.7rem 1.25rem", borderRadius: "8px", border: "none",
            background: "linear-gradient(135deg, #c9a84c, #a07830)",
            color: "#111", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer",
          }}>
            + Soumettre un livre
          </button>
        </div>

        {success && (
          <div style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: "8px", padding: "0.75rem 1rem", color: "#34d399", fontSize: "0.85rem", marginBottom: "1rem" }}>
            Livre soumis avec succès — en attente de validation par un modérateur.
          </div>
        )}

        {/* Formulaire */}
        {showForm && (
          <div style={{ background: "#161616", border: "1px solid #1e1e1e", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem" }}>
            <h3 style={{ margin: "0 0 1.25rem", fontSize: "0.85rem", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Nouveau livre
            </h3>
            <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <input type="text" required placeholder="Titre du livre" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} style={inputStyle} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <textarea placeholder="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }} />
              </div>
              <input type="text" placeholder="Genre" value={form.genre} onChange={e => setForm(p => ({ ...p, genre: e.target.value }))} style={inputStyle} />
              <input type="number" placeholder="Nombre de pages" value={form.nb_pages} onChange={e => setForm(p => ({ ...p, nb_pages: e.target.value }))} style={inputStyle} />
              <div style={{ gridColumn: "1 / -1", display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: "0.65rem 1.25rem", borderRadius: "8px", background: "transparent", border: "1px solid #2a2a2a", color: "#666", cursor: "pointer", fontSize: "0.875rem" }}>
                  Annuler
                </button>
                <button type="submit" disabled={submitting} style={{ padding: "0.65rem 1.25rem", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, #c9a84c, #a07830)", color: "#111", fontWeight: 700, cursor: "pointer", fontSize: "0.875rem" }}>
                  {submitting ? "Envoi..." : "Soumettre"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
          {[
            { label: "Livres publiés", value: 2, color: "#34d399" },
            { label: "En attente", value: 1, color: "#fbbf24" },
            { label: "Vues totales", value: "5 110", color: "#c9a84c" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: "#161616", border: "1px solid #1e1e1e", borderRadius: "12px", padding: "1.25rem" }}>
              <div style={{ fontSize: "0.7rem", color: "#555", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>{label}</div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Liste livres */}
        <div style={{ background: "#161616", border: "1px solid #1e1e1e", borderRadius: "12px", padding: "1.5rem" }}>
          <h3 style={{ margin: "0 0 1.25rem", fontSize: "0.85rem", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Mes livres
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {myBooks.map((book, i) => {
              const cfg = statusCfg[book.status];
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem", background: "#111", borderRadius: "10px", border: "1px solid #1a1a1a" }}>
                  <div>
                    <div style={{ fontWeight: 600, color: "#f5f0e8", marginBottom: "0.2rem" }}>{book.title}</div>
                    <div style={{ fontSize: "0.75rem", color: "#555" }}>{book.genre} · {book.pages} pages</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                    {book.vues > 0 && <span style={{ fontSize: "0.78rem", color: "#666" }}>{book.vues.toLocaleString()} vues</span>}
                    <span style={{ padding: "0.2rem 0.6rem", borderRadius: "99px", fontSize: "0.7rem", fontWeight: 700, color: cfg.color, background: cfg.bg }}>
                      {cfg.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
