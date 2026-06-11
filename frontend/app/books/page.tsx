import Navbar from "@/app/components/Navbar";
import BookCarousel from "@/app/components/BookCarousel";
import Link from "next/link";
import { cookies } from "next/headers";
import { getDictionary } from "@/app/i18n/dictionaries";
import FilterBar from "./FilterBar";
import { bookMatchesAnyGenre, bookMatchesGenre, getGenreLabels, type GenreInfo } from "./genreUtils";
import AddToLibraryButton from "./AddToLibraryButton";
import FavouriteButton from "./FavouriteButton";
import StatusSelect from "./StatusSelect";

export type BookItem = {
  id: string;
  title: string;
  auteur?: string;
  type?: string;
  genre?: string;
  genres?: GenreInfo[];
  description?: string;
  cover_url?: string;
  date_publication?: string;
};

export default async function BooksPage({ searchParams }: {
  searchParams: Promise<{ q?: string; genre?: string; type?: string; author?: string; year?: string; filter?: string; page?: string; personalized?: string; genres?: string; show_all?: string }>
}) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("user_session");
  const user = sessionCookie ? JSON.parse(decodeURIComponent(sessionCookie.value)) : null;

  const localeCookie = cookieStore.get("NEXT_LOCALE");
  const locale = localeCookie?.value || "fr";
  const dict = await getDictionary(locale);

  const params = await searchParams;
  const recherche = params.q?.toLowerCase() || "";
  const genre = params.genre?.toLowerCase() || "";
  const type = params.type || "";
  const author = params.author || "";
  const year = params.year || "";
  const filter = params.filter?.toLowerCase() || "";
  const personalized = params.personalized === "1";
  const showAll = params.show_all === "1";
  const page = parseInt(params.page || "1");
  const PAGE_SIZE = 25;
  const skip = (page - 1) * PAGE_SIZE;
  // Charger plus de livres pour permettre le filtrage par genres préférés
  const fetchLimit = user ? 200 : PAGE_SIZE;
  const fetchSkip = user ? 0 : skip;

  const apiUrl = process.env.API_URL || "http://localhost:8000";

  const safe = (p: Promise<Response>) => p.catch(() => new Response("null"));

  const [allBooksRes, libraryRes, trendingRes, recoRes, totalRes, profileRes] = await Promise.all([
    safe(fetch(`${apiUrl}/books?skip=${fetchSkip}&limit=${fetchLimit}`, { cache: "no-store" })),
    user
      ? safe(fetch(`${apiUrl}/users/${user.user_id}/library/`, { cache: "no-store" }))
      : Promise.resolve(new Response("[]")),
    safe(fetch(`${apiUrl}/books/trending`, { cache: "no-store" })),
    user
      ? safe(fetch(`${apiUrl}/api/recommendations/user/${user.user_id}?n=12`, { cache: "no-store" }))
      : Promise.resolve(new Response(JSON.stringify({ recommendations: [] }))),
    safe(fetch(`${apiUrl}/books/count`, { cache: "no-store" })),
    user
      ? safe(fetch(`${apiUrl}/users/${user.user_id}/profile`, { cache: "no-store" }))
      : Promise.resolve(new Response(JSON.stringify({ genres_preferes: [] }))),
  ]);

  const allBooks: BookItem[] = allBooksRes.ok ? (await allBooksRes.json().catch(() => null)) ?? [] : [];
  const library = libraryRes.ok ? (await libraryRes.json().catch(() => null)) ?? [] : [];
  const trendingBooks: BookItem[] = trendingRes.ok ? (await trendingRes.json().catch(() => null)) ?? [] : [];
  const recoData = recoRes.ok ? (await recoRes.json().catch(() => null)) ?? { recommendations: [] } : { recommendations: [] };
  const totalRaw = totalRes.ok ? (await totalRes.json().catch(() => null)) : null;
  const total: number = totalRaw?.total ?? allBooks.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const recommendedBooks = (recoData.recommendations ?? []).map(
    (r: { book_id: string; title: string; auteur?: string; genre?: string; cover_url?: string; reason?: string }) => ({
      id: r.book_id,
      title: r.title,
      auteur: r.auteur,
      genre: r.genre,
      cover_url: r.cover_url,
      reason: r.reason,
    })
  );

  const libraryMap = new Map(
    library.map((ub: { book_id: string; is_favourite: boolean; status: string }) => [ub.book_id, ub])
  );

  const profileData = profileRes.ok ? await profileRes.json() : { genres_preferes: [] };
  const userPreferredGenres: string[] =
    params.genres?.split(",").map((g) => g.trim()).filter(Boolean)
    ?? profileData.genres_preferes
    ?? [];

  const hasActiveFilters = !!(recherche || genre || filter || type || author || year);
  const showPersonalizedCatalog = user && userPreferredGenres.length > 0 && !showAll && (personalized || !hasActiveFilters);

  let filteredBooks = allBooks;
  if (showPersonalizedCatalog) {
    filteredBooks = filteredBooks.filter((b) => bookMatchesAnyGenre(b, userPreferredGenres));
  }
  if (recherche) filteredBooks = filteredBooks.filter((b) => b.title.toLowerCase().includes(recherche));
  if (type) filteredBooks = filteredBooks.filter((b) => b.type === type);
  if (genre) filteredBooks = filteredBooks.filter((b) => bookMatchesGenre(b, genre));
  if (author) filteredBooks = filteredBooks.filter((b) => b.auteur?.toLowerCase().includes(author.toLowerCase()));
  if (year) filteredBooks = filteredBooks.filter((b) => b.date_publication?.startsWith(year));
  if (filter === "recent") filteredBooks = [...filteredBooks].reverse();

  const paginatedBooks = user
    ? filteredBooks.slice(skip, skip + PAGE_SIZE)
    : filteredBooks;
  const effectiveTotalPages = user
    ? Math.max(1, Math.ceil(filteredBooks.length / PAGE_SIZE))
    : totalPages;

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-8">

        {personalized && user && (
          <div className="mb-8 p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
            <p className="text-indigo-800 font-semibold">Bienvenue sur BookTrack !</p>
            <p className="text-sm text-indigo-600 mt-1">
              Voici une sélection basée sur vos genres préférés
              {userPreferredGenres.length > 0 ? ` : ${userPreferredGenres.join(", ")}` : ""}.
            </p>
          </div>
        )}

        {recommendedBooks.length > 0 && !(recherche || genre || filter) && (
          <section className="mb-12">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-gray-800">✨ Recommandés pour vous</h2>
              <p className="text-sm text-gray-400 mt-0.5">Basé sur vos lectures et préférences du quiz</p>
            </div>
            <BookCarousel books={recommendedBooks} basePath="/books" />
          </section>
        )}

        {trendingBooks.length > 0 && !(recherche || genre || filter) && !showPersonalizedCatalog && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{dict.home.trending_title}</h2>
                <p className="text-sm text-gray-400 mt-0.5">{dict.home.trending_subtitle}</p>
              </div>
            </div>
            <BookCarousel books={trendingBooks} basePath="/books" />
          </section>
        )}

        <div className="border-t border-gray-200 mb-8" />

        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {showPersonalizedCatalog ? "📚 Livres pour vous" : dict.home.all_books_title}
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">
                {recherche
                  ? dict.home.results_for.replace("{count}", filteredBooks.length.toString()).replace("{query}", recherche)
                  : showPersonalizedCatalog
                    ? `${filteredBooks.length} livre${filteredBooks.length > 1 ? "s" : ""} correspondant à vos goûts`
                    : dict.home.books_available.replace("{count}", total.toString())}
              </p>
              {showPersonalizedCatalog && !hasActiveFilters && (
                <Link href="/books?show_all=1" className="text-sm text-indigo-600 hover:underline mt-1 inline-block">
                  Voir tout le catalogue →
                </Link>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex-grow">
              <FilterBar books={allBooks} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedBooks.map((book: BookItem) => {
              const userBook = libraryMap.get(book.id) as { is_favourite: boolean; status: string } | undefined;
              const isInLibrary = !!userBook;
              const isFavourite = isInLibrary ? userBook!.is_favourite : false;
              const currentStatus = isInLibrary ? userBook!.status : "TO_READ";

              return (
                <div
                  key={book.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1"
                >
                  <Link href={`/books/${book.id}`} className="flex flex-col flex-grow">
                    <div className="relative">
                      {book.cover_url ? (
                        <img src={book.cover_url} alt={book.title} className="w-full h-52 object-cover" />
                      ) : (
                        <div className="w-full h-52 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                          <span className="text-5xl">📖</span>
                        </div>
                      )}
                      {isFavourite && <span className="absolute top-2 right-2 text-xl drop-shadow">⭐</span>}
                      {isInLibrary && !isFavourite && (
                        <span className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs font-semibold text-emerald-600 shadow-sm">
                          {dict.home.in_library}
                        </span>
                      )}
                    </div>

                    <div className="p-4 flex flex-col flex-grow">
                      <h3 className="font-semibold text-gray-900 line-clamp-2 leading-snug mb-1">{book.title}</h3>
                      <p className="text-sm font-medium text-gray-500 mb-2">{book.auteur}</p>
                      <div className="flex flex-col gap-1 mb-2">
                        {book.type && (
                          <span className="inline-block bg-gray-900 text-white text-xs px-2 py-0.5 rounded-full w-fit">{book.type}</span>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {getGenreLabels(book).map((genreLabel) => (
                            <span key={genreLabel} className="inline-block bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full w-fit">
                              {genreLabel}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2 mt-auto leading-relaxed">{book.description}</p>
                    </div>
                  </Link>

                  {user && (
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
                  )}
                </div>
              );
            })}
          </div>

          {paginatedBooks.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-lg font-medium">{dict.home.no_books_found}</p>
              <p className="text-sm mt-1">{dict.home.try_another_term}</p>
            </div>
          )}

          {!recherche && !genre && !filter && effectiveTotalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-10">
              {page > 1 && (
                <Link
                  href={`/books?page=${page - 1}${personalized ? "&personalized=1" : ""}${showAll ? "&show_all=1" : ""}${params.genres ? `&genres=${encodeURIComponent(params.genres)}` : ""}`}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  ← Précédent
                </Link>
              )}
              <span className="text-sm text-gray-500">Page {page} sur {effectiveTotalPages}</span>
              {page < effectiveTotalPages && (
                <Link
                  href={`/books?page=${page + 1}${personalized ? "&personalized=1" : ""}${showAll ? "&show_all=1" : ""}${params.genres ? `&genres=${encodeURIComponent(params.genres)}` : ""}`}
                  className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700"
                >
                  Suivant →
                </Link>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
