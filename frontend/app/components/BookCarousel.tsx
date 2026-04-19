"use client";
// ============================================================
// BookCarousel.tsx — Composant Client
// "use client" est OBLIGATOIRE ici car on utilise :
//   - useRef  → pour cibler le conteneur DOM et le faire scroller
//   - onClick → interactivité boutons flèches
// Un Server Component ne peut PAS faire ça !
// ============================================================

import { useRef } from "react";
import Link from "next/link";

// Le type des livres qu'on attend en props
type BookItem = {
  id: string;
  title: string;
  auteur?: string;
  genre?: string;
  cover_url?: string;
};

// Props du composant : on reçoit un tableau de livres depuis le Server Component parent
export default function BookCarousel({ books }: { books: BookItem[] }) {
  // useRef nous donne une référence directe au <div> scrollable
  // sans déclencher un re-rendu du composant (contrairement à useState)
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fonction qui fait défiler le carousel de 320px dans la direction choisie
  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === "right" ? 320 : -320,
        behavior: "smooth", // animation fluide CSS
      });
    }
  };

  // Si pas de livres, on n'affiche rien du tout
  if (books.length === 0) return null;

  return (
    // "relative" est nécessaire pour positionner les boutons flèches en "absolute"
    <div className="relative">

      {/* ===== BOUTON FLÈCHE GAUCHE ===== */}
      <button
        onClick={() => scroll("left")}
        aria-label="Précédent"
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 
                   bg-white shadow-md rounded-full w-10 h-10 
                   flex items-center justify-center text-gray-600 text-xl font-bold
                   hover:bg-gray-50 hover:shadow-lg transition-all duration-200 -ml-4"
      >
        ‹
      </button>

      {/* ===== PISTE SCROLLABLE DU CAROUSEL ===== */}
      {/* overflow-x-auto = scroll horizontal activé */}
      {/* scroll-smooth = animation fluide au clic des boutons */}
      {/* scrollbar-none = cache la barre de défilement (css custom ci-dessous) */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-3 px-2"
        style={{ scrollbarWidth: "none" }} // Cache scrollbar sur Firefox
      >
        {/* ===== CARTE DE CHAQUE LIVRE ===== */}
        {books.map((book) => (
          <Link
            key={book.id}
            href={`/user/books/${book.id}`}
            // flex-shrink-0 EMPÊCHE la carte de rétrécir et garde sa taille fixe
            className="flex-shrink-0 w-40 bg-white rounded-xl shadow-sm border border-gray-100 
                       overflow-hidden hover:shadow-md hover:-translate-y-1 
                       transition-all duration-300"
          >
            {/* Couverture du livre */}
            {book.cover_url ? (
              <img
                src={book.cover_url}
                alt={book.title}
                className="w-full h-56 object-cover"
              />
            ) : (
              // Placeholder élégant si pas de couverture
              <div className="w-full h-56 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <span className="text-4xl">📖</span>
              </div>
            )}

            {/* Infos textuelles sous la couverture */}
            <div className="p-3">
              {/* line-clamp-2 = max 2 lignes, puis "..." */}
              <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-tight">
                {book.title}
              </p>
              {/* truncate = coupe le texte si trop long sur 1 ligne */}
              <p className="text-xs text-gray-400 mt-1 truncate">{book.auteur}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* ===== BOUTON FLÈCHE DROITE ===== */}
      <button
        onClick={() => scroll("right")}
        aria-label="Suivant"
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 
                   bg-white shadow-md rounded-full w-10 h-10 
                   flex items-center justify-center text-gray-600 text-xl font-bold
                   hover:bg-gray-50 hover:shadow-lg transition-all duration-200 -mr-4"
      >
        ›
      </button>
    </div>
  );
}
