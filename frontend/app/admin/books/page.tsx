// ============================================================
// /admin/books/page.tsx — Gestion des livres (côté Admin)
// Server Component : fetch des données côté serveur
// ============================================================

import Link from "next/link";
import DeleteBookButton from "./DeleteBookButton";
import Navbar from "@/app/components/Navbar";
import BookCarousel from "@/app/components/BookCarousel";

type BookItem = {
  id: string;
  title: string;
  auteur?: string;
  genre?: string;
  description?: string;
  cover_url?: string;
};

async function getBooks(): Promise<BookItem[]> {
  const apiUrl = process.env.API_URL || "http://localhost:8000";
  const res = await fetch(`${apiUrl}/books`, { cache: "no-store" });
  if (!res.ok) throw new Error("Erreur lors de la récupération des livres");
  return res.json();
}

export default async function AdminBooksPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {

  const params = await searchParams;
  const recherche = params.q?.toLowerCase() || "";
  const apiUrl = process.env.API_URL || "http://localhost:8000";

  // ===== APPELS EN PARALLÈLE =====
  // On récupère tous les livres ET les livres tendance simultanément
  const [allBooks, trendingRes] = await Promise.all([
    getBooks(),
    fetch(`${apiUrl}/books/trending`, { cache: "no-store" }),
  ]);

  const trendingBooks: BookItem[] = trendingRes.ok ? await trendingRes.json() : [];

  // ===== FILTRE DE RECHERCHE =====
  const filteredBooks = allBooks.filter((book) =>
    book.title.toLowerCase().includes(recherche)
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* ===== EN-TÊTE ADMIN ===== */}
        <section className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            📋 Gestion des livres
          </h1>
          <p className="text-gray-500 mt-1">Administrez le catalogue de votre bibliothèque</p>
        </section>

        {/* ===== BOUTONS D'ACTION ADMIN ===== */}
        <div className="flex flex-wrap gap-3 mb-8">
          {/* Bouton : Ajouter un livre */}
          <Link
            href="/admin/books/add"
            className="inline-flex items-center gap-2 px-4 py-2
                       bg-gray-900 text-white text-sm font-medium rounded-lg
                       hover:bg-gray-700 transition-colors duration-200"
          >
            ➕ Ajouter un livre
          </Link>

          {/* Bouton : Gérer les utilisateurs */}
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 px-4 py-2
                       bg-white text-gray-700 text-sm font-medium rounded-lg
                       border border-gray-200 hover:bg-gray-50 transition-colors duration-200"
          >
            👥 Gérer les utilisateurs
          </Link>
        </div>

        {/* ===== CAROUSEL TENDANCES ===== */}
        {trendingBooks.length > 0 && !recherche && (
          <section className="mb-12">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-gray-800">🔥 Tendances cette semaine</h2>
              <p className="text-sm text-gray-400 mt-0.5">Aperçu des livres les plus consultés</p>
            </div>
            {/* BookCarousel est un Client Component (voir BookCarousel.tsx) */}
            <BookCarousel books={trendingBooks} />
          </section>
        )}

        <div className="border-t border-gray-200 mb-8" />

        {/* ===== CATALOGUE AVEC RECHERCHE ===== */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">📚 Tous les livres</h2>
              <p className="text-sm text-gray-400 mt-0.5">
                {recherche
                  ? `${filteredBooks.length} résultat(s) pour "${recherche}"`
                  : `${allBooks.length} livres au total`}
              </p>
            </div>
          </div>

          {/* ===== GRILLE DES LIVRES ===== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBooks.map((book) => (
              <div
                key={book.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100
                           flex flex-col overflow-hidden
                           transition-all duration-300 hover:shadow-md"
              >
                {/* COUVERTURE */}
                {book.cover_url ? (
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <span className="text-4xl">📖</span>
                  </div>
                )}

                {/* INFOS */}
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="font-semibold text-gray-900 line-clamp-2 leading-snug mb-1">
                    {book.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-1">{book.auteur}</p>

                  {book.genre && (
                    <span className="inline-block bg-gray-100 text-gray-500 text-xs
                                     px-2 py-0.5 rounded-full w-fit mb-2">
                      {book.genre}
                    </span>
                  )}

                  <p className="text-xs text-gray-400 line-clamp-2 mt-auto leading-relaxed mb-3">
                    {book.description}
                  </p>

                  {/* BOUTONS : Modifier + Supprimer */}
                  <div className="flex gap-2 mt-auto">
                    {/* Bouton Modifier → style outline (sans fond noir) */}
                    <Link
                      href={`/admin/books/${book.id}/edit`}
                      className="flex-1 text-center text-sm font-medium py-2 px-3
                                 border border-gray-300 text-gray-700 rounded-lg
                                 hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200"
                    >
                      ✏️ Modifier
                    </Link>

                    {/* Bouton Supprimer (Client Component existant) */}
                    <div className="flex-1">
                      <DeleteBookButton bookId={book.id} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Message si aucun résultat */}
          {filteredBooks.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-lg font-medium">Aucun livre trouvé</p>
              <p className="text-sm mt-1">Essayez un autre terme de recherche</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
