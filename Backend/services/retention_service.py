"""
Service de retention.
Gere la detection des utilisateurs a risque churn et l'envoi de campagnes discount.
Ne modifie pas les modeles ML existants.
"""

from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Dict, Any
import uuid


def get_high_churn_users(db: Session, threshold: float = 0.6) -> List[Dict[str, Any]]:
    """Retourne les utilisateurs dont le churn score depasse le seuil."""
    rows = db.execute(text("""
        SELECT u.id::text, u.nom, u.prenom, u.email,
               cs.score, cs.niveau_risque,
               u.genres_preferes,
               s.type as abonnement
        FROM users u
        JOIN churn_scores cs ON cs.user_id = u.id AND cs.is_latest = true
        LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status = 'ACTIVE'
        WHERE cs.score >= :threshold
        ORDER BY cs.score DESC
    """), {"threshold": threshold}).fetchall()

    return [
        {
            "user_id": r[0],
            "nom": r[1],
            "prenom": r[2],
            "email": r[3],
            "churn_score": float(r[4]),
            "niveau_risque": r[5],
            "genres_preferes": list(r[6]) if r[6] else [],
            "abonnement": r[7] or "FREE",
        }
        for r in rows
    ]


def trigger_retention_campaign(
    db: Session,
    user_id: str,
    discount_percent: int = 20,
    message: str = None,
) -> Dict[str, Any]:
    """
    Enregistre une action de retention (discount) pour un utilisateur a risque.
    Retourne le statut de l'action creee.
    """
    row = db.execute(text("""
        SELECT u.email, u.nom, u.prenom, cs.score, cs.niveau_risque
        FROM users u
        JOIN churn_scores cs ON cs.user_id = u.id AND cs.is_latest = true
        WHERE u.id = :uid
    """), {"uid": user_id}).fetchone()

    if not row:
        return {"status": "error", "detail": "Utilisateur non trouve ou sans score churn"}

    email, nom, prenom, score, niveau = row

    contenu = message or (
        f"Offre exclusive : -{discount_percent}% sur votre abonnement BookTrack ! "
        f"Valable 7 jours. Code : STAY{discount_percent}"
    )

    db.execute(text("""
        INSERT INTO retention_actions
            (id, user_id, type_action, statut, contenu, sujet, created_at)
        VALUES
            (:id, :uid, 'DISCOUNT_OFFER', 'PENDING', :contenu, :sujet, NOW())
    """), {
        "id": str(uuid.uuid4()),
        "uid": user_id,
        "contenu": contenu,
        "sujet": f"Une offre speciale pour vous, {prenom} !",
    })
    db.commit()

    return {
        "status": "triggered",
        "user_id": user_id,
        "email": email,
        "nom": f"{prenom} {nom}",
        "churn_score": float(score),
        "niveau_risque": niveau,
        "discount_percent": discount_percent,
        "message": contenu,
    }


def get_similar_books(db: Session, book_id: str, n: int = 5) -> List[Dict[str, Any]]:
    """Livres similaires bases sur le meme genre + auteur."""
    book = db.execute(text("""
        SELECT genre, auteur FROM books WHERE id = :bid
    """), {"bid": book_id}).fetchone()

    if not book:
        return []

    genre, auteur = book

    rows = db.execute(text("""
        SELECT
            b.id::text, b.title, b.auteur, b.genre, b.cover_url,
            b.nb_pages, b.date_publication,
            COUNT(DISTINCT ub.id)     AS nb_ajouts,
            ROUND(AVG(ub.note), 2)    AS note_moyenne,
            COUNT(DISTINCT bc.id)     AS nb_commentaires,
            CASE
                WHEN b.auteur = :auteur AND b.genre = :genre THEN 3
                WHEN b.auteur = :auteur THEN 2
                WHEN b.genre  = :genre  THEN 1
                ELSE 0
            END AS similarity_score
        FROM books b
        LEFT JOIN user_books ub  ON ub.book_id = b.id
        LEFT JOIN book_comments bc ON bc.book_id = b.id
        WHERE b.id::text != :bid
          AND (b.genre = :genre OR b.auteur = :auteur)
        GROUP BY b.id, similarity_score
        ORDER BY similarity_score DESC, nb_ajouts DESC
        LIMIT :n
    """), {"bid": book_id, "genre": genre, "auteur": auteur, "n": n}).fetchall()

    return [
        {
            "book_id": r[0], "title": r[1], "auteur": r[2],
            "genre": r[3], "cover_url": r[4], "nb_pages": r[5],
            "date_publication": str(r[6]) if r[6] else None,
            "nb_ajouts": int(r[7]),
            "note_moyenne": float(r[8]) if r[8] else None,
            "nb_commentaires": int(r[9]),
            "similarity": "same_author_genre" if r[10] == 3
                          else "same_author" if r[10] == 2
                          else "same_genre",
        }
        for r in rows
    ]
