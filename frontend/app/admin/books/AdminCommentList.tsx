"use client";
// Composant client pour permettre à l'admin de supprimer un commentaire interactivement

import { useState } from "react";

// Type d'un commentaire reçu de l'API
type Comment = {
  id: string;
  user_id: string;
  auteur: string;
  contenu: string;
  created_at: string;
};

// Props : liste initiale des commentaires + identifiant du livre
type Props = {
  bookId: string;
  initialComments: Comment[];
};

export default function AdminCommentList({ bookId, initialComments }: Props) {
  // État local de la liste des commentaires (mis à jour après suppression)
  const [comments, setComments] = useState<Comment[]>(initialComments);

  // Identifiant du commentaire en cours de suppression (pour afficher un loader)
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // ─── Suppression d'un commentaire ────────────────────────────────────────
  const handleDelete = async (commentId: string) => {
    // Demande confirmation avant de supprimer définitivement
    if (!confirm("Supprimer ce commentaire définitivement ?")) return;

    setDeletingId(commentId); // Active le loader sur ce commentaire

    try {
      // Appel DELETE vers le backend : /books/{bookId}/comments/{commentId}
      const res = await fetch(`${API}/books/${bookId}/comments/${commentId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Erreur lors de la suppression");

      // Retire le commentaire supprimé de la liste affichée (sans rechargement)
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      alert("Impossible de supprimer ce commentaire. Réessayez.");
    } finally {
      setDeletingId(null); // Désactive le loader
    }
  };

  // ─── Affichage ──────────────────────────────────────────────────────────
  if (comments.length === 0) {
    return (
      <p style={{ color: "#9ca3af", textAlign: "center", padding: "2rem 0", fontSize: "0.9rem" }}>
        Aucun commentaire pour ce livre.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {comments.map((comment) => (
        <div
          key={comment.id}
          style={{
            backgroundColor: "#f9fafb",
            border: "1px solid #e9ecef",
            borderRadius: "0.75rem",
            padding: "1rem 1.25rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "1rem",
          }}
        >
          {/* Contenu du commentaire + infos auteur */}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
              {/* Avatar avec initiale de l'auteur */}
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  backgroundColor: "#4f46e5",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  flexShrink: 0,
                }}
              >
                {comment.auteur.charAt(0).toUpperCase()}
              </div>
              <div>
                {/* Nom de l'auteur du commentaire */}
                <p style={{ fontWeight: 600, fontSize: "0.88rem", color: "#1a1a2e", margin: 0 }}>
                  {comment.auteur}
                </p>
                {/* Date formatée en français */}
                <p style={{ fontSize: "0.75rem", color: "#9ca3af", margin: 0 }}>
                  {new Date(comment.created_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
            {/* Texte du commentaire */}
            <p style={{ fontSize: "0.9rem", color: "#4b5563", lineHeight: "1.6", margin: 0 }}>
              {comment.contenu}
            </p>
          </div>

          {/* Bouton de suppression réservé à l'admin */}
          <button
            onClick={() => handleDelete(comment.id)}
            disabled={deletingId === comment.id} // Désactivé pendant la suppression
            style={{
              backgroundColor: "#fee2e2",
              color: "#dc2626",
              border: "none",
              borderRadius: "0.5rem",
              padding: "0.45rem 0.85rem",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: deletingId === comment.id ? "not-allowed" : "pointer",
              opacity: deletingId === comment.id ? 0.6 : 1,
              whiteSpace: "nowrap",
              transition: "background-color 0.2s",
              flexShrink: 0,
            }}
          >
            {deletingId === comment.id ? "..." : "🗑️ Supprimer"}
          </button>
        </div>
      ))}
    </div>
  );
}
