import Navbar from "@/app/components/Navbar";
import BookCarousel from "@/app/components/BookCarousel";
import Link from "next/link";
import { cookies } from "next/headers";
import { getDictionary } from "@/app/i18n/dictionaries";
import FilterBar from "./FilterBar";
import { bookMatchesGenre, getGenreLabels, type GenreInfo } from "./genreUtils";
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

export default async function BooksPage({ searchParams }: { searchParams: Promise<{ q?: string; genre?: string; type?: string; author?: string; year?: string; filter?: string }> }) {
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

  const apiUrl = process.env.API_URL || "http://localhost:8000";

  const [allBooksRes, libraryRes, trendingRes] = await Promise.all([
    fetch(`${apiUrl}/books`, { cache: "no-store" }),
    user
      ? fetch(`${apiUrl}/users/${user.user_id}/library/`, { cache: "no-store" })
      : Promise.resolve(new Response("[]")),
    fetch(`${apiUrl}/books/trending`, { cache: "no-store" }),
  ]);

  const allBooks: BookItem[] = allBooksRes.ok ? await allBooksRes.json() : [];
  const library = libraryRes.ok ? await libraryRes.json() : [];
  const trendingBooks: BookItem[] = trendingRes.ok ? await trendingRes.json() : [];

  const libraryMap = new Map(
    library.map((ub: { book_id: string; is_favourite: boolean; status: string }) => [ub.book_id, ub])
  );

  let filteredBooks = allBooks;
  if (recherche) filteredBooks = filteredBooks.filter((b) => b.title.toLowerCase().includes(recherche));
  if (type) filteredBooks = filteredBooks.filter((b) => b.type === type);
  if (genre) filteredBooks = filteredBooks.filter((b) => bookMatchesGenre(b, genre));
  if (author) filteredBooks = filteredBooks.filter((b) => b.auteur?.toLowerCase().includes(author.toLowerCase()));
  if (year) filteredBooks = filteredBooks.filter((b) => b.date_publication?.startsWith(year));
  if (filter === "recent") filteredBooks = [...filteredBooks].reverse();

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-8">

        {trendingBooks.length > 0 && !(recherche || genre || filter) && (
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
              <h2 className="text-xl font-bold text-gray-800">{dict.home.all_books_title}</h2>
              <p className="text-sm text-gray-400 mt-0.5">
                {recherche
                  ? dict.home.results_for.replace("{count}", filteredBooks.length.toString()).replace("{query}", recherche)
                  : dict.home.books_available.replace("{count}", allBooks.length.toString())}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex-grow">
              <FilterBar books={allBooks} />
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

          {filteredBooks.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-lg font-medium">{dict.home.no_books_found}</p>
              <p className="text-sm mt-1">{dict.home.try_another_term}</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
