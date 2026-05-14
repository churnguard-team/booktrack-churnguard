// ============================================================
// /admin/books/[id]/edit/page.tsx — Page de modification d'un livre
// Server Component : on fetch le livre depuis l'API et on passe
// ses données au formulaire Client Component (EditBookForm)
// ============================================================

import Navbar from "@/app/components/Navbar";
import Link from "next/link";
import EditBookForm from "./EditBookForm";

// Type complet du livre (correspondant à BookResponse du backend)
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

export default async function EditBookPage({ params }: { params: Promise<{ id: string }> }) {
  // Next.js 15+ : params est async
  const { id } = await params;

  const apiUrl = process.env.API_URL || "http://localhost:8000";

  // Fetch du livre existant pour pré-remplir le formulaire
  const res = await fetch(`${apiUrl}/books/${id}`, { cache: "no-store" });

  // Si le livre n'existe pas, on affiche un message d'erreur
  if (!res.ok) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-8 text-center">
          <p className="text-5xl mb-4">❌</p>
          <p className="text-xl font-semibold text-gray-700">Livre introuvable</p>
          <Link href="/admin/books" className="text-sm text-blue-600 hover:underline mt-4 inline-block">
            ← Retour à la liste
          </Link>
        </div>
      </main>
    );
  }

  const book: BookDetail = await res.json();

  // On prépare les données initiales pour le formulaire (tout en string pour les inputs)
  const initialData = {
    title: book.title ?? "",
    description: book.description ?? "",
    auteur: book.auteur ?? "",
    genre: book.genre ?? "",
    cover_url: book.cover_url ?? "",
    nb_pages: book.nb_pages?.toString() ?? "",
    // date_publication vient du backend au format "YYYY-MM-DD", parfait pour <input type="date">
    date_publication: book.date_publication ?? "",
    langue: book.langue ?? "",
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* LIEN DE RETOUR */}
        <Link
          href="/admin/books"
          className="text-sm text-gray-500 hover:text-gray-800 mb-6 inline-block transition-colors"
        >
          ← Retour à la liste des livres
        </Link>

        {/* EN-TÊTE */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            ✏️ Modifier un livre
          </h1>
          <p className="text-gray-500 mt-1">
            Vous modifiez : <span className="font-semibold text-gray-700">{book.title}</span>
          </p>
        </div>

        {/* CARTE FORMULAIRE */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/*
            EditBookForm est un Client Component.
            On lui passe :
            - bookId : pour construire l'URL du PUT /books/{id}
            - initialData : les valeurs actuelles du livre pour pré-remplir le formulaire
          */}
          <EditBookForm bookId={book.id} initialData={initialData} />
        </div>
      </div>
    </main>
  );
}
