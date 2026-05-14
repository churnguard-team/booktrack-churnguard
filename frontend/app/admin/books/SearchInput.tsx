"use client";
// ============================================================
// SearchInput.tsx — Barre de recherche avec Web Scraping intégré
// ============================================================
//
// Ce composant est une barre de recherche avancée qui fait DEUX choses :
//
// 1. RECHERCHE LOCALE : Filtre les livres déjà en base de données
//    (via le paramètre URL ?q=... lu par le Server Component page.tsx)
//
// 2. WEB SCRAPING EN TEMPS RÉEL : Interroge notre endpoint FastAPI
//    GET /scraper/search?q=... qui scrape Open Library (openlibrary.org)
//    et retourne des suggestions de livres venant d'Internet.
//
// Flux complet quand l'utilisateur tape :
//   1. Mise à jour instantanée de l'URL (?q=...) → filtre la grille locale
//   2. Après 400ms de silence (debounce) → appel API scraper → dropdown suggestions
//   3. Clic sur une suggestion → remplit le champ + lance la recherche locale
// ============================================================

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";

// ---------------------------------------------------------------------------
// TYPE : Structure d'un livre retourné par le scraper backend
// Correspond exactement au modèle ScrapedBook (Pydantic) dans scraper.py
// ---------------------------------------------------------------------------
type ScrapedBook = {
  title: string;                    // Titre du livre (toujours présent)
  auteur: string | null;            // Auteur(s) — null si inconnu sur Open Library
  cover_url: string | null;         // URL image couverture (CDN covers.openlibrary.org)
  open_library_key?: string | null; // Identifiant unique Open Library
  source: string;                   // "Open Library" ou "Google Books"
  link: string | null;              // Lien vers la page externe du livre
};

// ===========================================================================
// COMPOSANT PRINCIPAL
// ===========================================================================
export default function SearchInput() {

  // ---- Hooks de navigation Next.js ----------------------------------------
  const router       = useRouter();        // Modifie l'URL sans rechargement complet
  const pathname     = usePathname();      // Ex : "/admin/books" ou "/user/books"
  const searchParams = useSearchParams();  // Paramètres URL actuels : ?q=...&genre=...

  // ---- États React du composant -------------------------------------------

  /** Valeur affichée dans le champ texte (input contrôlé) */
  const [inputValue, setInputValue] = useState(
    searchParams.get("q")?.toString() || "" // Pré-rempli si ?q= existe déjà dans l'URL
  );

  /** Livres scrapés depuis Open Library (affiché dans la dropdown) */
  const [suggestions, setSuggestions] = useState<ScrapedBook[]>([]);

  /** true = requête scraping en cours → affiche le spinner ⏳ */
  const [isLoadingScraping, setIsLoadingScraping] = useState(false);

  /** true = la dropdown des suggestions est visible */
  const [showDropdown, setShowDropdown] = useState(false);

  /** Ref du conteneur principal : permet de détecter un clic hors du composant */
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Ref du timer debounce.
   * Stocke le setTimeout pour pouvoir l'annuler si l'utilisateur retape
   * avant l'expiration des 400ms (évite de spammer l'API à chaque lettre).
   */
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---------------------------------------------------------------------------
  // EFFET : Fermeture de la dropdown au clic en dehors du composant
  // S'exécute une seule fois au montage (tableau de dépendances vide [])
  // ---------------------------------------------------------------------------
  useEffect(() => {
    /**
     * Si le clic est en dehors du composant SearchInput (hors containerRef),
     * on masque la dropdown — comportement standard des menus déroulants.
     */
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    // Abonnement à l'événement "mousedown" global du document
    document.addEventListener("mousedown", handleClickOutside);

    // Nettoyage à la destruction du composant (évite les fuites mémoire)
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ---------------------------------------------------------------------------
  // FONCTION : Appel HTTP vers le backend FastAPI pour scraper Open Library
  //
  // Enveloppée dans useCallback pour éviter de recréer la fonction à chaque rendu.
  // ---------------------------------------------------------------------------
  const fetchScrapedSuggestions = useCallback(async (term: string) => {
    // Sécurité : on ne lance pas de requête si le terme est trop court
    if (term.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setIsLoadingScraping(true); // Active le spinner de chargement

    try {
      /**
       * NEXT_PUBLIC_API_URL est défini dans frontend/.env.local
       * Le préfixe NEXT_PUBLIC_ est OBLIGATOIRE pour exposer la variable
       * côté navigateur dans Next.js (sinon elle n'est accessible que côté serveur).
       *
       * encodeURIComponent() encode correctement les caractères spéciaux :
       * "harry potter" → "harry%20potter"
       * "l'étranger"  → "l%27%C3%A9tranger"
       */
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(
        `${apiUrl}/scraper/search?q=${encodeURIComponent(term)}&limit=6`,
        { cache: "no-store" } // Empêche le navigateur de mettre la réponse en cache
      );

      if (!res.ok) {
        // Erreur backend (ex: 502 si Open Library est indisponible) → on ignore silencieusement
        console.warn(`[SearchInput] Scraper retourné ${res.status}`);
        setSuggestions([]);
        return;
      }

      const data: ScrapedBook[] = await res.json();
      setSuggestions(data);
      setShowDropdown(data.length > 0); // Dropdown visible seulement si résultats reçus

    } catch (err) {
      // Erreur réseau (backend éteint, pas d'internet...) → on échoue silencieusement
      // L'utilisateur peut quand même utiliser la recherche locale sans scraping
      console.error("[SearchInput] Erreur réseau scraping :", err);
      setSuggestions([]);
    } finally {
      setIsLoadingScraping(false); // Toujours arrêter le spinner (succès ou erreur)
    }
  }, []);

  // ---------------------------------------------------------------------------
  // GESTIONNAIRE : appelé à chaque frappe dans le champ de recherche
  // ---------------------------------------------------------------------------
  const handleInputChange = (term: string) => {
    setInputValue(term);

    // ---- 1. Recherche locale : mise à jour immédiate de l'URL ----
    // Le Server Component (page.tsx) lit ?q= et filtre les livres de la BDD.
    const params = new URLSearchParams(searchParams.toString());
    if (term) {
      params.set("q", term);
    } else {
      params.delete("q");
      setSuggestions([]);
      setShowDropdown(false);
    }
    params.delete("page"); // Revenir à la page 1 à chaque nouvelle recherche
    router.replace(`${pathname}?${params.toString()}`);

    // ---- 2. Web Scraping : avec délai debounce de 400ms ----
    // On annule le timer précédent (si l'utilisateur tape rapidement)
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // On attend 400ms après la DERNIÈRE frappe → 1 seule requête par "pause"
    debounceRef.current = setTimeout(() => fetchScrapedSuggestions(term), 400);
  };

  // ---------------------------------------------------------------------------
  // GESTIONNAIRE : clic sur un livre de la dropdown
  // ---------------------------------------------------------------------------
  const handleSuggestionClick = (suggestion: ScrapedBook) => {
    if (suggestion.link) {
      // Si le livre web a un lien (Google Books ou Open Library),
      // on ouvre directement cette page externe dans un nouvel onglet
      window.open(suggestion.link, "_blank", "noopener,noreferrer");
    } else {
      // Comportement de secours : on remplit le champ et on fait une recherche locale
      setInputValue(suggestion.title);
      const params = new URLSearchParams(searchParams.toString());
      params.set("q", suggestion.title);
      params.delete("page");
      router.replace(`${pathname}?${params.toString()}`);
    }
    
    // Dans tous les cas, on ferme la dropdown
    setShowDropdown(false);
    setSuggestions([]);
  };

  // ===========================================================================
  // RENDU JSX
  // ===========================================================================
  return (
    // Conteneur : position:relative pour ancrer la dropdown (position:absolute) ici
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>

      {/* ===== CHAMP DE SAISIE ===== */}
      <div style={{ position: "relative" }}>
        <input
          type="text"
          placeholder="🔍 Rechercher (base + Open Library)..."
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            // Ré-affiche la dropdown si on revient sur le champ avec des suggestions en cache
            if (suggestions.length > 0) setShowDropdown(true);
          }}
          className="w-full max-w-sm px-4 py-2 text-sm text-gray-700 bg-gray-100
                     rounded-full border border-transparent
                     focus:outline-none focus:bg-white focus:border-gray-300
                     transition-all duration-200 placeholder:text-gray-400"
        />

        {/* Spinner ⏳ — visible uniquement pendant une requête scraping active */}
        {isLoadingScraping && (
          <span
            title="Recherche sur Open Library..."
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "0.75rem",
              animation: "spinIcon 1s linear infinite", // Défini dans <style> ci-dessous
              display: "inline-block",
              lineHeight: 1,
            }}
          >
            ⏳
          </span>
        )}
      </div>

      {/* ===== DROPDOWN DES SUGGESTIONS WEB ===== */}
      {/* Rendu uniquement si la dropdown est visible ET qu'il y a des résultats */}
      {showDropdown && suggestions.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)", // Juste sous le champ de saisie
            left: 0,
            right: 0,
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            boxShadow: "0 8px 25px rgba(0,0,0,0.12)",
            zIndex: 9999,   // Au-dessus de tout (Navbar, dropdowns de catégorie, etc.)
            overflow: "hidden",
            maxHeight: "380px",
            overflowY: "auto",
          }}
        >
          {/* En-tête : indique clairement que ce sont des résultats du Web */}
          <div
            style={{
              padding: "7px 14px",
              backgroundColor: "#f8fafc",
              borderBottom: "1px solid #e5e7eb",
              fontSize: "0.67rem",
              color: "#6b7280",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            🌐 Suggestions Web — Open Library
          </div>

          {/* ===== LISTE DES LIVRES SCRAPÉS ===== */}
          {suggestions.map((book, index) => (
            <div
              key={`${book.open_library_key ?? "k"}-${index}`}
              onClick={() => handleSuggestionClick(book)}
              role="option"                  // Accessibilité ARIA (listbox option)
              aria-selected={false}
              tabIndex={0}                   // Navigable au clavier
              onKeyDown={(e) => {
                // Entrée ou Espace = sélection du livre (accessibilité clavier)
                if (e.key === "Enter" || e.key === " ") handleSuggestionClick(book);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 14px",
                cursor: "pointer",
                transition: "background-color 0.15s",
                borderBottom:
                  index < suggestions.length - 1 ? "1px solid #f3f4f6" : "none",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#eff6ff")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              {/* Miniature couverture — ou placeholder 📖 si aucune image */}
              {book.cover_url ? (
                <img
                  src={book.cover_url}
                  alt={`Couverture : ${book.title}`}
                  width={36}
                  height={50}
                  style={{
                    width: "36px",
                    height: "50px",
                    objectFit: "cover",
                    borderRadius: "4px",
                    flexShrink: 0,
                    border: "1px solid #e5e7eb",
                    backgroundColor: "#f3f4f6",
                  }}
                  onError={(e) => {
                    // Si l'image ne charge pas → on affiche le placeholder
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "36px",
                    height: "50px",
                    backgroundColor: "#e5e7eb",
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.1rem",
                    flexShrink: 0,
                  }}
                >
                  📖
                </div>
              )}

              {/* Titre + Auteur */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    color: "#111827",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis", // Troncature avec "..."
                  }}
                >
                  {book.title}
                </p>
                {book.auteur && (
                  <p
                    style={{
                      margin: "3px 0 0",
                      fontSize: "0.73rem",
                      color: "#6b7280",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                    }}
                  >
                    ✍️ {book.auteur}
                  </p>
                )}
              </div>

              {/* Badge "Web" — identifie visuellement la source Internet */}
              <span
                style={{
                  flexShrink: 0,
                  fontSize: "0.62rem",
                  color: "#1d4ed8",
                  backgroundColor: "#dbeafe",
                  padding: "2px 8px",
                  borderRadius: "99px",
                  fontWeight: "700",
                  border: "1px solid #bfdbfe",
                }}
              >
                Web
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ===== CSS INLINE : animation du spinner =====
          Définie ici pour ne pas toucher globals.css.
          L'emoji ⏳ effectue une rotation complète en 1 seconde. */}
      <style>{`
        @keyframes spinIcon {
          from { transform: translateY(-50%) rotate(0deg); }
          to   { transform: translateY(-50%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
