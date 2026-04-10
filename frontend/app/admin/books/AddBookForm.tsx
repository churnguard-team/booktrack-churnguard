"use client";

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

const initialFormState: BookFormState = {
  title: "",
  description: "",
  auteur: "",
  genre: "",
  cover_url: "",
  nb_pages: "",
  date_publication: "",
  langue: "",
};

export default function AddBookForm() {
  const router = useRouter();
  const [form, setForm] = useState<BookFormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
	  const payload: Record<string, string | number> = {
		title: form.title.trim(),
	  };

	  if (form.description.trim()) payload.description = form.description.trim();
	  if (form.auteur.trim()) payload.auteur = form.auteur.trim();
	  if (form.genre.trim()) payload.genre = form.genre.trim();
	  if (form.cover_url.trim()) payload.cover_url = form.cover_url.trim();
	  if (form.date_publication) payload.date_publication = form.date_publication;
	  if (form.langue.trim()) payload.langue = form.langue.trim();
	  if (form.nb_pages) payload.nb_pages = Number(form.nb_pages);

	  const res = await fetch(`${apiUrl}/books`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	  });

	  if (!res.ok) {
		throw new Error("Echec de la creation du livre");
	  }

	  setForm(initialFormState);
	  router.push("/admin/books");
	  router.refresh();
	} catch (err) {
	  setError(err instanceof Error ? err.message : "Une erreur est survenue");
	} finally {
	  setIsSubmitting(false);
	}
  };

  const handleChange = (field: keyof BookFormState, value: string) => {
	setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
	<form
	  onSubmit={handleSubmit}
	  style={{
		marginBottom: "2rem",
		display: "flex",
		flexDirection: "column",
		gap: "0.65rem",
		maxWidth: "520px",
	  }}
	>
	  <h2>Ajouter un livre</h2>
	  <input
		type="text"
		placeholder="Titre"
		value={form.title}
		onChange={(e) => handleChange("title", e.target.value)}
		style={{ padding: "0.5rem" }}
		required
	  />
	  <textarea
		placeholder="Description"
		value={form.description}
		onChange={(e) => handleChange("description", e.target.value)}
		style={{ padding: "0.5rem", minHeight: "90px", resize: "vertical" }}
	  />
	  <input
		type="text"
		placeholder="Auteur"
		value={form.auteur}
		onChange={(e) => handleChange("auteur", e.target.value)}
		style={{ padding: "0.5rem" }}
	  />
	  <input
		type="text"
		placeholder="Genre"
		value={form.genre}
		onChange={(e) => handleChange("genre", e.target.value)}
		style={{ padding: "0.5rem" }}
	  />
	  <input
		type="url"
		placeholder="URL de couverture"
		value={form.cover_url}
		onChange={(e) => handleChange("cover_url", e.target.value)}
		style={{ padding: "0.5rem" }}
	  />
	  <input
		type="number"
		min={1}
		placeholder="Nombre de pages"
		value={form.nb_pages}
		onChange={(e) => handleChange("nb_pages", e.target.value)}
		style={{ padding: "0.5rem" }}
	  />
	  <input
		type="date"
		value={form.date_publication}
		onChange={(e) => handleChange("date_publication", e.target.value)}
		style={{ padding: "0.5rem" }}
	  />
	  <input
		type="text"
		placeholder="Langue (ex: fr, en)"
		value={form.langue}
		onChange={(e) => handleChange("langue", e.target.value)}
		style={{ padding: "0.5rem" }}
	  />
	  <button
		type="submit"
		disabled={isSubmitting}
		style={{
		  padding: "0.65rem 0.9rem",
		  border: "1px solid #0f172a",
		  borderRadius: "8px",
		  backgroundColor: isSubmitting ? "#94a3b8" : "#0f172a",
		  color: "#fff",
		  fontWeight: 600,
		  cursor: isSubmitting ? "not-allowed" : "pointer",
		}}
	  >
		{isSubmitting ? "Ajout en cours..." : "Ajouter"}
	  </button>
	  {error && <p style={{ color: "red" }}>{error}</p>}
	</form>
  );
}

