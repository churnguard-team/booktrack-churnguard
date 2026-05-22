"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, AuthUser } from "@/lib/auth";
import Sidebar from "./Sidebar";

export default function DashboardShell({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: string[];
}) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    if (!auth) {
      router.replace("/login");
      return;
    }
    if (!allowedRoles.includes(auth.role)) {
      router.replace("/login");
      return;
    }
    setUser(auth);
    setChecking(false);
  }, [allowedRoles, router]);

  if (checking) {
    return (
      <div style={{ minHeight: "100vh", background: "#0d0d0d", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#c9a84c", fontSize: "0.9rem", letterSpacing: "0.1em" }}>CHARGEMENT...</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#090909", color: "#fff" }}>
      <Sidebar role={user?.role ?? "USER"} nom={user?.nom ?? ""} prenom={user?.prenom ?? ""} />
      <main style={{ flex: 1, padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {children}
      </main>
    </div>
  );
}
