"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearAuth } from "@/lib/auth";

type NavItem = { label: string; href: string; icon: string };

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  SUPER_ADMIN: [
    { label: "Vue globale",      href: "/dashboard/superadmin",           icon: "◈" },
    { label: "Modération",       href: "/dashboard/moderator",            icon: "⊞" },
    { label: "Churn & ML",       href: "/admin/dashboard",                icon: "◉" },
    { label: "Utilisateurs",     href: "/admin/users",                    icon: "◎" },
    { label: "Catalogue",        href: "/admin/books",                    icon: "▣" },
  ],
  ADMIN: [
    { label: "Statistiques",     href: "/admin/dashboard",                icon: "◉" },
    { label: "Catalogue",        href: "/admin/books",                    icon: "▣" },
    { label: "Utilisateurs",     href: "/admin/users",                    icon: "◎" },
  ],
  MODERATOR: [
    { label: "Modération",       href: "/dashboard/moderator",            icon: "⊞" },
    { label: "Catalogue",        href: "/admin/books",                    icon: "▣" },
  ],
  AUTHOR: [
    { label: "Mes livres",       href: "/dashboard/author",               icon: "▣" },
  ],
  USER: [
    { label: "Ma bibliothèque",  href: "/dashboard/user",                 icon: "▣" },
  ],
};

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Administrateur",
  MODERATOR: "Modérateur",
  AUTHOR: "Auteur",
  USER: "Utilisateur",
};

export default function Sidebar({ role, nom, prenom }: { role: string; nom: string; prenom: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const items = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.USER;

  function logout() {
    clearAuth();
    router.push("/login");
  }

  return (
    <aside style={{
      width: "240px",
      minHeight: "100vh",
      background: "#111111",
      display: "flex",
      flexDirection: "column",
      padding: "0",
      flexShrink: 0,
      borderRight: "1px solid #222",
    }}>
      {/* Logo */}
      <div style={{ padding: "1.75rem 1.5rem 1.25rem", borderBottom: "1px solid #1e1e1e" }}>
        <div style={{ fontSize: "0.65rem", letterSpacing: "0.2em", color: "#8a7a5a", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.3rem" }}>
          BookTrack
        </div>
        <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f5f0e8", letterSpacing: "-0.01em" }}>
          ChurnGuard
        </div>
      </div>

      {/* User info */}
      <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #1e1e1e" }}>
        <div style={{
          width: "38px", height: "38px", borderRadius: "50%",
          background: "linear-gradient(135deg, #c9a84c, #8a6a2a)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.9rem", fontWeight: 700, color: "#111", marginBottom: "0.6rem",
        }}>
          {prenom[0]}{nom[0]}
        </div>
        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#f5f0e8" }}>{prenom} {nom}</div>
        <div style={{ fontSize: "0.7rem", color: "#c9a84c", fontWeight: 600, marginTop: "0.15rem", letterSpacing: "0.05em" }}>
          {ROLE_LABELS[role] ?? role}
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "1rem 0.75rem", display: "flex", flexDirection: "column", gap: "0.15rem" }}>
        {items.map(({ label, href, icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} style={{
              display: "flex", alignItems: "center", gap: "0.75rem",
              padding: "0.6rem 0.75rem", borderRadius: "8px",
              textDecoration: "none",
              background: active ? "rgba(201,168,76,0.12)" : "transparent",
              color: active ? "#c9a84c" : "#9a9a9a",
              fontSize: "0.85rem", fontWeight: active ? 600 : 400,
              transition: "all 0.15s",
              borderLeft: active ? "2px solid #c9a84c" : "2px solid transparent",
            }}>
              <span style={{ fontSize: "0.9rem" }}>{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: "1rem 0.75rem", borderTop: "1px solid #1e1e1e" }}>
        <button onClick={logout} style={{
          width: "100%", padding: "0.6rem 0.75rem", borderRadius: "8px",
          background: "transparent", border: "1px solid #2a2a2a",
          color: "#666", fontSize: "0.82rem", cursor: "pointer",
          textAlign: "left", display: "flex", alignItems: "center", gap: "0.6rem",
        }}>
          <span>⊗</span> Déconnexion
        </button>
      </div>
    </aside>
  );
}
