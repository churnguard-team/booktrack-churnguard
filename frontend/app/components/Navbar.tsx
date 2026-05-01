"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import SearchInput from "@/app/admin/books/SearchInput";
import { Suspense } from "react";
import { useTranslation } from "@/app/i18n/useTranslation";

// Pages sur lesquelles la barre de recherche doit apparaître dans la navbar
const SEARCH_PAGES = ["/", "/user/books", "/admin/books"];

/**
 * Composant Navbar : Barre de navigation principale de l'application.
 * Contient le logo, un menu de catégories (avec listes déroulantes), une barre de recherche 
 * et les options de profil/connexion.
 * 
 * @returns {JSX.Element} L'élément React représentant la barre de navigation.
 */
export default function Navbar() {
  const [isOpen, setIsOpen]       = useState(false); // Gère le menu de profil (à droite)
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Détecté depuis le cookie
  const [homeUrl, setHomeUrl]       = useState("/"); // Lien d'accueil dynamique (/, /user/books ou /admin/books)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null); // Gère quel sous-menu de catégorie est ouvert
  const router   = useRouter();
  const pathname = usePathname();
  const { t, locale } = useTranslation();

  const showSearch = SEARCH_PAGES.includes(pathname);

  /**
   * Vérifie si l'utilisateur est connecté au chargement du composant et 
   * à chaque changement de page (pathname).
   * Lit et décode le cookie 'user_session' pour connaître le rôle de l'utilisateur.
   * 
   * @effect Met à jour l'état `isLoggedIn` et `homeUrl` (pour le logo).
   */
  useEffect(() => {
    const sessionCookie = document.cookie
      .split("; ")
      .find((c) => c.startsWith("user_session="));
      
    if (sessionCookie) {
      setIsLoggedIn(true);
      try {
        // Le cookie est encodé (URI), on le décode puis on le parse en JSON
        const cookieValue = decodeURIComponent(sessionCookie.split("=")[1]);
        const user = JSON.parse(cookieValue);
        
        // On définit la page d'accueil selon le rôle (admin ou user normal)
        if (user.role === "admin") {
          setHomeUrl("/admin/books");
        } else {
          setHomeUrl("/user/books");
        }
      } catch (error) {
        // En cas d'erreur de parsing, on redirige vers /user/books par défaut
        setHomeUrl("/user/books");
      }
    } else {
      setIsLoggedIn(false);
      setHomeUrl("/"); // Si non connecté, le logo pointe vers la landing page (/)
    }
  }, [pathname]);

  /**
   * Gère la déconnexion de l'utilisateur.
   * Supprime le cookie 'user_session' et redirige l'utilisateur vers la page de connexion.
   */
  const handleLogout = () => {
    document.cookie = "user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    setIsLoggedIn(false);
    router.push("/login");
  };

  /**
   * Alterne l'état d'un menu déroulant spécifique dans les catégories.
   * Si on clique sur un menu déjà ouvert, on le ferme (null).
   * 
   * @param {string} menuName - L'identifiant du menu à ouvrir (ex: 'romans').
   */
  const toggleDropdown = (menuName: string) => {
    setOpenDropdown(openDropdown === menuName ? null : menuName);
  };

  return (
    <nav style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "0.75rem 2rem", backgroundColor: "#fff", /* Couleurs d'origine restaurées */
      borderBottom: "1px solid #ddd", gap: "1rem", flexWrap: "wrap", color: "#333"
    }}>

      {/* 
        LOGO — redirige vers l'accueil dynamique (homeUrl) 
        - Non connecté : /
        - User : /user/books
        - Admin : /admin/books
      */}
      <Link href={homeUrl} style={{ fontWeight: "bold", fontSize: "1.4rem", color: "#2563eb", flexShrink: 0, textDecoration: "none" }}>
        BookTrack
      </Link>

      {/* MENU CATÉGORIES */}
      <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", fontWeight: "600", fontSize: "0.95rem" }}>
        
        {/* Élément actif : Récemment ajoutés avec point rouge */}
        <Link href="/user/books?filter=recent" style={{ 
          display: "flex", alignItems: "center", gap: "0.5rem", 
          borderBottom: "2px solid #2f00ffff", paddingBottom: "0.3rem", 
          color: "#333", textDecoration: "none" 
        }}>
          <span>{t("navbar.recently_added")}</span>
          <div style={{ width: "8px", height: "8px", backgroundColor: "#ef4444", borderRadius: "50%" }}></div>
        </Link>

        {/* ROMANS - Bouton et Liste déroulante */}
        <div style={{ position: "relative" }}>
          <div onClick={() => toggleDropdown("romans")} style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", color: "#555" }}>
            <span>{t("navbar.novels")}</span>
            <span style={{ fontSize: "0.7rem" }}>▼</span>
          </div>
          {/* Le menu déroulant s'affiche seulement si openDropdown === "romans" */}
          {openDropdown === "romans" && (
            <div style={{ position: "absolute", top: "30px", left: 0, backgroundColor: "#fff", border: "1px solid #ddd", borderRadius: "8px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", zIndex: 20, minWidth: "150px" }}>
              <Link href="/user/books?genre=science-fiction" onClick={() => setOpenDropdown(null)} style={{ display: "block", padding: "10px 15px", color: "#333", textDecoration: "none", borderBottom: "1px solid #eee" }}>{t("navbar.science_fiction")}</Link>
              <Link href="/user/books?genre=fantasy" onClick={() => setOpenDropdown(null)} style={{ display: "block", padding: "10px 15px", color: "#333", textDecoration: "none", borderBottom: "1px solid #eee" }}>{t("navbar.fantasy")}</Link>
              <Link href="/user/books?genre=policier" onClick={() => setOpenDropdown(null)} style={{ display: "block", padding: "10px 15px", color: "#333", textDecoration: "none" }}>{t("navbar.mystery")}</Link>
            </div>
          )}
        </div>

        {/* MANGAS - Bouton et Liste déroulante */}
        <div style={{ position: "relative" }}>
          <div onClick={() => toggleDropdown("mangas")} style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", color: "#555" }}>
            <span>{t("navbar.mangas")}</span>
            <span style={{ fontSize: "0.7rem" }}>▼</span>
          </div>
          {openDropdown === "mangas" && (
            <div style={{ position: "absolute", top: "30px", left: 0, backgroundColor: "#fff", border: "1px solid #ddd", borderRadius: "8px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", zIndex: 20, minWidth: "150px" }}>
              <Link href="/user/books?genre=shonen" onClick={() => setOpenDropdown(null)} style={{ display: "block", padding: "10px 15px", color: "#333", textDecoration: "none", borderBottom: "1px solid #eee" }}>{t("navbar.shonen")}</Link>
              <Link href="/user/books?genre=seinen" onClick={() => setOpenDropdown(null)} style={{ display: "block", padding: "10px 15px", color: "#333", textDecoration: "none", borderBottom: "1px solid #eee" }}>{t("navbar.seinen")}</Link>
              <Link href="/user/books?genre=shojo" onClick={() => setOpenDropdown(null)} style={{ display: "block", padding: "10px 15px", color: "#333", textDecoration: "none" }}>{t("navbar.shojo")}</Link>
            </div>
          )}
        </div>

        {/* BD - Bouton et Liste déroulante */}
        <div style={{ position: "relative" }}>
          <div onClick={() => toggleDropdown("bd")} style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", color: "#555" }}>
            <span>{t("navbar.comics")}</span>
            <span style={{ fontSize: "0.7rem" }}>▼</span>
          </div>
          {openDropdown === "bd" && (
            <div style={{ position: "absolute", top: "30px", left: 0, backgroundColor: "#fff", border: "1px solid #ddd", borderRadius: "8px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", zIndex: 20, minWidth: "150px" }}>
              <Link href="/user/books?genre=comics" onClick={() => setOpenDropdown(null)} style={{ display: "block", padding: "10px 15px", color: "#333", textDecoration: "none", borderBottom: "1px solid #eee" }}>{t("navbar.us_comics")}</Link>
              <Link href="/user/books?genre=franco-belge" onClick={() => setOpenDropdown(null)} style={{ display: "block", padding: "10px 15px", color: "#333", textDecoration: "none" }}>{t("navbar.franco_belgian")}</Link>
            </div>
          )}
        </div>

        {/* ESSAIS - Bouton et Liste déroulante */}
        <div style={{ position: "relative" }}>
          <div onClick={() => toggleDropdown("essais")} style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", color: "#555" }}>
            <span>{t("navbar.essays")}</span>
            <span style={{ fontSize: "0.7rem" }}>▼</span>
          </div>
          {openDropdown === "essais" && (
            <div style={{ position: "absolute", top: "30px", left: 0, backgroundColor: "#fff", border: "1px solid #ddd", borderRadius: "8px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", zIndex: 20, minWidth: "150px" }}>
              <Link href="/user/books?genre=histoire" onClick={() => setOpenDropdown(null)} style={{ display: "block", padding: "10px 15px", color: "#333", textDecoration: "none", borderBottom: "1px solid #eee" }}>{t("navbar.history")}</Link>
              <Link href="/user/books?genre=philosophie" onClick={() => setOpenDropdown(null)} style={{ display: "block", padding: "10px 15px", color: "#333", textDecoration: "none" }}>{t("navbar.philosophy")}</Link>
            </div>
          )}
        </div>

      </div>

      {/* BARRE DE RECHERCHE */}
      {showSearch && isLoggedIn && (
        <div style={{ flex: 1, maxWidth: "300px" }}>
          <Suspense fallback={<div style={{ height: "36px" }} />}>
            <SearchInput />
          </Suspense>
        </div>
      )}

      {/* ===== DROITE : Sign In OU Profil ===== */}
      <div style={{ position: "relative", flexShrink: 0, display: "flex", alignItems: "center", gap: "0.75rem" }}>

        {!isLoggedIn ? (
          <Link
            href="/login"
            style={{
              padding: "0.5rem 1.25rem", backgroundColor: "#2563eb", color: "#fff",
              borderRadius: "999px", fontWeight: "600", fontSize: "0.9rem", textDecoration: "none"
            }}
          >
            {t("navbar.signin")}
          </Link>
        ) : (
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
                position: "absolute", top: "55px", 
                ...(locale === "ar" ? { left: "0" } : { right: "0" }),
                backgroundColor: "#fff", border: "1px solid #ddd",
                borderRadius: "8px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                width: "180px", overflow: "hidden", zIndex: 10 // Légèrement élargi pour le sélecteur
              }}>
                <Link
                  href={pathname.startsWith("/admin") ? "/admin/profil" : "/admin/profil"}
                  style={{ display: "block", padding: "12px", color: "#333", textDecoration: "none", borderBottom: "1px solid #eee" }}
                >
                  {t("navbar.view_profile")}
                </Link>
                {!pathname.startsWith("/admin") && (
                  <Link
                    href="/user/favourites"
                    style={{ display: "block", padding: "12px", color: "#e11d48", textDecoration: "none", borderBottom: "1px solid #eee" }}
                  >
                    {t("navbar.my_favourites")}
                  </Link>
                )}
                
                {/* 
                  ===== SÉLECTEUR DE LANGUE ===== 
                  Ajouté dans le menu profil pour permettre le changement de langue
                */}
                <div style={{ padding: "10px 12px", borderBottom: "1px solid #eee" }}>
                  <label htmlFor="language-select" style={{ display: "block", fontSize: "0.75rem", color: "#666", marginBottom: "6px", fontWeight: "bold" }}>
                    {t("navbar.language")}
                  </label>
                  <select 
                    id="language-select"
                    value={locale} // Utilise la locale courante du contexte
                    onChange={(e) => {
                      const newLocale = e.target.value;
                      // Mettre à jour le cookie
                      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
                      // Rafraîchir la page pour appliquer la langue côté serveur
                      router.refresh();
                    }}
                    style={{ 
                      width: "100%", padding: "6px", fontSize: "0.85rem", 
                      border: "1px solid #ccc", borderRadius: "4px", 
                      backgroundColor: "#f8f9fa", cursor: "pointer", color: "#333" 
                    }}
                  >
                    <option value="fr">🇫🇷 Français</option>
                    <option value="en">🇬🇧 English</option>
                    <option value="ar">🇸🇦 العربية</option>
                  </select>
                </div>

                <button
                  onClick={handleLogout}
                  style={{ display: "block", width: "100%", padding: "12px", color: "red", backgroundColor: "transparent", border: "none", textAlign: "left", cursor: "pointer", fontWeight: "bold" }}
                >
                  {t("navbar.logout")}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </nav>
  );
}
