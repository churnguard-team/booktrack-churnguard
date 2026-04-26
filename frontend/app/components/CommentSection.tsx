"use client";
// Ce composant est côté client car il utilise useState, useEffect et les interactions utilisateur

import { useState, useEffect } from "react";

// Type qui représente un commentaire tel qu'il est renvoyé par l'API
type Comment = {
  id: string;
  user_id: string;
  auteur: string;       // Prénom + Nom de l'utilisateur
  contenu: string;
  created_at: string;   // Date ISO renvoyée par le backend
};

// Props du composant : on lui passe uniquement l'identifiant du livre
type Props = {
  bookId: string;
};

export default function CommentSection({ bookId }: Props) {
  // Liste des commentaires affichés
  const [comments, setComments] = useState<Comment[]>([]);

  // Texte en cours de saisie dans le formulaire
  const [newComment, setNewComment] = useState("");

  // État de chargement pour afficher un spinner le temps de charger les commentaires
  const [loading, setLoading] = useState(true);

  // Erreur éventuelle à afficher à l'utilisateur
  const [error, setError] = useState("");

  // Indique si le formulaire est en train d'envoyer une requête
  const [submitting, setSubmitting] = useState(false);

  // URL de base de l'API backend
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // ─── Chargement des commentaires au montage du composant ───────────────────
  useEffect(() => {
    const fetchComments = async () => {
      try {
        // Appel GET pour récupérer les commentaires du livre
        const res = await fetch(`${API}/books/${bookId}/comments`);
        if (!res.ok) throw new Error("Erreur lors du chargement des commentaires");
        const data: Comment[] = await res.json();
        setComments(data);
      } catch {
        setError("Impossible de charger les commentaires.");
      } finally {
        setLoading(false); // On arrête le spinner dans tous les cas
      }
    };

    fetchComments();
  }, [bookId]); // Relance si bookId change

  // ─── Soumission d'un nouveau commentaire ──────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Empêche le rechargement de la page

    // Lit le cookie "user_session" sauvegardé lors de la connexion (voir login/page.tsx)
    // Le cookie contient un JSON encodé avec user_id, role, email, etc.
    const sessionCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("user_session="));

    // Décode la valeur du cookie pour extraire les données de session (gère le double-encodage éventuel)
    let session = null;
    if (sessionCookie) {
      let val = sessionCookie.split("=")[1];
      while (val.startsWith("%")) {
        val = decodeURIComponent(val);
      }
      try {
        session = JSON.parse(val);
      } catch (e) {
        console.error("Erreur parsing cookie session:", e);
      }
    }

    // Si aucune session n'est trouvée, l'utilisateur n'est pas connecté
    const userId = session?.user_id;
    if (!userId) {
      setError("Vous devez être connecté pour commenter.");
      return;
    }

    // Vérifie que le commentaire n'est pas vide
    if (!newComment.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      // Appel POST pour envoyer le commentaire au backend
      const res = await fetch(`${API}/books/${bookId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          contenu: newComment.trim(),
        }),
      });

      if (!res.ok) throw new Error("Erreur lors de l'envoi du commentaire");

      // Le backend renvoie le commentaire créé avec le nom de l'auteur
      const created: Comment = await res.json();

      // Ajoute le nouveau commentaire en tête de liste (plus récent en premier)
      setComments((prev) => [created, ...prev]);

      // Vide le champ de saisie après soumission
      setNewComment("");
    } catch {
      setError("Impossible d'envoyer le commentaire. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Affichage du composant ───────────────────────────────────────────────
  return (
    <section style={styles.section}>
      {/* Titre de la section */}
      <h2 style={styles.title}>💬 Commentaires</h2>

      {/* Formulaire d'ajout d'un commentaire */}
      <form onSubmit={handleSubmit} style={styles.form}>
        <textarea
          id="comment-input"
          placeholder="Partagez votre avis sur ce livre..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={3}
          style={styles.textarea}
          disabled={submitting} // Désactive pendant l'envoi
        />
        {/* Message d'erreur affiché si quelque chose tourne mal */}
        {error && <p style={styles.error}>{error}</p>}

        <button
          type="submit"
          disabled={submitting || !newComment.trim()} // Désactive si vide ou en cours d'envoi
          style={{
            ...styles.button,
            opacity: submitting || !newComment.trim() ? 0.5 : 1,
          }}
        >
          {submitting ? "Envoi..." : "Publier le commentaire"}
        </button>
      </form>

      {/* Liste des commentaires ou message d'état */}
      <div style={styles.list}>
        {loading ? (
          // Affiche un message pendant le chargement
          <p style={styles.emptyText}>Chargement des commentaires...</p>
        ) : comments.length === 0 ? (
          // Aucun commentaire pour ce livre
          <p style={styles.emptyText}>Aucun commentaire pour l&apos;instant. Soyez le premier !</p>
        ) : (
          // Affiche chaque commentaire dans une carte
          comments.map((comment) => (
            <div key={comment.id} style={styles.card}>
              {/* En-tête de la carte : nom de l'auteur + date */}
              <div style={styles.cardHeader}>
                {/* Avatar avec la première lettre du nom */}
                <div style={styles.avatar}>
                  {comment.auteur.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={styles.authorName}>{comment.auteur}</p>
                  {/* Formatage de la date en français */}
                  <p style={styles.date}>
                    {new Date(comment.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              {/* Corps du commentaire */}
              <p style={styles.content}>{comment.contenu}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

// ─── Styles inline (CSS-in-JS léger) ─────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  section: {
    marginTop: "2.5rem",
    padding: "2rem",
    backgroundColor: "#ffffff",
    borderRadius: "1rem",
    boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
    border: "1px solid #f0f0f0",
  },
  title: {
    fontSize: "1.4rem",
    fontWeight: 700,
    color: "#1a1a2e",
    marginBottom: "1.25rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    marginBottom: "2rem",
  },
  textarea: {
    width: "100%",
    padding: "0.85rem 1rem",
    borderRadius: "0.6rem",
    border: "1.5px solid #e2e8f0",
    fontSize: "0.95rem",
    color: "#333",
    resize: "vertical",
    fontFamily: "inherit",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  },
  button: {
    alignSelf: "flex-end",
    backgroundColor: "#4f46e5",   // Violet indigo, cohérent avec le design BookTrack
    color: "#ffffff",
    border: "none",
    borderRadius: "0.5rem",
    padding: "0.65rem 1.4rem",
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background-color 0.2s, opacity 0.2s",
  },
  error: {
    color: "#e53e3e",
    fontSize: "0.85rem",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  card: {
    backgroundColor: "#f9fafb",
    borderRadius: "0.75rem",
    padding: "1rem 1.25rem",
    border: "1px solid #e9ecef",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    marginBottom: "0.6rem",
  },
  avatar: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    backgroundColor: "#4f46e5",   // Même couleur que le bouton pour la cohérence visuelle
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "1rem",
    flexShrink: 0,
  },
  authorName: {
    fontWeight: 600,
    fontSize: "0.9rem",
    color: "#1a1a2e",
    margin: 0,
  },
  date: {
    fontSize: "0.78rem",
    color: "#9ca3af",
    margin: 0,
  },
  content: {
    fontSize: "0.92rem",
    color: "#4b5563",
    lineHeight: "1.6",
    margin: 0,
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: "0.9rem",
    textAlign: "center",
    padding: "1.5rem 0",
  },
};
