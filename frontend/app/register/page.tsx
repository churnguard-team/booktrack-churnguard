"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { saveAuth, getRoleRedirect } from "@/lib/auth";

const ROLES = [
  { value: "USER",      label: "Utilisateur",    desc: "Accès à la bibliothèque" },
  { value: "AUTHOR",    label: "Auteur",          desc: "Publier mes livres" },
  { value: "MODERATOR", label: "Modérateur",      desc: "Gérer les contenus" },
  { value: "ADMIN",     label: "Administrateur",  desc: "Statistiques & gestion" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", nom: "", prenom: "", role: "USER" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || "Erreur lors de l'inscription"); return; }
      saveAuth(data);
      router.push(getRoleRedirect(data.role));
    } catch {
      setError("Impossible de contacter le serveur");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "0.75rem 1rem", boxSizing: "border-box",
    background: "#161616", border: "1px solid #2a2a2a", borderRadius: "8px",
    color: "#f5f0e8", fontSize: "0.9rem", outline: "none",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "0.72rem", fontWeight: 600, color: "#888",
    letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.4rem",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0d0d0d", fontFamily: "'Inter', sans-serif", padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: "440px" }}>
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ fontSize: "0.65rem", letterSpacing: "0.25em", color: "#c9a84c", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.4rem" }}>
            BookTrack · ChurnGuard
          </div>
          <h1 style={{ margin: 0, fontSize: "1.9rem", fontWeight: 800, color: "#f5f0e8", letterSpacing: "-0.02em" }}>
            Créer un compte
          </h1>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={labelStyle}>Prénom</label>
              <input type="text" required value={form.prenom} onChange={e => set("prenom", e.target.value)} placeholder="Jean" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Nom</label>
              <input type="text" required value={form.nom} onChange={e => set("nom", e.target.value)} placeholder="Dupont" style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" required value={form.email} onChange={e => set("email", e.target.value)} placeholder="vous@exemple.com" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Mot de passe</label>
            <input type="password" required value={form.password} onChange={e => set("password", e.target.value)} placeholder="••••••••" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Rôle</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              {ROLES.map(({ value, label, desc }) => (
                <button key={value} type="button" onClick={() => set("role", value)} style={{
                  padding: "0.65rem 0.75rem", borderRadius: "8px", textAlign: "left",
                  background: form.role === value ? "rgba(201,168,76,0.1)" : "#161616",
                  border: form.role === value ? "1px solid #c9a84c" : "1px solid #2a2a2a",
                  cursor: "pointer",
                }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: form.role === value ? "#c9a84c" : "#888" }}>{label}</div>
                  <div style={{ fontSize: "0.68rem", color: "#444", marginTop: "0.1rem" }}>{desc}</div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ background: "#1a0a0a", border: "1px solid #4a1a1a", borderRadius: "8px", padding: "0.75rem 1rem", color: "#f87171", fontSize: "0.82rem" }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            padding: "0.85rem", borderRadius: "8px", border: "none",
            background: loading ? "#3a3020" : "linear-gradient(135deg, #c9a84c, #a07830)",
            color: "#111", fontWeight: 700, fontSize: "0.9rem",
            cursor: loading ? "not-allowed" : "pointer",
          }}>
            {loading ? "Création..." : "Créer mon compte"}
          </button>
        </form>

        <p style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.82rem", color: "#444" }}>
          Déjà un compte ?{" "}
          <Link href="/login" style={{ color: "#c9a84c", textDecoration: "none", fontWeight: 600 }}>Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
