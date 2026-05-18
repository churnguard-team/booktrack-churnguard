import Navbar from "@/app/components/Navbar";
import BookCarousel from "@/app/components/BookCarousel";
import AddToLibraryButton from "./AddToLibraryButton";
import FavouriteButton from "./FavouriteButton";
import StatusSelect from "./StatusSelect";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { bookMatchesGenre, getGenreLabels, type GenreInfo } from "@/app/books/genreUtils";

type BookItem = {
  id: string;
  title: string;
  auteur?: string;
  type?: string;
  genre?: string;
  genres?: GenreInfo[];
  description?: string;
  cover_url?: string;
};

export default async function BooksPage({ searchParams }: { searchParams: Promise<{ q?: string; genre?: string; filter?: string }> }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("user_session");
  if (!sessionCookie) redirect("/");
  const user = JSON.parse(decodeURIComponent(sessionCookie.value));

  const params = await searchParams;
  const recherche = params.q?.toLowerCase() || "";
  const genreFilter = params.genre?.toLowerCase() || "";
  const filterType = params.filter?.toLowerCase() || "";

  const apiUrl = process.env.API_URL || "http://localhost:8000";

  const [allBooksRes, libraryRes, trendingRes] = await Promise.all([
    fetch(`${apiUrl}/books`, { cache: "no-store" }),
    fetch(`${apiUrl}/users/${user.user_id}/library`, { cache: "no-store" }),
    fetch(`${apiUrl}/books/trending`, { cache: "no-store" }),
  ]);

  const allBooks: BookItem[] = allBooksRes.ok ? await allBooksRes.json() : [];
  const library = libraryRes.ok ? await libraryRes.json() : [];
  const trendingBooks: BookItem[] = trendingRes.ok ? await trendingRes.json() : [];

  const libraryMap = new Map(
    library.map((ub: { book_id: string; is_favourite: boolean; status: string }) => [ub.book_id, ub])
  );

  let filteredBooks = allBooks;

  if (recherche) {
    filteredBooks = filteredBooks.filter((book) => book.title.toLowerCase().includes(recherche));
  }
  if (genreFilter) {
    filteredBooks = filteredBooks.filter((book) => bookMatchesGenre(book, genreFilter));
  }
  if (filterType === "recent") {
    filteredBooks = [...filteredBooks].reverse();
  }

  const isAnyFilterActive = Boolean(recherche || genreFilter || filterType);

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <section className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            Bonjour, {user.prenom} 👋
          </h1>
          <p className="text-gray-500 mt-2 text-lg">Decouvrez votre prochaine lecture</p>
        </section>

        {trendingBooks.length > 0 && !isAnyFilterActive && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Tendances cette semaine</h2>
                <p className="text-sm text-gray-400 mt-0.5">Les livres les plus populaires</p>
              </div>
            </div>
            <BookCarousel books={trendingBooks} />
          </section>
        )}

        <div className="border-t border-gray-200 mb-8" />

        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {genreFilter ? `Genre : ${genreFilter.charAt(0).toUpperCase() + genreFilter.slice(1)}` :
                 filterType === "recent" ? "Recemment ajoutes" :
                 "Tous les livres"}
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">
                {isAnyFilterActive ? `${filteredBooks.length} resultat(s) trouve(s)` : `${allBooks.length} livres disponibles`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBooks.map((book: BookItem) => {
              const userBook = libraryMap.get(book.id) as { is_favourite: boolean; status: string } | undefined;
              const isInLibrary = !!userBook;
              const isFavourite = isInLibrary ? userBook!.is_favourite : false;
              const currentStatus = isInLibrary ? userBook!.status : "TO_READ";

              return (
                <div
                  key={book.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1"
                >
                  <Link href={`/user/books/${book.id}`} className="flex flex-col flex-grow">
                    <div className="relative">
                      {book.cover_url ? (
                        <img src={book.cover_url} alt={book.title} loading="lazy" className="w-full h-52 object-cover" />
                      ) : (
                        <div className="w-full h-52 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                          <span className="text-5xl">📖</span>
                        </div>
                      )}
                      {isFavourite && <span className="absolute top-2 right-2 text-xl drop-shadow">⭐</span>}
                      {isInLibrary && !isFavourite && (
                        <span className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs font-semibold text-emerald-600 shadow-sm">
                          Ma biblio
                        </span>
                      )}
                    </div>

                    <div className="p-4 flex flex-col flex-grow">
                      <h3 className="font-semibold text-gray-900 line-clamp-2 leading-snug mb-1">{book.title}</h3>
                      <p className="text-sm font-medium text-gray-500 mb-2">{book.auteur}</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {book.type && (
                          <span className="inline-block bg-gray-900 text-white text-xs px-2 py-0.5 rounded-full">{book.type}</span>
                        )}
                        {getGenreLabels(book).map((genreLabel) => (
                          <span key={genreLabel} className="inline-block bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">
                            {genreLabel}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2 mt-auto leading-relaxed">{book.description}</p>
                    </div>
                  </Link>

                  <div className="px-4 pb-4">
                    {isInLibrary ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusSelect bookId={book.id} userId={user.user_id} currentStatus={currentStatus} />
                        <FavouriteButton bookId={book.id} userId={user.user_id} isFavourite={isFavourite} />
                      </div>
                    ) : (
                      <AddToLibraryButton bookId={book.id} userId={user.user_id} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredBooks.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-lg font-medium">Aucun livre trouve</p>
              <p className="text-sm mt-1">Essayez un autre filtre</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
