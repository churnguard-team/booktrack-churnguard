"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface Book {
  book_id: string;
  title: string;
  auteur: string;
  genre: string;
  cover_url: string;
  score: number;
  reason: string;
  note_moyenne: number | null;
}

const REASON_LABEL: Record<string, string> = {
  genre_preference:   "🎯 Vos genres préférés",
  based_on_comments:  "💬 Basé sur vos avis",
  recently_viewed:    "👁️ Récemment consulté",
  popular:            "🔥 Populaire",
};

const FREE_VISIBLE = 3; // nb de cartes visibles pour les FREE

export default function RecommendationsSection({
  userId,
  isPremium,
}: {
  userId: string;
  isPremium: boolean;
}) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    // Premium → 10 recs, Free → on fetch 10 mais on en montre que 3 nettement
    fetch(`${API}/api/recommendations/${userId}?n=10`)
      .then((r) => r.json())
      .then((data) => setBooks(Array.isArray(data) ? data : data.recommendations ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return (
    <div className="flex items-center justify-center py-12 text-gray-400">
      Chargement des recommandations…
    </div>
  );

  if (!books.length) return null;

  const visible  = isPremium ? books : books.slice(0, FREE_VISIBLE);
  const blurred  = isPremium ? [] : books.slice(FREE_VISIBLE);

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">📚 Recommandé pour vous</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Sélectionnés par notre IA selon votre profil de lecture
          </p>
        </div>
        {isPremium && (
          <span className="flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
            ⭐ Premium
          </span>
        )}
      </div>

      <div className="relative">
        {/* Grille de cartes */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Cartes visibles */}
          {visible.map((book) => (
            <BookCard key={book.book_id} book={book} />
          ))}

          {/* Cartes floutées */}
          {blurred.map((book) => (
            <div key={book.book_id} className="relative">
              <div className="blur-sm pointer-events-none select-none opacity-60">
                <BookCard book={book} />
              </div>
            </div>
          ))}
        </div>

        {/* Overlay unlock — affiché uniquement si FREE */}
        {!isPremium && blurred.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-64 flex flex-col items-center justify-end pb-6"
            style={{
              background: "linear-gradient(to bottom, transparent 0%, rgba(249,250,251,0.85) 40%, rgb(249,250,251) 100%)"
            }}
          >
            <div className="text-center px-4">
              <p className="text-3xl mb-2">🔒</p>
              <p className="font-bold text-gray-900 text-lg">
                {blurred.length} recommandations supplémentaires
              </p>
              <p className="text-gray-500 text-sm mt-1 mb-4">
                Passez Premium pour accéder à toutes vos recommandations personnalisées
              </p>
              <Link
                href="/pricing"
                className="inline-block rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-indigo-700 transition-all hover:scale-105"
              >
                ✨ Débloquer Premium
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BookCard({ book }: { book: Book }) {
  return (
    <Link href={`/books/${book.book_id}`}>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer">
        {book.cover_url ? (
          <img src={book.cover_url} alt={book.title} className="w-full h-40 object-cover" />
        ) : (
          <div className="w-full h-40 bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center">
            <span className="text-4xl">📖</span>
          </div>
        )}
        <div className="p-3">
          <p className="font-semibold text-gray-900 text-sm line-clamp-2 leading-snug mb-1">
            {book.title}
          </p>
          <p className="text-xs text-gray-400 mb-2 truncate">{book.auteur}</p>
          <span className="inline-block rounded-full bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 font-medium">
            {REASON_LABEL[book.reason] ?? "🔍 Sélectionné"}
          </span>
          {book.note_moyenne && (
            <p className="text-xs text-amber-500 mt-1 font-medium">
              ★ {book.note_moyenne.toFixed(1)}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
