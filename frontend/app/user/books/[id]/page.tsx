// Importation des composants nécessaires
import Navbar from "@/app/components/Navbar";
import Link from "next/link";
import CommentSection from "@/app/components/CommentSection"; // Section des commentaires

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

// Page de détail d'un livre — composant async car il fait un fetch côté serveur
export default async function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Récupère l'identifiant du livre depuis les paramètres d'URL (ex: /user/books/abc-123)
  const { id } = await params;

  // URL de l'API (utilise la variable d'environnement ou localhost en fallback)
  const apiUrl = process.env.API_URL || "http://localhost:8000";

  // Appel à l'API pour récupérer les infos du livre (sans cache pour toujours avoir les données fraîches)
  const res = await fetch(`${apiUrl}/books/${id}`, { cache: "no-store" });

  // Si le livre n'existe pas, affiche un message d'erreur
  if (!res.ok) return <p className="p-8 text-red-500">Livre non trouvé.</p>;

  // Convertit la réponse JSON en objet TypeScript
  const book: BookDetail = await res.json();

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-8">
      <Navbar />
      <div className="max-w-4xl mx-auto mt-8">
        {/* Bouton de retour vers la bibliothèque */}
        <Link href="/user/books" className="text-sm text-gray-500 hover:text-gray-800 mb-6 inline-block">
          ← Retour à la bibliothèque
        </Link>

        {/* Carte principale avec la couverture et les informations du livre */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row gap-8 p-8">
          
          {/* Image de couverture du livre */}
          {book.cover_url && (
            <img
              src={book.cover_url}
              alt={book.title}
              className="w-48 h-72 object-cover rounded-xl shadow-md flex-shrink-0"
            />
          )}

          {/* Bloc des informations textuelles du livre */}
          <div className="flex flex-col gap-3">
            {/* Titre du livre */}
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{book.title}</h1>
            {/* Auteur */}
            <p className="text-lg text-gray-600 font-medium">{book.auteur}</p>
            {/* Badge de genre */}
            <span className="inline-block bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full w-fit">{book.genre}</span>

            {/* Description du livre */}
            <p className="text-gray-700 mt-2 leading-relaxed">{book.description}</p>

            {/* Métadonnées : nombre de pages, date de publication, langue */}
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-500">
              {book.nb_pages && <p>📄 <span className="font-medium text-gray-700">{book.nb_pages} pages</span></p>}
              {book.date_publication && <p>📅 <span className="font-medium text-gray-700">{book.date_publication}</span></p>}
              {book.langue && <p>🌍 <span className="font-medium text-gray-700">{book.langue}</span></p>}
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
