"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type BookFormState = {
  title: string;
  description: string;
  auteur: string;
  type: string;
  genre: string;
  cover_url: string;
  nb_pages: string;
  date_publication: string;
  langue: string;
};

type Props = {
  bookId: string;
  initialData: BookFormState;
};

const BOOK_TYPES = ["Roman", "Manga", "BD", "Essai", "Biographie"];

const GENRES_BY_TYPE: Record<string, { value: string; label: string }[]> = {
  Roman: [
    { value: "Thriller", label: "Thriller" },
    { value: "Science-Fiction", label: "Science-Fiction" },
    { value: "Policier", label: "Policier" },
    { value: "Fantastique", label: "Fantastique" },
    { value: "Romance", label: "Romance" },
    { value: "Historique", label: "Historique" },
    { value: "Philosophie", label: "Philosophie" },
  ],
  Manga: [
    { value: "Shounen", label: "Shounen" },
    { value: "Shojo", label: "Shojo" },
    { value: "Seinen", label: "Seinen" },
    { value: "Isekai", label: "Isekai" },
  ],
  BD: [
    { value: "Aventure", label: "Aventure" },
    { value: "Humour", label: "Humour" },
    { value: "Fantastique", label: "Fantastique" },
    { value: "Policier", label: "Policier" },
    { value: "Comics US", label: "Comics US" },
    { value: "Franco-Belge", label: "Franco-Belge" },
  ],
  Essai: [
    { value: "Voyage", label: "Voyage" },
    { value: "Développement personnel", label: "Développement personnel" },
    { value: "Sciences", label: "Sciences" },
    { value: "Politique", label: "Politique" },
  ],
  Biographie: [
    { value: "Biographie", label: "Biographie" },
  ],
};

export default function EditBookForm({ bookId, initialData }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<BookFormState>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const genreOptions = GENRES_BY_TYPE[form.type] ?? [];

  const handleChange = (field: keyof BookFormState, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "type" ? { genre: "" } : {}),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      setError("Le titre est requis.");
      return;
    }

    if (!form.type.trim()) {
      setError("Le type est requis.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const payload = {
        title: form.title.trim(),
        type: form.type.trim(),
        description: form.description.trim() || null,
        auteur: form.auteur.trim() || null,
        genre: form.genre.trim() || null,
        cover_url: form.cover_url.trim() || null,
        nb_pages: form.nb_pages ? Number(form.nb_pages) : null,
        date_publication: form.date_publication || null,
        langue: form.langue.trim() || null,
      };

      const res = await fetch(`${apiUrl}/books/${bookId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        const message = errorData?.detail || `Erreur serveur (${res.status})`;
        throw new Error(message);
      }

      setSuccess(true);

      setTimeout(() => {
        router.push("/admin/books");
        router.refresh();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-xl">
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm font-medium">
          Livre modifie avec succes ! Redirection en cours...
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Resume du livre..."
          rows={4}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-vertical
                     focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
          <select
            value={form.type}
            onChange={(e) => handleChange("type", e.target.value)}
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
          >
            <option value="" disabled>Selectionner un type</option>
            {BOOK_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
          <select
            value={form.genre}
            onChange={(e) => handleChange("genre", e.target.value)}
            disabled={!form.type || genreOptions.length === 0}
            required={genreOptions.length > 0}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
          >
            <option value="" disabled>Selectionner un genre</option>
            {genreOptions.map((genre) => (
              <option key={genre.value} value={genre.value}>{genre.label}</option>
            ))}
          </select>
        </div>
      </div>

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
        {form.cover_url && (
          <img
            src={form.cover_url}
            alt="Previsualisation"
            className="mt-2 h-32 w-auto rounded-lg border border-gray-200 object-cover"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        )}
      </div>

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

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting || success}
          className="flex-1 bg-gray-900 text-white text-sm font-semibold
                     py-2.5 rounded-lg hover:bg-gray-700 transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Enregistrement..." : "Enregistrer les modifications"}
        </button>

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
