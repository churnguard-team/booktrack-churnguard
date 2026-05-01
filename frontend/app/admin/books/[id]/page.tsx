// Page de détail d'un livre côté admin — Server Component (fetch côté serveur)
// URL : /admin/books/[id]
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import AdminCommentList from "@/app/admin/books/AdminCommentList";

// Type du livre récupéré depuis l'API
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

// Type d'un commentaire récupéré depuis l'API
type Comment = {
  id: string;
  user_id: string;
  auteur: string;
  contenu: string;
  created_at: string;
};

export default async function AdminBookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Récupère l'identifiant du livre depuis l'URL (ex: /admin/books/abc-123)
  const { id } = await params;

  const apiUrl = process.env.API_URL || "http://localhost:8000";

  // Appels en parallèle : récupère les infos du livre ET ses commentaires simultanément
  const [bookRes, commentsRes] = await Promise.all([
    fetch(`${apiUrl}/books/${id}`, { cache: "no-store" }),
    fetch(`${apiUrl}/books/${id}/comments`, { cache: "no-store" }),
  ]);

  // Si le livre n'existe pas, affiche un message d'erreur
  if (!bookRes.ok) {
    return <p style={{ padding: "2rem", color: "red" }}>Livre introuvable.</p>;
  }

  // Convertit les réponses JSON en objets TypeScript
  const book: BookDetail = await bookRes.json();
  const comments: Comment[] = commentsRes.ok ? await commentsRes.json() : [];

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
      <Navbar />

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem 1.5rem" }}>

        {/* Lien de retour vers la liste des livres admin */}
        <Link
          href="/admin/books"
          style={{ fontSize: "0.85rem", color: "#6b7280", display: "inline-block", marginBottom: "1.5rem" }}
        >
          ← Retour à la gestion des livres
        </Link>

        {/* ─── Carte principale : couverture + infos du livre ─── */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "1rem",
            border: "1px solid #f0f0f0",
            boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
            padding: "2rem",
            display: "flex",
            flexDirection: "row",
            gap: "2rem",
            flexWrap: "wrap",
            marginBottom: "2rem",
          }}
        >
          {/* Couverture du livre */}
          {book.cover_url ? (
            <img
              src={book.cover_url}
              alt={book.title}
              style={{
                width: "160px",
                height: "240px",
                objectFit: "cover",
                borderRadius: "0.75rem",
                boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                flexShrink: 0,
              }}
            />
          ) : (
            // Placeholder si pas de couverture
            <div
              style={{
                width: "160px",
                height: "240px",
                backgroundColor: "#e5e7eb",
                borderRadius: "0.75rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "3rem",
              }}
            >
              📖
            </div>
          )}

          {/* Informations textuelles du livre */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {/* Titre */}
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#1a1a2e", margin: 0 }}>
              {book.title}
            </h1>

            {/* Auteur */}
            <p style={{ fontSize: "1rem", color: "#6b7280", margin: 0 }}>{book.auteur}</p>

            {/* Badge genre */}
            {book.genre && (
              <span
                style={{
                  display: "inline-block",
                  backgroundColor: "#f3f4f6",
                  color: "#6b7280",
                  fontSize: "0.8rem",
                  padding: "0.25rem 0.75rem",
                  borderRadius: "9999px",
                  width: "fit-content",
                }}
              >
                {book.genre}
              </span>
            )}

            {/* Description du livre */}
            <p style={{ fontSize: "0.92rem", color: "#4b5563", lineHeight: "1.6", margin: 0 }}>
              {book.description}
            </p>

            {/* Métadonnées : pages, date, langue */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, auto)",
                gap: "0.5rem 1.5rem",
                fontSize: "0.85rem",
                color: "#9ca3af",
                marginTop: "0.5rem",
              }}
            >
              {book.nb_pages && (
                <p style={{ margin: 0 }}>
                  📄 <span style={{ color: "#374151", fontWeight: 500 }}>{book.nb_pages} pages</span>
                </p>
              )}
              {book.date_publication && (
                <p style={{ margin: 0 }}>
                  📅 <span style={{ color: "#374151", fontWeight: 500 }}>{book.date_publication}</span>
                </p>
              )}
              {book.langue && (
                <p style={{ margin: 0 }}>
                  🌍 <span style={{ color: "#374151", fontWeight: 500 }}>{book.langue}</span>
                </p>
              )}
            </div>

            {/* Bouton modifier le livre (lien vers la page d'édition existante) */}
            <div style={{ marginTop: "auto", paddingTop: "1rem" }}>
              <Link
                href={`/admin/books/${id}/edit`}
                style={{
                  display: "inline-block",
                  backgroundColor: "#1a1a2e",
                  color: "#fff",
                  padding: "0.55rem 1.2rem",
                  borderRadius: "0.5rem",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                ✏️ Modifier ce livre
              </Link>
            </div>
          </div>
        </div>

        {/* ─── Section de gestion des commentaires ─── */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "1rem",
            border: "1px solid #f0f0f0",
            boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
            padding: "2rem",
          }}
        >
          {/* En-tête avec le nombre de commentaires */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#1a1a2e", margin: 0 }}>
              💬 Commentaires
            </h2>
            {/* Badge avec le nombre total de commentaires */}
            <span
              style={{
                backgroundColor: "#f3f4f6",
                color: "#6b7280",
                fontSize: "0.8rem",
                fontWeight: 600,
                padding: "0.2rem 0.65rem",
                borderRadius: "9999px",
              }}
            >
              {comments.length} commentaire{comments.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Composant client qui gère la suppression interactive des commentaires */}
          <AdminCommentList bookId={id} initialComments={comments} />
        </div>

      </div>
    </main>
  );
}
