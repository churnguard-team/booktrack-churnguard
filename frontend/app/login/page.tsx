"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { saveAuth, getRoleRedirect } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || "Identifiants incorrects"); return; }
      saveAuth(data);
      router.push(getRoleRedirect(data.role));
    } catch {
      setError("Impossible de contacter le serveur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex",
      background: "#0d0d0d", fontFamily: "'Inter', sans-serif",
    }}>
      {/* Left panel */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: "3rem",
      }}>
        <div style={{ width: "100%", maxWidth: "380px" }}>
          {/* Brand */}
          <div style={{ marginBottom: "2.5rem" }}>
            <div style={{ fontSize: "0.65rem", letterSpacing: "0.25em", color: "#c9a84c", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.4rem" }}>
              BookTrack · ChurnGuard
            </div>
            <h1 style={{ margin: 0, fontSize: "1.9rem", fontWeight: 800, color: "#f5f0e8", letterSpacing: "-0.02em" }}>
              Connexion
            </h1>
            <p style={{ margin: "0.5rem 0 0", color: "#555", fontSize: "0.875rem" }}>
              Accédez à votre espace de gestion
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#888", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                Adresse email
              </label>
              <input
                type="email" required
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="vous@exemple.com"
                style={{
                  width: "100%", padding: "0.75rem 1rem", boxSizing: "border-box",
                  background: "#161616", border: "1px solid #2a2a2a", borderRadius: "8px",
                  color: "#f5f0e8", fontSize: "0.9rem", outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#888", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                Mot de passe
              </label>
              <input
                type="password" required
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="••••••••"
                style={{
                  width: "100%", padding: "0.75rem 1rem", boxSizing: "border-box",
                  background: "#161616", border: "1px solid #2a2a2a", borderRadius: "8px",
                  color: "#f5f0e8", fontSize: "0.9rem", outline: "none",
                }}
              />
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
              cursor: loading ? "not-allowed" : "pointer", letterSpacing: "0.02em",
              marginTop: "0.25rem",
            }}>
              {loading ? "Connexion..." : "Se connecter"}
            </button>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "0.25rem 0" }}>
              <div style={{ flex: 1, height: "1px", background: "#1e1e1e" }} />
              <span style={{ fontSize: "0.75rem", color: "#444" }}>ou</span>
              <div style={{ flex: 1, height: "1px", background: "#1e1e1e" }} />
            </div>

            {/* Google OAuth placeholder */}
            <button type="button" style={{
              padding: "0.75rem", borderRadius: "8px",
              background: "#161616", border: "1px solid #2a2a2a",
              color: "#ccc", fontWeight: 500, fontSize: "0.875rem",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M5.27 9.76A7.08 7.08 0 0 1 19.07 12c0 .68-.06 1.34-.17 1.97H12v-3.73h7.6A7.1 7.1 0 0 0 5.27 9.76z"/>
                <path fill="#34A853" d="M12 19.08a7.07 7.07 0 0 1-6.73-4.84l-3.3 2.55A11.94 11.94 0 0 0 12 24c3.24 0 5.95-1.18 7.93-3.12l-3.1-2.4A7.07 7.07 0 0 1 12 19.08z"/>
                <path fill="#4A90D9" d="M19.93 12c0-.68-.06-1.34-.17-1.97H12V14h4.44a3.8 3.8 0 0 1-1.65 2.49l3.1 2.4C19.13 17.3 19.93 14.84 19.93 12z"/>
                <path fill="#FBBC05" d="M5.27 14.24A7.1 7.1 0 0 1 4.92 12c0-.77.13-1.52.35-2.24L1.97 7.21A11.94 11.94 0 0 0 0 12c0 1.93.46 3.75 1.27 5.36l3.3-2.55-.3-.57z"/>
              </svg>
              Continuer avec Google
            </button>
          </form>

          <p style={{ marginTop: "1.75rem", textAlign: "center", fontSize: "0.82rem", color: "#444" }}>
            Pas encore de compte ?{" "}
            <Link href="/register" style={{ color: "#c9a84c", textDecoration: "none", fontWeight: 600 }}>
              S'inscrire
            </Link>
          </p>
          <p style={{ marginTop: "0.5rem", textAlign: "center", fontSize: "0.82rem", color: "#444" }}>
            <Link href="/" style={{ color: "#555", textDecoration: "none" }}>
              ← Continuer en tant que visiteur
            </Link>
          </p>
        </div>
      </div>

      {/* Right panel — decorative */}
      <div style={{
        width: "420px", background: "#111",
        borderLeft: "1px solid #1a1a1a",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "3rem", gap: "2rem",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.6 }}>◈</div>
          <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 700, color: "#f5f0e8", letterSpacing: "-0.01em" }}>
            Plateforme de gestion éditoriale
          </h2>
          <p style={{ margin: "0.75rem 0 0", color: "#555", fontSize: "0.82rem", lineHeight: 1.7 }}>
            Gérez votre catalogue, suivez l'engagement lecteur et anticipez le churn grâce à l'intelligence artificielle.
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%" }}>
          {[
            { role: "Super Admin", desc: "Contrôle total de la plateforme" },
            { role: "Administrateur", desc: "Statistiques et gestion du catalogue" },
            { role: "Modérateur", desc: "Validation des contenus et auteurs" },
            { role: "Auteur", desc: "Publication et suivi de ses livres" },
          ].map(({ role, desc }) => (
            <div key={role} style={{
              padding: "0.75rem 1rem", borderRadius: "8px",
              background: "#161616", border: "1px solid #1e1e1e",
              display: "flex", flexDirection: "column", gap: "0.15rem",
            }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#c9a84c", letterSpacing: "0.04em" }}>{role}</span>
              <span style={{ fontSize: "0.75rem", color: "#555" }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
