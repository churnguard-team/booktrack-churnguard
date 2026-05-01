// ============================================================
// /user/books/page.tsx — Bibliothèque personnelle de l'utilisateur
// Server Component : fetch des données côté serveur
// ============================================================

import Navbar from "@/app/components/Navbar";
import BookCarousel from "@/app/components/BookCarousel"; // Carousel tendances
import AddToLibraryButton from "./AddToLibraryButton";
import FavouriteButton from "./FavouriteButton";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDictionary } from "@/app/i18n/dictionaries";

type BookItem = {
  id: string;
  title: string;
  auteur?: string;
  genre?: string;
  description?: string;
  cover_url?: string;
};

/**
 * Page principale des livres pour l'utilisateur.
 * Elle lit maintenant plusieurs paramètres dans l'URL (q, genre, filter).
 */
export default async function BooksPage({ searchParams }: { searchParams: Promise<{ q?: string, genre?: string, filter?: string }> }) {

  // ===== AUTHENTIFICATION =====
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("user_session");
  if (!sessionCookie) redirect("/");
  const user = JSON.parse(decodeURIComponent(sessionCookie.value));

  const locale = cookieStore.get("NEXT_LOCALE")?.value || "fr";
  const dict = await getDictionary(locale);

  const params = await searchParams;
  // Récupération des différents filtres depuis l'URL
  const recherche = params.q?.toLowerCase() || "";
  const genreFilter = params.genre?.toLowerCase() || ""; // ex: "science-fiction"
  const filterType = params.filter?.toLowerCase() || ""; // ex: "recent"

  const apiUrl = process.env.API_URL || "http://localhost:8000";

  // ===== APPELS API EN PARALLÈLE (3 requêtes simultanées) =====
  const [allBooksRes, libraryRes, trendingRes] = await Promise.all([
    fetch(`${apiUrl}/books`, { cache: "no-store" }),
    fetch(`${apiUrl}/users/${user.user_id}/library`, { cache: "no-store" }),
    fetch(`${apiUrl}/books/trending`, { cache: "no-store" }), // Livres tendance
  ]);

  const allBooks: BookItem[]      = allBooksRes.ok  ? await allBooksRes.json()  : [];
  const library                   = libraryRes.ok   ? await libraryRes.json()   : [];
  const trendingBooks: BookItem[] = trendingRes.ok  ? await trendingRes.json()  : [];

  // ===== DICTIONNAIRE BIBLIOTHÈQUE =====
  // Map pour O(1) : { "book_id" → { is_favourite: bool } }
  const libraryMap = new Map(
    library.map((ub: { book_id: string; is_favourite: boolean }) => [ub.book_id, ub])
  );

  /**
   * ===== LOGIQUE DE FILTRAGE =====
   * On part de la liste complète de tous les livres, 
   * puis on applique les filtres demandés un par un.
   */
  let filteredBooks = allBooks;

  // 1. Filtre par barre de recherche (titre)
  if (recherche) {
    filteredBooks = filteredBooks.filter((book: BookItem) =>
      book.title.toLowerCase().includes(recherche)
    );
  }

  // 2. Filtre par genre (clic depuis la Navbar)
  if (genreFilter) {
    filteredBooks = filteredBooks.filter((book: BookItem) =>
      book.genre?.toLowerCase() === genreFilter
    );
  }

  // 3. Filtre "Récemment ajoutés"
  if (filterType === "recent") {
    // Pour simuler "les plus récents", on inverse la liste de la BDD
    filteredBooks = [...filteredBooks].reverse();
  }

  /**
   * On vérifie si n'importe quel filtre est actif
   * Si oui, on masquera le carrousel pour laisser toute la place aux résultats.
   */
  const isAnyFilterActive = Boolean(recherche || genreFilter || filterType);

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* ===== SECTION HERO =====  */}
        <section className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            {dict.home.greeting.replace("{name}", user.prenom)}
          </h1>
          <p className="text-gray-500 mt-2 text-lg">{dict.home.hero_subtitle}</p>
        </section>

        {/* 
          ===== CAROUSEL TENDANCES =====
          Il ne s'affiche QUE s'il n'y a AUCUN filtre actif (!isAnyFilterActive) 
          et qu'il y a des livres tendances.
        */}
        {trendingBooks.length > 0 && !isAnyFilterActive && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{dict.home.trending_title}</h2>
                <p className="text-sm text-gray-400 mt-0.5">{dict.home.trending_subtitle}</p>
              </div>
            </div>
            {/* BookCarousel est un Client Component, on lui passe les données depuis le serveur */}
            <BookCarousel books={trendingBooks} />
          </section>
        )}

        <div className="border-t border-gray-200 mb-8" />

        {/* ===== CATALOGUE COMPLET OU RÉSULTATS DE FILTRAGE ===== */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {/* On change le titre selon le filtre actif */}
                {genreFilter
                  ? dict.home.genre_label.replace(
                      "{genre}",
                      genreFilter.charAt(0).toUpperCase() + genreFilter.slice(1)
                    )
                  : filterType === "recent"
                    ? dict.navbar.recently_added
                    : dict.home.all_books_title}
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">
                {recherche
                  ? dict.home.results_for
                      .replace("{count}", String(filteredBooks.length))
                      .replace("{query}", recherche)
                  : isAnyFilterActive
                    ? dict.home.results_found.replace("{count}", String(filteredBooks.length))
                    : dict.home.books_available.replace("{count}", String(allBooks.length))}
              </p>
            </div>
          </div>

          {/* ===== GRILLE DES LIVRES ===== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBooks.map((book: BookItem) => {
              // Statut de ce livre dans la bibliothèque de l'utilisateur
              const userBook    = libraryMap.get(book.id);
              const isInLibrary = !!userBook;
              const isFavourite = isInLibrary
                ? (userBook as { is_favourite: boolean }).is_favourite
                : false;

              return (
                // Carte = conteneur principal (pas de Link ici, on le met sur l'image/titre)
                <div
                  key={book.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100
                             flex flex-col overflow-hidden
                             transition-all duration-300 hover:shadow-md hover:-translate-y-1"
                >
                  {/* ===== PARTIE CLIQUABLE → page de détail ===== */}
                  {/* Le Link enveloppe SEULEMENT l'image et les infos, pas les boutons */}
                  <Link href={`/user/books/${book.id}`} className="flex flex-col flex-grow">

                    {/* IMAGE + BADGES */}
                    <div className="relative">
                      {book.cover_url ? (
                        <img
                          src={book.cover_url}
                          alt={book.title}
                          loading="lazy"
                          className="w-full h-52 object-cover"
                        />
                      ) : (
                        <div className="w-full h-52 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                          <span className="text-5xl">📖</span>
                        </div>
                      )}

                      {/* Badge Favori ⭐ */}
                      {isFavourite && (
                        <span className="absolute top-2 right-2 text-xl drop-shadow">⭐</span>
                      )}
                      {/* Badge "Ma biblio" */}
                      {isInLibrary && !isFavourite && (
                        <span className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm
                                         rounded-full px-2 py-0.5 text-xs font-semibold
                                         text-emerald-600 shadow-sm">
                          {dict.home.in_library}
                        </span>
                      )}
                    </div>

                    {/* INFOS TEXTUELLES */}
                    <div className="p-4 flex flex-col flex-grow">
                      <h3 className="font-semibold text-gray-900 line-clamp-2 leading-snug mb-1">
                        {book.title}
                      </h3>
                      <p className="text-sm font-medium text-gray-500 mb-2">{book.auteur}</p>

                      {book.genre && (
                        <span className="inline-block bg-gray-100 text-gray-500 text-xs
                                         px-2 py-0.5 rounded-full w-fit mb-2">
                          {book.genre}
                        </span>
                      )}

                      <p className="text-xs text-gray-400 line-clamp-2 mt-auto leading-relaxed">
                        {book.description}
                      </p>
                    </div>
                  </Link>

                  {/* ===== BOUTONS D'ACTION (EN DEHORS du Link) ===== */}
                  {/* Placés ici pour que leur clic NE déclenche PAS la navigation */}
                  <div className="px-4 pb-4">
                    {isInLibrary ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-emerald-600 font-bold">✅ Dans ma liste</span>
                        <FavouriteButton
                          bookId={book.id}
                          userId={user.user_id}
                          isFavourite={isFavourite}
                        />
                      </div>
                    ) : (
                      <AddToLibraryButton bookId={book.id} userId={user.user_id} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Message si aucun résultat */}
          {filteredBooks.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-lg font-medium">Aucun livre trouvé</p>
              <p className="text-sm mt-1">Essayez un autre filtre</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
