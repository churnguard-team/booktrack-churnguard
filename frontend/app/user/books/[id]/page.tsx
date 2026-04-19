import Navbar from "@/app/components/Navbar";
import Link from "next/link";

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

export default async function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const apiUrl = process.env.API_URL || "http://localhost:8000";
  const res = await fetch(`${apiUrl}/books/${id}`, { cache: "no-store" });

  if (!res.ok) return <p className="p-8 text-red-500">Livre non trouvé.</p>;

  const book: BookDetail = await res.json();

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-8">
      <Navbar />
      <div className="max-w-4xl mx-auto mt-8">
        <Link href="/user/books" className="text-sm text-gray-500 hover:text-gray-800 mb-6 inline-block">
          ← Retour à la bibliothèque
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row gap-8 p-8">
          
          {/* Image */}
          {book.cover_url && (
            <img
              src={book.cover_url}
              alt={book.title}
              className="w-48 h-72 object-cover rounded-xl shadow-md flex-shrink-0"
            />
          )}

          {/* Infos */}
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{book.title}</h1>
            <p className="text-lg text-gray-600 font-medium">{book.auteur}</p>
            <span className="inline-block bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full w-fit">{book.genre}</span>

            <p className="text-gray-700 mt-2 leading-relaxed">{book.description}</p>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-500">
              {book.nb_pages && <p>📄 <span className="font-medium text-gray-700">{book.nb_pages} pages</span></p>}
              {book.date_publication && <p>📅 <span className="font-medium text-gray-700">{book.date_publication}</span></p>}
              {book.langue && <p>🌍 <span className="font-medium text-gray-700">{book.langue}</span></p>}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
