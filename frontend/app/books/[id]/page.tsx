import Navbar from "@/app/components/Navbar";
import Link from "next/link";
import CommentSection from "@/app/components/CommentSection";
import { cookies } from "next/headers";
import AddToLibraryButton from "../AddToLibraryButton";
import FavouriteButton from "../FavouriteButton";
import StatusSelect from "../StatusSelect";
import RatingStars from "../RatingStars";
import { getGenreLabels, type GenreInfo } from "../genreUtils";

type BookDetail = {
  id: string;
  title: string;
  auteur?: string;
  type?: string;
  genre?: string;
  genres?: GenreInfo[];
  description?: string;
  cover_url?: string;
  nb_pages?: number;
  date_publication?: string;
  langue?: string;
  avg_rating?: number | null;
  rating_count?: number;
};

export default async function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("user_session");
  const user = sessionCookie ? JSON.parse(decodeURIComponent(sessionCookie.value)) : null;

  const apiUrl = process.env.API_URL || "http://localhost:8000";

  const [bookRes, libraryRes] = await Promise.all([
    fetch(`${apiUrl}/books/${id}`, { cache: "no-store" }),
    user
      ? fetch(`${apiUrl}/users/${user.user_id}/library/`, { cache: "no-store" })
      : Promise.resolve(new Response("[]")),
  ]);

  if (!bookRes.ok) return <p className="p-8 text-red-500">Livre non trouve.</p>;

  const book: BookDetail = await bookRes.json();
  const library = libraryRes.ok ? await libraryRes.json() : [];

  const userBook = library.find((ub: { book_id: string; is_favourite: boolean; status: string; rating: number | null }) => ub.book_id === id);
  const isInLibrary = !!userBook;
  const isFavourite = isInLibrary ? userBook.is_favourite : false;
  const currentStatus = isInLibrary ? userBook.status : "TO_READ";
  const currentRating = isInLibrary ? (userBook.rating ?? null) : null;

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-8">
      <Navbar />
      <div className="max-w-4xl mx-auto mt-8">
        <Link href="/books" className="text-sm text-gray-500 hover:text-gray-800 mb-6 inline-block">
          Retour a la bibliotheque
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row gap-8 p-8">
          {book.cover_url ? (
            <img src={book.cover_url} alt={book.title} className="w-48 h-72 object-cover rounded-xl shadow-md flex-shrink-0" />
          ) : (
            <div className="w-48 h-72 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center rounded-xl shadow-md flex-shrink-0">
              <span className="text-5xl">📖</span>
            </div>
          )}

          <div className="flex flex-col gap-3 flex-grow">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{book.title}</h1>
            <p className="text-lg text-gray-600 font-medium">{book.auteur}</p>

            <div className="flex flex-col gap-2">
              {book.type && (
                <span className="inline-block bg-gray-900 text-white text-sm px-3 py-1 rounded-full w-fit">{book.type}</span>
              )}
              <div className="flex flex-wrap gap-2">
                {getGenreLabels(book).map((genreLabel) => (
                  <span key={genreLabel} className="inline-block bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full w-fit">
                    {genreLabel}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {book.avg_rating ? (
                <>
                  <span className="text-sm font-semibold text-gray-700">{book.avg_rating}/5</span>
                  <span className="text-xs text-gray-400">({book.rating_count} avis)</span>
                </>
              ) : (
                <span className="text-xs text-gray-400">Pas encore note</span>
              )}
            </div>

            <p className="text-gray-700 mt-2 leading-relaxed">{book.description}</p>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-500">
              {book.nb_pages && <p>Pages: <span className="font-medium text-gray-700">{book.nb_pages}</span></p>}
              {book.date_publication && <p>Date: <span className="font-medium text-gray-700">{book.date_publication}</span></p>}
              {book.langue && <p>Langue: <span className="font-medium text-gray-700">{book.langue}</span></p>}
            </div>

            <div className="mt-auto pt-6 flex flex-col gap-4">
              {isInLibrary ? (
                <>
                  <div className="flex items-center gap-3 flex-wrap">
                    <StatusSelect bookId={book.id} userId={user?.user_id} currentStatus={currentStatus} />
                    <FavouriteButton bookId={book.id} userId={user?.user_id ?? null} isFavourite={isFavourite} />
                  </div>
                  {["READ", "ABANDONED"].includes(currentStatus) ? (
                    <RatingStars bookId={book.id} userId={user.user_id} currentRating={currentRating} />
                  ) : (
                    <p className="text-xs text-gray-400">Terminez ou abandonnez le livre pour le noter.</p>
                  )}
                </>
              ) : (
                <AddToLibraryButton bookId={book.id} userId={user?.user_id ?? null} />
              )}
            </div>
          </div>
        </div>

        <CommentSection bookId={id} userId={user?.user_id ?? null} />
      </div>
    </main>
  );
}
