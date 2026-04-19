"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import SearchInput from "@/app/admin/books/SearchInput";
import { Suspense } from "react";

// Pages sur lesquelles la barre de recherche doit apparaître dans la navbar
const SEARCH_PAGES = ["/", "/user/books", "/admin/books"];

export default function Navbar() {
  const [isOpen, setIsOpen]       = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Détecté depuis le cookie
  const router   = useRouter();
  const pathname = usePathname();

  const showSearch = SEARCH_PAGES.includes(pathname);

  // ===== DÉTECTION DE LA CONNEXION =====
  // On lit le cookie côté client pour savoir si l'utilisateur est connecté
  useEffect(() => {
    const hasCookie = document.cookie
      .split("; ")
      .some((c) => c.startsWith("user_session="));
    setIsLoggedIn(hasCookie);
  }, [pathname]); // Re-vérifier à chaque changement de page

  const handleLogout = () => {
    // Suppression du cookie → déconnexion
    document.cookie = "user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    setIsLoggedIn(false);
    router.push("/login");
  };

  return (
    <nav style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "0.75rem 2rem", backgroundColor: "#fff", borderBottom: "1px solid #ddd",
      gap: "1rem"
    }}>

      {/* LOGO — cliquable vers l'accueil */}
      <Link href="/" style={{ fontWeight: "bold", fontSize: "1.3rem", color: "#2563eb", flexShrink: 0, textDecoration: "none" }}>
        BookTrack
      </Link>

      {/* BARRE DE RECHERCHE — centre, visible sur les pages livres */}
      {showSearch && isLoggedIn && (
        <div style={{ flex: 1, maxWidth: "480px" }}>
          <Suspense fallback={<div style={{ height: "36px" }} />}>
            <SearchInput />
          </Suspense>
        </div>
      )}

      {/* ===== DROITE : Sign In OU Profil ===== */}
      <div style={{ position: "relative", flexShrink: 0, display: "flex", alignItems: "center", gap: "0.75rem" }}>

        {!isLoggedIn ? (
          // ===== PAS CONNECTÉ → bouton Sign In =====
          <Link
            href="/login"
            style={{
              padding: "0.5rem 1.25rem",
              backgroundColor: "#2563eb",
              color: "#fff",
              borderRadius: "999px",
              fontWeight: "600",
              fontSize: "0.9rem",
              textDecoration: "none",
              transition: "background 0.2s",
            }}
          >
            Sign In
          </Link>
        ) : (
          // ===== CONNECTÉ → bouton Avatar + menu déroulant =====
          <>
            <button
              onClick={() => setIsOpen(!isOpen)}
              style={{
                width: "45px", height: "45px", borderRadius: "50%",
                backgroundColor: "#111", color: "#fff", border: "none",
                cursor: "pointer", fontWeight: "bold", fontSize: "1.1rem"
              }}
            >
              U
            </button>

            {isOpen && (
              <div style={{
                position: "absolute", top: "55px", right: "0",
                backgroundColor: "#fff", border: "1px solid #ddd",
                borderRadius: "8px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                width: "160px", overflow: "hidden", zIndex: 10
              }}>
                <Link
                  href={pathname.startsWith("/admin") ? "/admin/profil" : "/user/profil"}
                  style={{ display: "block", padding: "12px", color: "#333", textDecoration: "none", borderBottom: "1px solid #eee" }}
                >
                  Voir Profil
                </Link>
                {!pathname.startsWith("/admin") && (
                  <Link
                    href="/user/favourites"
                    style={{ display: "block", padding: "12px", color: "#e11d48", textDecoration: "none", borderBottom: "1px solid #eee" }}
                  >
                    ❤️ Mes Favoris
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  style={{ display: "block", width: "100%", padding: "12px", color: "red", backgroundColor: "transparent", border: "none", textAlign: "left", cursor: "pointer", fontWeight: "bold" }}
                >
                  Se déconnecter
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </nav>
  );
}
