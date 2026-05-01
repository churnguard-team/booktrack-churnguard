// Importation des composants nécessaires
import Navbar from "@/app/components/Navbar";
import Link from "next/link";
import CommentSection from "@/app/components/CommentSection"; // Section des commentaires
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AddToLibraryButton from "../AddToLibraryButton"; // Composant Client
import FavouriteButton from "../FavouriteButton"; // Composant Client
import { getDictionary } from "@/app/i18n/dictionaries";

// Type TypeScript qui définit la structure d'un livre reçu de l'API
type BookDetail = {
  id: string;
  title: string;
  auteur?: string;
  genre?: string;
  description?: string;
  cover_url?: string;
  nb_pages?: number;
  date_publication?: string;
  langue?: string;
};

/**
 * Page de détail d'un livre — composant async car il fait un fetch côté serveur
 */
export default async function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Récupère l'identifiant du livre depuis les paramètres d'URL (ex: /user/books/abc-123)
  const { id } = await params;

  // ===== AUTHENTIFICATION =====
  // Nécessaire pour savoir si ce livre est dans la liste de l'utilisateur
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("user_session");
  if (!sessionCookie) redirect("/");
  const user = JSON.parse(decodeURIComponent(sessionCookie.value));

  const locale = cookieStore.get("NEXT_LOCALE")?.value || "fr";
  const dict = await getDictionary(locale);
  const isRtl = locale === "ar";

  // URL de l'API (utilise la variable d'environnement ou localhost en fallback)
  const apiUrl = process.env.API_URL || "http://localhost:8000";

  // ===== APPELS API EN PARALLÈLE =====
  // On récupère les détails du livre ET la bibliothèque de l'utilisateur en même temps
  const [bookRes, libraryRes] = await Promise.all([
    fetch(`${apiUrl}/books/${id}`, { cache: "no-store" }),
    fetch(`${apiUrl}/users/${user.user_id}/library`, { cache: "no-store" })
  ]);

  // Si le livre n'existe pas, affiche un message d'erreur
  if (!bookRes.ok) return <p className="p-8 text-red-500">{dict.book_detail.not_found}</p>;

  // Convertit les réponses JSON
  const book: BookDetail = await bookRes.json();
  const library = libraryRes.ok ? await libraryRes.json() : [];

  // ===== VÉRIFICATION DU STATUT DU LIVRE =====
  // Cherche si ce livre spécifique est déjà dans la bibliothèque de l'utilisateur
  const userBook = library.find((ub: { book_id: string; is_favourite: boolean }) => ub.book_id === id);
  const isInLibrary = !!userBook; // true si trouvé, false sinon
  const isFavourite = isInLibrary ? userBook.is_favourite : false;

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-8">
      <Navbar />
      <div className="max-w-4xl mx-auto mt-8">
        {/* Bouton de retour vers la bibliothèque */}
        <Link href="/user/books" className="text-sm text-gray-500 hover:text-gray-800 mb-6 inline-block">
          {isRtl ? "→" : "←"} {dict.book_detail.back_to_library}
        </Link>

        {/* Carte principale avec la couverture et les informations du livre */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row gap-8 p-8">

          {/* Image de couverture du livre */}
          {book.cover_url ? (
            <img
              src={book.cover_url}
              alt={book.title}
              className="w-48 h-72 object-cover rounded-xl shadow-md flex-shrink-0"
            />
          ) : (
            <div className="w-48 h-72 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center rounded-xl shadow-md flex-shrink-0">
              <span className="text-5xl">📖</span>
            </div>
          )}

          {/* Bloc des informations textuelles du livre */}
          <div className="flex flex-col gap-3 flex-grow">
            {/* Titre du livre */}
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{book.title}</h1>
            {/* Auteur */}
            <p className="text-lg text-gray-600 font-medium">{book.auteur}</p>
            {/* Badge de genre */}
            {book.genre && (
              <span className="inline-block bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full w-fit">
                {book.genre}
              </span>
            )}

            {/* Description du livre */}
            <p className="text-gray-700 mt-2 leading-relaxed">{book.description}</p>

            {/* Métadonnées : nombre de pages, date de publication, langue */}
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-500">
              {book.nb_pages && (
                <p>
                  📄{" "}
                  <span className="font-medium text-gray-700">
                    {dict.book_detail.pages.replace("{count}", String(book.nb_pages))}
                  </span>
                </p>
              )}
              {book.date_publication && <p>📅 <span className="font-medium text-gray-700">{book.date_publication}</span></p>}
              {book.langue && <p>🌍 <span className="font-medium text-gray-700">{book.langue}</span></p>}
            </div>

            {/* ===== BOUTONS D'ACTION ===== */}
            <div className="mt-auto pt-6">
              {isInLibrary ? (
                // Si le livre est déjà dans la liste, on affiche le bouton Favori
                <div className="flex items-center gap-3">
                  <span className="text-sm text-emerald-600 font-bold bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                    {dict.book_detail.in_your_library}
                  </span>
                  <FavouriteButton
                    bookId={book.id}
                    userId={user.user_id}
                    isFavourite={isFavourite}
                  />
                </div>
              ) : (
                // Sinon, on propose de l'ajouter
                <AddToLibraryButton bookId={book.id} userId={user.user_id} />
              )}
            </div>
          </div>
        </div>

        {/* ─── Section des commentaires ────────────────────────────────────────
            Ce composant est "use client" : il gère l'interactivité (fetch, formulaire)
            On lui passe l'id du livre pour qu'il charge et envoie les bons commentaires */}
        <CommentSection bookId={id} />

      </div>
    </main>
  );
}
