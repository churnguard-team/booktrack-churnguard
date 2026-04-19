// ============================================================
// page.tsx — Page d'accueil (Server Component)
// C'est un Server Component : il peut faire des fetch() directement
// sans useEffect. Next.js s'occupe du rendu côté serveur.
// ============================================================

import Navbar from "@/app/components/Navbar";
import BookCarousel from "@/app/components/BookCarousel";
import Link from "next/link";
import { cookies } from "next/headers";

// Définition du type d'un livre (correspond au schéma BookResponse du backend)
type BookItem = {
  id: string;
  title: string;
  auteur?: string;
  genre?: string;
  description?: string;
  cover_url?: string;
};

export default async function BooksPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  // ===== 1. SESSION (optionnelle — la page est publique) =====
  // La page d'accueil est accessible sans connexion.
  // Si le cookie existe, on personalise l'affichage (prénom, bibliothèque).
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("user_session");
  const user = sessionCookie
    ? JSON.parse(decodeURIComponent(sessionCookie.value))
    : null; // null = visiteur non connecté

  // ===== 2. PARAMÈTRES DE RECHERCHE =====
  const params = await searchParams;
  const recherche = params.q?.toLowerCase() || "";

  const apiUrl = process.env.API_URL || "http://localhost:8000";

  // ===== 3. APPELS API EN PARALLÈLE =====
  const [allBooksRes, libraryRes, trendingRes] = await Promise.all([
    fetch(`${apiUrl}/books`, { cache: "no-store" }),
    // On ne récupère la bibliothèque que si l'utilisateur est connecté
    user
      ? fetch(`${apiUrl}/users/${user.user_id}/library`, { cache: "no-store" })
      : Promise.resolve(new Response("[]")),
    fetch(`${apiUrl}/books/trending`, { cache: "no-store" }),
  ]);

  const allBooks: BookItem[]      = allBooksRes.ok  ? await allBooksRes.json()  : [];
  const library                   = libraryRes.ok   ? await libraryRes.json()   : [];
  const trendingBooks: BookItem[] = trendingRes.ok  ? await trendingRes.json()  : [];

  // ===== 4. DICTIONNAIRE RAPIDE DE LA BIBLIOTHÈQUE =====
  // On transforme le tableau en Map pour chercher en O(1) plutôt qu'en O(n)
  // Format : { "book-uuid" → { is_favourite: true/false } }
  const libraryMap = new Map(
    library.map((ub: { book_id: string; is_favourite: boolean }) => [ub.book_id, ub])
  );

  // ===== 5. FILTRE DE RECHERCHE =====
  // On filtre les livres selon le terme entré dans la SearchInput
  const filteredBooks = allBooks.filter((book) =>
    book.title.toLowerCase().includes(recherche)
  );

  return (
    <main className="min-h-screen bg-gray-50">

      {/* ===== BARRE DE NAVIGATION ===== */}
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">

        

        {/* ===== SECTION CAROUSEL : TENDANCES ===== */}
        {/* On affiche cette section SEULEMENT si l'API a retourné des livres */}
        {trendingBooks.length > 0 && !recherche && (
          <section className="mb-12">

            {/* En-tête de la section */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-gray-800">🔥 Tendances cette semaine</h2>
                <p className="text-sm text-gray-400 mt-0.5">Les livres les plus populaires</p>
              </div>
            </div>

            {/* 
              BookCarousel est un "Client Component" (voir BookCarousel.tsx)
              On lui passe les livres tendance en props depuis le serveur.
              C'est le pattern "Server → Client" : le serveur fetch les données,
              le client gère l'interactivité.
            */}
            <BookCarousel books={trendingBooks} />
          </section>
        )}

        {/* ===== SÉPARATEUR ===== */}
        <div className="border-t border-gray-200 mb-8" />

        {/* ===== SECTION CATALOGUE COMPLET ===== */}
        <section>

          {/* En-tête du catalogue avec compteur et barre de recherche */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">📚 Tous les livres</h2>
              {/* Compteur dynamique */}
              <p className="text-sm text-gray-400 mt-0.5">
                {recherche
                  ? `${filteredBooks.length} résultat(s) pour "${recherche}"`
                  : `${allBooks.length} livres disponibles`}
              </p>
            </div>
          </div>

          {/* ===== GRILLE DES LIVRES ===== */}
          {/* 
            Responsive : 
            - 1 colonne sur mobile
            - 2 colonnes sur tablette (sm)  
            - 3 colonnes sur laptop (lg)
            - 4 colonnes sur grand écran (xl)
          */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

            {filteredBooks.map((book: BookItem) => {
              // Pour chaque livre : est-il dans ma bibliothèque ? Est-il favori ?
              const userBook   = libraryMap.get(book.id);
              const isInLibrary = !!userBook;
              const isFavourite = isInLibrary
                ? (userBook as { is_favourite: boolean }).is_favourite
                : false;

              return (
                // Chaque carte est un lien cliquable vers la page de détail
                // hover:-translate-y-1 = légère élévation au survol (effet premium)
                <Link
                  key={book.id}
                  href={`/user/books/${book.id}`}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 
                             flex flex-col overflow-hidden 
                             transition-all duration-300 hover:shadow-md hover:-translate-y-1"
                >
                  {/* ===== IMAGE DE COUVERTURE ===== */}
                  {/* "relative" permet de positionner les badges en "absolute" dessus */}
                  <div className="relative">
                    {book.cover_url ? (
                      <img
                        src={book.cover_url}
                        alt={book.title}
                        className="w-full h-52 object-cover"
                      />
                    ) : (
                      // Placeholder dégradé si pas de couverture
                      <div className="w-full h-52 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                        <span className="text-5xl">📖</span>
                      </div>
                    )}

                    {/* BADGE FAVORI ⭐ — visible si le livre est en favori */}
                    {isFavourite && (
                      <span className="absolute top-2 right-2 text-xl drop-shadow">⭐</span>
                    )}

                    {/* BADGE "MA BIBLIO" — visible si dans la biblio mais pas favori */}
                    {isInLibrary && !isFavourite && (
                      <span className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm 
                                       rounded-full px-2 py-0.5 text-xs font-semibold 
                                       text-emerald-600 shadow-sm">
                        ✓ Ma biblio
                      </span>
                    )}
                  </div>

                  {/* ===== INFORMATIONS DU LIVRE ===== */}
                  <div className="p-4 flex flex-col flex-grow">

                    {/* Titre — max 2 lignes */}
                    <h3 className="font-semibold text-gray-900 line-clamp-2 leading-snug mb-1">
                      {book.title}
                    </h3>

                    {/* Auteur */}
                    <p className="text-sm font-medium text-gray-500 mb-2">{book.auteur}</p>

                    {/* Badge genre (si disponible) */}
                    {book.genre && (
                      <span className="inline-block bg-gray-100 text-gray-500 text-xs 
                                       px-2 py-0.5 rounded-full w-fit mb-2">
                        {book.genre}
                      </span>
                    )}

                    {/* Description courte — max 2 lignes, poussée en bas grâce à mt-auto */}
                    <p className="text-xs text-gray-400 line-clamp-2 mt-auto leading-relaxed">
                      {book.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* ===== MESSAGE SI AUCUN RÉSULTAT ===== */}
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
