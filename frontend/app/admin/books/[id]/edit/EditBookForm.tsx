"use client";
// ============================================================
// EditBookForm.tsx — Formulaire de modification d'un livre
// "use client" car on utilise useState, onChange, onSubmit
// Ce composant reçoit les données du livre en props (pré-remplissage)
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";

type BookFormState = {
  title: string;
  description: string;
  auteur: string;
  genre: string;
  cover_url: string;
  nb_pages: string;
  date_publication: string;
  langue: string;
};

// On reçoit le livre existant depuis le Server Component parent
type Props = {
  bookId: string;
  initialData: BookFormState;
};

export default function EditBookForm({ bookId, initialData }: Props) {
  const router = useRouter();

  // On initialise le formulaire avec les données existantes du livre
  const [form, setForm] = useState<BookFormState>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Met à jour un seul champ du formulaire sans toucher aux autres
  const handleChange = (field: keyof BookFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      setError("Le titre est requis.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      // On envoie TOUS les champs (PUT = remplacement complet)
      // Les champs vides sont envoyés comme null pour ne pas écraser avec ""
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        auteur: form.auteur.trim() || null,
        genre: form.genre.trim() || null,
        cover_url: form.cover_url.trim() || null,
        nb_pages: form.nb_pages ? Number(form.nb_pages) : null,
        date_publication: form.date_publication || null,
        langue: form.langue.trim() || null,
      };

      // PUT /books/{bookId} → mise à jour du livre
      const res = await fetch(`${apiUrl}/books/${bookId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // On lit le message d'erreur réel du serveur pour faciliter le débogage
        const errorData = await res.json().catch(() => null);
        const message = errorData?.detail || `Erreur serveur (${res.status})`;
        throw new Error(message);
      }

      setSuccess(true);

      // Retour vers la liste des livres après 1 seconde
      setTimeout(() => {
        router.push("/admin/books");
        router.refresh(); // Force Next.js à re-fetcher les données
      }, 1000);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-xl">

      {/* MESSAGE DE SUCCÈS */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm font-medium">
          ✅ Livre modifié avec succès ! Redirection en cours...
        </div>
      )}

      {/* MESSAGE D'ERREUR */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* CHAMP : Titre (obligatoire) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="Titre du livre"
          required
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
      </div>

      {/* CHAMP : Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Résumé du livre..."
          rows={4}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-vertical
                     focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
      </div>

      {/* LIGNE : Auteur + Genre côte à côte */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Auteur</label>
          <input
            type="text"
            value={form.auteur}
            onChange={(e) => handleChange("auteur", e.target.value)}
            placeholder="Nom de l'auteur"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
          <input
            type="text"
            value={form.genre}
            onChange={(e) => handleChange("genre", e.target.value)}
            placeholder="Roman, SF, Polar..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
      </div>

      {/* CHAMP : URL de couverture */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">URL de couverture</label>
        <input
          type="url"
          value={form.cover_url}
          onChange={(e) => handleChange("cover_url", e.target.value)}
          placeholder="https://..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        {/* Prévisualisation de la couverture si une URL est saisie */}
        {form.cover_url && (
          <img
            src={form.cover_url}
            alt="Prévisualisation"
            className="mt-2 h-32 w-auto rounded-lg border border-gray-200 object-cover"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        )}
      </div>

      {/* LIGNE : Nombre de pages + Date de publication + Langue */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pages</label>
          <input
            type="number"
            min={1}
            value={form.nb_pages}
            onChange={(e) => handleChange("nb_pages", e.target.value)}
            placeholder="300"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Publication</label>
          <input
            type="date"
            value={form.date_publication}
            onChange={(e) => handleChange("date_publication", e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Langue</label>
          <input
            type="text"
            value={form.langue}
            onChange={(e) => handleChange("langue", e.target.value)}
            placeholder="fr, en..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
      </div>

      {/* BOUTONS : Enregistrer + Annuler */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting || success}
          className="flex-1 bg-gray-900 text-white text-sm font-semibold
                     py-2.5 rounded-lg hover:bg-gray-700 transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Enregistrement..." : "💾 Enregistrer les modifications"}
        </button>

        {/* Annuler → retour à la liste sans sauvegarder */}
        <button
          type="button"
          onClick={() => router.push("/admin/books")}
          className="px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium
                     rounded-lg hover:bg-gray-50 transition-colors"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
