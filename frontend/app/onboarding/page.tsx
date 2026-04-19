"use client";
// ============================================================
// /onboarding/page.tsx — Quiz de personnalisation (3 étapes)
// Client Component car on a besoin de useState pour naviguer
// entre les étapes et mémoriser les sélections de l'utilisateur
// ============================================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// ===== TYPES =====
type BookItem = {
  id: string;
  title: string;
  auteur?: string;
  cover_url?: string;
  genre?: string;
};

// ===== DONNÉES : Genres proposés avec emoji =====
// On utilisera la colonne genres_preferes (text[]) du backend
const GENRES = [
  { label: "Roman",              emoji: "📖" },
  { label: "Science-Fiction",   emoji: "🚀" },
  { label: "Thriller",          emoji: "🔪" },
  { label: "Polar",             emoji: "🕵️" },
  { label: "Philosophie",       emoji: "💭" },
  { label: "Histoire",          emoji: "🏛️" },
  { label: "BD / Manga",        emoji: "🎨" },
  { label: "Biographie",        emoji: "📝" },
  { label: "Fantastique",       emoji: "🧙" },
  { label: "Romance",           emoji: "💕" },
  { label: "Voyage",            emoji: "🌍" },
  { label: "Développement",     emoji: "💼" },
];

export default function OnboardingPage() {
  const router = useRouter();

  // ===== ÉTAT GLOBAL =====
  const [step, setStep]                     = useState(1); // Étape actuelle : 1, 2, ou 3
  const [userId, setUserId]                 = useState<string | null>(null);
  const [prenom, setPrenom]                 = useState("là");
  const [allBooks, setAllBooks]             = useState<BookItem[]>([]);
  const [isSaving, setIsSaving]             = useState(false);

  // Étape 1 : genres sélectionnés (toggle actif/inactif)
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  // Étape 2 : livres déjà lus (on mémorise les IDs)
  const [readBooks, setReadBooks]           = useState<Set<string>>(new Set());

  // Étape 3 : favoris parmi les livres lus
  const [favouriteBooks, setFavouriteBooks] = useState<Set<string>>(new Set());

  // ===== RÉCUPÉRATION DU COOKIE DE SESSION =====
  useEffect(() => {
    // Lecture du cookie user_session pour identifier l'utilisateur
    const raw = document.cookie
      .split("; ")
      .find((c) => c.startsWith("user_session="))
      ?.split("=")
      .slice(1)
      .join("=");

    if (!raw) {
      router.push("/login"); // Pas connecté → retour au login
      return;
    }

    const session = JSON.parse(decodeURIComponent(raw));

    // Si l'utilisateur a DÉJÀ fait le quiz → on le redirige
    if (session.has_onboarded) {
      router.push("/user/books");
      return;
    }

    setUserId(session.user_id);
    setPrenom(session.prenom || "là");

    // ===== CHARGEMENT DE TOUS LES LIVRES (pour l'étape 2) =====
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    fetch(`${apiUrl}/books`)
      .then((res) => res.json())
      .then((data) => setAllBooks(data))
      .catch(console.error);
  }, [router]);


  // ===== HANDLERS =====

  // Toggle d'un genre → sélectionné ou désélectionné
  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  // Toggle d'un livre comme "déjà lu"
  const toggleReadBook = (bookId: string) => {
    setReadBooks((prev) => {
      const next = new Set(prev);
      if (next.has(bookId)) {
        next.delete(bookId);
        // Si on désélectionne un livre lu, on retire aussi des favoris
        setFavouriteBooks((fav) => {
          const favNext = new Set(fav);
          favNext.delete(bookId);
          return favNext;
        });
      } else {
        next.add(bookId);
      }
      return next;
    });
  };

  // Toggle d'un livre comme "favori" (parmi les livres lus)
  const toggleFavourite = (bookId: string) => {
    setFavouriteBooks((prev) => {
      const next = new Set(prev);
      if (next.has(bookId)) next.delete(bookId);
      else next.add(bookId);
      return next;
    });
  };

  // ===== SAUVEGARDE FINALE (Étape 3 → "Terminer") =====
  const handleFinish = async () => {
    if (!userId) return;
    setIsSaving(true);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    try {
      // 1. Sauvegarde des genres préférés → PATCH /users/{id}/profile
      await fetch(`${apiUrl}/users/${userId}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ genres_preferes: selectedGenres }),
      });

      // 2. Ajout des livres lus ET favoris à la bibliothèque
      // On envoie une promesse par livre (toutes en parallèle avec Promise.all)
      const bookPromises = Array.from(readBooks).map((bookId) =>
        fetch(`${apiUrl}/users/${userId}/library`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            book_id: bookId,
            status: "READ",                          // Statut = déjà lu
            is_favourite: favouriteBooks.has(bookId) // Favori si coché à l'étape 3
          }),
        })
      );
      await Promise.all(bookPromises);

      // 3. Mise à jour du cookie → has_onboarded = true pour ne plus voir le quiz
      const raw = document.cookie
        .split("; ")
        .find((c) => c.startsWith("user_session="))
        ?.split("=")
        .slice(1)
        .join("=");
      if (raw) {
        const session = JSON.parse(decodeURIComponent(raw));
        session.has_onboarded = true;
        document.cookie = `user_session=${encodeURIComponent(JSON.stringify(session))}; path=/; max-age=86400`;
      }

      // 4. Redirection vers l'accueil
      router.push("/user/books");
    } catch (err) {
      console.error("Erreur onboarding :", err);
      setIsSaving(false);
    }
  };


  // ===== LIVRES "DÉJÀ LUS" (pour affichage à l'étape 3) =====
  const readBookItems = allBooks.filter((b) => readBooks.has(b.id));


  // ===== RENDU =====
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col items-center px-4 py-12">

      {/* ===== BARRE DE PROGRESSION ===== */}
      <div className="w-full max-w-2xl mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-indigo-600">Étape {step} sur 3</span>
          <span className="text-sm text-gray-400">{step === 1 ? "Genres" : step === 2 ? "Livres lus" : "Favoris"}</span>
        </div>
        {/* Barre de progression */}
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* ===== CARTE PRINCIPALE ===== */}
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">

        {/* Header de la carte */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-6 text-white">
          {step === 1 && (
            <>
              <p className="text-indigo-200 text-sm font-medium mb-1">Bienvenue, {prenom} ! 👋</p>
              <h1 className="text-2xl font-bold">Quels genres vous passionnent ?</h1>
              <p className="text-indigo-200 text-sm mt-1">Choisissez au moins 1 genre pour personnaliser votre expérience</p>
            </>
          )}
          {step === 2 && (
            <>
              <p className="text-indigo-200 text-sm font-medium mb-1">Super choix ! 📚</p>
              <h1 className="text-2xl font-bold">Quels livres avez-vous déjà lus ?</h1>
              <p className="text-indigo-200 text-sm mt-1">Cliquez sur les livres que vous avez terminés ({readBooks.size} sélectionné{readBooks.size > 1 ? "s" : ""})</p>
            </>
          )}
          {step === 3 && (
            <>
              <p className="text-indigo-200 text-sm font-medium mb-1">Presque fini ! ⭐</p>
              <h1 className="text-2xl font-bold">Vos coups de cœur ?</h1>
              <p className="text-indigo-200 text-sm mt-1">Parmi les livres lus, lesquels avez-vous adoré ?</p>
            </>
          )}
        </div>

        {/* Contenu de l'étape */}
        <div className="px-8 py-6">

          {/* ===== ÉTAPE 1 : GENRES ===== */}
          {step === 1 && (
            <div className="grid grid-cols-3 gap-3">
              {GENRES.map(({ label, emoji }) => {
                const isSelected = selectedGenres.includes(label);
                return (
                  <button
                    key={label}
                    onClick={() => toggleGenre(label)}
                    className={`flex flex-col items-center gap-1 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer
                      ${isSelected
                        ? "bg-indigo-50 border-indigo-400 shadow-sm scale-105"
                        : "bg-gray-50 border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/30"
                      }`}
                  >
                    <span className="text-2xl">{emoji}</span>
                    <span className={`text-xs font-semibold text-center leading-tight
                      ${isSelected ? "text-indigo-700" : "text-gray-600"}`}>
                      {label}
                    </span>
                    {/* Coche si sélectionné */}
                    {isSelected && (
                      <span className="text-indigo-500 text-xs font-bold">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* ===== ÉTAPE 2 : LIVRES LUS ===== */}
          {step === 2 && (
            <div className="grid grid-cols-3 gap-4 max-h-96 overflow-y-auto pr-1">
              {allBooks.map((book) => {
                const isSelected = readBooks.has(book.id);
                return (
                  <button
                    key={book.id}
                    onClick={() => toggleReadBook(book.id)}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all duration-200 text-left
                      ${isSelected
                        ? "border-indigo-400 shadow-md scale-105"
                        : "border-gray-200 hover:border-indigo-200"
                      }`}
                  >
                    {/* Couverture */}
                    {book.cover_url ? (
                      <img src={book.cover_url} alt={book.title} className="w-full h-36 object-cover" />
                    ) : (
                      <div className="w-full h-36 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <span className="text-3xl">📖</span>
                      </div>
                    )}
                    {/* Badge sélectionné */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-indigo-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow">
                        ✓
                      </div>
                    )}
                    {/* Infos */}
                    <div className="p-2">
                      <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-tight">{book.title}</p>
                      <p className="text-xs text-gray-400 truncate">{book.auteur}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* ===== ÉTAPE 3 : FAVORIS ===== */}
          {step === 3 && (
            <>
              {readBookItems.length === 0 ? (
                // Aucun livre sélectionné à l'étape 2
                <div className="text-center py-10 text-gray-400">
                  <p className="text-4xl mb-3">📭</p>
                  <p className="font-medium">Vous n'avez sélectionné aucun livre lu</p>
                  <p className="text-sm mt-1">Vous pourrez ajouter des favoris depuis votre bibliothèque</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4 max-h-96 overflow-y-auto pr-1">
                  {readBookItems.map((book) => {
                    const isFav = favouriteBooks.has(book.id);
                    return (
                      <button
                        key={book.id}
                        onClick={() => toggleFavourite(book.id)}
                        className={`relative rounded-xl overflow-hidden border-2 transition-all duration-200 text-left
                          ${isFav
                            ? "border-amber-400 shadow-md scale-105"
                            : "border-gray-200 hover:border-amber-200"
                          }`}
                      >
                        {book.cover_url ? (
                          <img src={book.cover_url} alt={book.title} className="w-full h-36 object-cover" />
                        ) : (
                          <div className="w-full h-36 bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center">
                            <span className="text-3xl">📖</span>
                          </div>
                        )}
                        {/* Badge favori ⭐ */}
                        {isFav && (
                          <div className="absolute top-2 right-2 text-xl drop-shadow-md">⭐</div>
                        )}
                        <div className="p-2">
                          <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-tight">{book.title}</p>
                          <p className="text-xs text-gray-400 truncate">{book.auteur}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* ===== BOUTONS DE NAVIGATION ===== */}
        <div className="px-8 pb-8 flex justify-between items-center">

          {/* Bouton "Précédent" (invisible à l'étape 1) */}
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="px-5 py-2.5 text-gray-500 text-sm font-medium border border-gray-200
                         rounded-full hover:bg-gray-50 transition-colors"
            >
              ← Précédent
            </button>
          ) : (
            <div /> // Espace vide pour aligner le bouton suivant à droite
          )}

          {/* Bouton "Suivant" ou "Terminer" */}
          {step < 3 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 1 && selectedGenres.length === 0}
              className={`px-6 py-2.5 text-white text-sm font-semibold rounded-full transition-all
                ${step === 1 && selectedGenres.length === 0
                  ? "bg-gray-300 cursor-not-allowed"                        // Désactivé à l'étape 1 si aucun genre
                  : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:shadow-lg hover:scale-105"
                }`}
            >
              Suivant →
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={isSaving}
              className="px-8 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white
                         text-sm font-semibold rounded-full hover:shadow-lg hover:scale-105
                         transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Enregistrement..." : "🎉 Terminer et accéder à BookTrack"}
            </button>
          )}
        </div>
      </div>

      {/* Lien "Passer" pour les utilisateurs qui veulent sauter l'onboarding */}
      <button
        onClick={handleFinish}
        className="mt-6 text-sm text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
      >
        Passer le quiz pour l'instant
      </button>
    </div>
  );
}
