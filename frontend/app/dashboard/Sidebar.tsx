"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearAuth } from "@/lib/auth";

type NavItem = { label: string; href: string; icon: string };

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  SUPER_ADMIN: [
    { label: "Vue globale", href: "/dashboard/superadmin", icon: "◈" },
    { label: "Modération", href: "/dashboard/moderator", icon: "⊞" },
    { label: "Churn & ML", href: "/admin/dashboard", icon: "◉" },
    { label: "Utilisateurs", href: "/admin/users", icon: "▣" },
  ],
  ADMIN: [
    { label: "Churn & ML", href: "/admin/dashboard", icon: "◉" },
    { label: "Utilisateurs", href: "/admin/users", icon: "▣" },
  ],
  MODERATOR: [
    { label: "Modération", href: "/dashboard/moderator", icon: "⊞" },
  ],
  AUTHOR: [
    { label: "Mes livres", href: "/dashboard/author", icon: "▣" },
  ],
  USER: [
    { label: "Ma bibliothèque", href: "/dashboard/user", icon: "▣" },
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
      background: "#eff6ff",
      display: "flex",
      flexDirection: "column",
      padding: "0",
      flexShrink: 0,
      borderRight: "1px solid #bfdbfe",
    }}>
      <div style={{ padding: "1.75rem 1.5rem 1.25rem", borderBottom: "1px solid #dbeafe" }}>
        <div style={{ fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#1d4ed8", fontWeight: 700, marginBottom: "0.55rem" }}>
          BookTrack
        </div>
        <div style={{ fontSize: "0.94rem", fontWeight: 700, marginBottom: "0.25rem", color: "#1e3a8a" }}>
          {ROLE_LABELS[role] ?? "Dashboard"}
        </div>
        <div style={{ color: "#475569", fontSize: "0.8rem" }}>
          {prenom} {nom}
        </div>
      </div>

      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.3rem", padding: "1rem" }}>
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              textDecoration: "none",
              color: pathname === item.href ? "#1e3a8a" : "#475569",
              background: pathname === item.href ? "#c7d2fe" : "transparent",
              padding: "0.85rem 1rem",
              borderRadius: "0.75rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              fontSize: "0.95rem",
              fontWeight: 500,
            }}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <button
        onClick={logout}
        style={{
          width: "calc(100% - 2rem)",
          margin: "0 1rem 1.25rem",
          padding: "0.85rem 1rem",
          borderRadius: "0.75rem",
          border: "none",
          background: "#2563eb",
          color: "#fff",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Déconnexion
      </button>
    </aside>
  );
}
