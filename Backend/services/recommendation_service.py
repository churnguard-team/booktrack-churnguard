"""
Service de recommandation de livres.
Signaux utilises :
  - genres_preferes declares a l'onboarding
  - genres des livres lus/favoris/notes (user_books)
  - commentaires ecrits par l'utilisateur -> TF-IDF sur le contenu
  - livres consultes (book_views) -> signal d'interet implicite
  - churn score existant (lecture seule) -> boost priorite
  - popularite globale (nb ajouts + notes + commentaires)
"""

from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Dict, Any

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    import numpy as np
    _SKLEARN_AVAILABLE = True
except ImportError:
    _SKLEARN_AVAILABLE = False


def _get_churn_score(db: Session, user_id: str) -> float:
    row = db.execute(text("""
        SELECT score FROM churn_scores
        WHERE user_id = :uid AND is_latest = true
        LIMIT 1
    """), {"uid": user_id}).fetchone()
    return float(row[0]) if row else 0.0


def _get_user_genres(db: Session, user_id: str) -> List[str]:
    row = db.execute(text(
        "SELECT genres_preferes FROM users WHERE id = :uid"
    ), {"uid": user_id}).fetchone()
    declared = list(row[0]) if row and row[0] else []

    rows = db.execute(text("""
        SELECT DISTINCT b.genre FROM user_books ub
        JOIN books b ON b.id = ub.book_id
        WHERE ub.user_id = :uid
          AND (
            ub.statut IN ('READ', 'READING')
            OR ub.is_favourite = true
            OR ub.note >= 4
          )
          AND b.genre IS NOT NULL
    """), {"uid": user_id}).fetchall()

    interaction_genres = [r[0] for r in rows]
    return list(dict.fromkeys(declared + interaction_genres))


def _get_user_book_ids(db: Session, user_id: str) -> List[str]:
    rows = db.execute(text(
        "SELECT book_id::text FROM user_books WHERE user_id = :uid"
    ), {"uid": user_id}).fetchall()
    return [r[0] for r in rows]


def _get_user_comment_text(db: Session, user_id: str) -> str:
    """Concatene tous les commentaires ecrits par l'utilisateur."""
    rows = db.execute(text("""
        SELECT bc.contenu FROM book_comments bc
        WHERE bc.user_id = :uid
        ORDER BY bc.created_at DESC
        LIMIT 50
    """), {"uid": user_id}).fetchall()
    return " ".join(r[0] for r in rows if r[0])


def _get_viewed_book_ids(db: Session, user_id: str) -> List[str]:
    """Livres consultes par l'utilisateur via user_events."""
    try:
        rows = db.execute(text("""
            SELECT DISTINCT book_id::text FROM user_events
            WHERE user_id = :uid AND event_type = 'BOOK_VIEW' AND book_id IS NOT NULL
            ORDER BY book_id
            LIMIT 30
        """), {"uid": user_id}).fetchall()
        return [r[0] for r in rows]
    except Exception:
        return []


def _tfidf_scores(user_text: str, book_rows: list) -> Dict[str, float]:
    """
    Calcule la similarite cosinus entre le texte de l'utilisateur
    (ses commentaires) et la description+titre de chaque livre.
    Retourne un dict {book_id: score}.
    """
    if not _SKLEARN_AVAILABLE or not user_text.strip():
        return {}

    book_texts = [f"{r[1]} {r[2]} {r[3] or ''} {r[10] or ''}" for r in book_rows]
    corpus = [user_text] + book_texts

    try:
        vec = TfidfVectorizer(max_features=500, stop_words=None)
        tfidf = vec.fit_transform(corpus)
        sims = cosine_similarity(tfidf[0:1], tfidf[1:]).flatten()
        return {book_rows[i][0]: float(sims[i]) for i in range(len(book_rows))}
    except Exception:
        return {}


def recommend_for_user(db: Session, user_id: str, n: int = 10) -> List[Dict[str, Any]]:
    """
    Recommandations personnalisees multi-signaux.

    Score final =
        popularite (nb ajouts)
      + note_moyenne * 2
      + nb_commentaires * 0.5
      + tfidf_similarity * 5      (contenu des commentaires utilisateur)
      + view_boost * 1.5          (livres similaires a ceux consultes)
      + churn_boost               (si risque > 0.6)
    """
    already_in_library = _get_user_book_ids(db, user_id)
    viewed_ids = _get_viewed_book_ids(db, user_id)
    genres = _get_user_genres(db, user_id)
    user_comment_text = _get_user_comment_text(db, user_id)
    churn_score = _get_churn_score(db, user_id)
    churn_boost = churn_score * 3 if churn_score > 0.6 else 0.0

    # Livres a exclure (deja en bibliotheque)
    exclude_ids = already_in_library

    excl = "AND b.id::text != ALL(:exclude)" if exclude_ids else ""
    params: Dict[str, Any] = {"n": n * 3}  # fetch more for re-ranking
    if exclude_ids:
        params["exclude"] = exclude_ids

    # Filtre genre si disponible
    genre_filter = ""
    if genres:
        params["genres"] = genres
        genre_filter = "WHERE b.genre = ANY(:genres)"

    rows = db.execute(text(f"""
        SELECT
            b.id::text,
            b.title,
            b.auteur,
            b.genre,
            b.cover_url,
            b.nb_pages,
            b.date_publication,
            COUNT(DISTINCT ub.id)          AS nb_ajouts,
            COALESCE(AVG(ub.note), 0)      AS note_moyenne,
            COUNT(DISTINCT bc.id)          AS nb_commentaires,
            b.description
        FROM books b
        LEFT JOIN user_books ub  ON ub.book_id = b.id
        LEFT JOIN book_comments bc ON bc.book_id = b.id
        {genre_filter}
        {excl}
        GROUP BY b.id
        ORDER BY
            (COUNT(DISTINCT ub.id) + COALESCE(AVG(ub.note),0)*2 + COUNT(DISTINCT bc.id)*0.5) DESC
        LIMIT :n
    """), params).fetchall()

    # Fallback: si pas assez de livres avec filtre genre, on prend les populaires
    if len(rows) < n:
        existing = [r[0] for r in rows] + exclude_ids
        params2: Dict[str, Any] = {"n": n * 3, "exclude2": existing} if existing else {"n": n * 3}
        excl2 = "AND b.id::text != ALL(:exclude2)" if existing else ""
        extra = db.execute(text(f"""
            SELECT
                b.id::text, b.title, b.auteur, b.genre, b.cover_url,
                b.nb_pages, b.date_publication,
                COUNT(DISTINCT ub.id), COALESCE(AVG(ub.note), 0),
                COUNT(DISTINCT bc.id), b.description
            FROM books b
            LEFT JOIN user_books ub ON ub.book_id = b.id
            LEFT JOIN book_comments bc ON bc.book_id = b.id
            {excl2}
            GROUP BY b.id
            ORDER BY (COUNT(DISTINCT ub.id) + COALESCE(AVG(ub.note),0)*2 + COUNT(DISTINCT bc.id)*0.5) DESC
            LIMIT :n
        """), params2).fetchall()
        rows = list(rows) + list(extra)

    # TF-IDF sur les commentaires utilisateur
    tfidf_map = _tfidf_scores(user_comment_text, rows)

    viewed_set = set(viewed_ids)

    recommendations: List[Dict[str, Any]] = []
    seen = set()
    for r in rows:
        book_id = r[0]
        if book_id in seen:
            continue
        seen.add(book_id)

        pop = float(r[7])
        avg_note = float(r[8])
        nb_comments = float(r[9])
        tfidf_sim = tfidf_map.get(book_id, 0.0)
        view_boost = 1.5 if book_id in viewed_set else 0.0

        score = pop + avg_note * 2 + nb_comments * 0.5 + tfidf_sim * 5 + view_boost + churn_boost

        # Determine reason
        if tfidf_sim > 0.05:
            reason = "based_on_comments"
        elif book_id in viewed_set:
            reason = "recently_viewed"
        elif r[3] and genres and r[3] in genres:
            reason = "genre_preference"
        else:
            reason = "popular"

        recommendations.append({
            "book_id": book_id, "title": r[1], "auteur": r[2],
            "genre": r[3], "cover_url": r[4], "nb_pages": r[5],
            "date_publication": str(r[6]) if r[6] else None,
            "score": round(score, 2),
            "nb_commentaires": int(nb_comments),
            "note_moyenne": round(avg_note, 2) if avg_note else None,
            "reason": reason,
        })

    recommendations.sort(key=lambda x: x["score"], reverse=True)
    return recommendations[:n]


def get_popular_books(db: Session, n: int = 10) -> List[Dict[str, Any]]:
    """Livres les plus populaires : ajouts + notes + commentaires."""
    rows = db.execute(text("""
        SELECT
            b.id::text, b.title, b.auteur, b.genre, b.cover_url,
            COUNT(DISTINCT ub.id)          AS nb_ajouts,
            ROUND(AVG(ub.note), 2)         AS note_moyenne,
            COUNT(DISTINCT bc.id)          AS nb_commentaires
        FROM books b
        LEFT JOIN user_books ub  ON ub.book_id = b.id
        LEFT JOIN book_comments bc ON bc.book_id = b.id
        GROUP BY b.id
        ORDER BY
            (COUNT(DISTINCT ub.id) + COALESCE(AVG(ub.note),0)*2 + COUNT(DISTINCT bc.id)*0.5) DESC
        LIMIT :n
    """), {"n": n}).fetchall()

    return [
        {
            "book_id": r[0], "title": r[1], "auteur": r[2],
            "genre": r[3], "cover_url": r[4],
            "nb_ajouts": int(r[5]),
            "note_moyenne": float(r[6]) if r[6] else None,
            "nb_commentaires": int(r[7]),
        }
        for r in rows
    ]


def get_recommendation_stats(db: Session) -> Dict[str, Any]:
    """Statistiques completes pour le dashboard moderateur."""
    total_users = db.execute(text("SELECT COUNT(*) FROM users")).scalar() or 0
    total_books = db.execute(text("SELECT COUNT(*) FROM books")).scalar() or 0
    users_with_books = db.execute(text(
        "SELECT COUNT(DISTINCT user_id) FROM user_books"
    )).scalar() or 0
    total_comments = db.execute(text("SELECT COUNT(*) FROM book_comments")).scalar() or 0

    coverage = round(users_with_books / total_users * 100, 1) if total_users > 0 else 0.0

    genre_rows = db.execute(text("""
        SELECT b.genre, COUNT(ub.id) AS total
        FROM user_books ub
        JOIN books b ON b.id = ub.book_id
        WHERE b.genre IS NOT NULL
        GROUP BY b.genre
        ORDER BY total DESC
        LIMIT 5
    """
    )).fetchall()

    at_risk_rows = db.execute(text("""
        SELECT u.id::text, u.nom, u.prenom, u.email,
               cs.score, cs.niveau_risque,
               u.genres_preferes
        FROM users u
        JOIN churn_scores cs ON cs.user_id = u.id AND cs.is_latest = true
        WHERE cs.niveau_risque IN ('HIGH', 'CRITICAL')
        ORDER BY cs.score DESC
        LIMIT 10
    """)).fetchall()

    at_risk_users = [
        {
            "id": r[0],
            "name": f"{r[2]} {r[1]}",
            "email": r[3],
            "churn_risk": round(float(r[4]) * 100, 1),
            "niveau_risque": r[5],
            "genres_preferes": list(r[6]) if r[6] else [],
        }
        for r in at_risk_rows
    ]

    churn_dist_rows = db.execute(text("""
        SELECT niveau_risque, COUNT(*) as total
        FROM churn_scores
        WHERE is_latest = true
        GROUP BY niveau_risque
    """)).fetchall()
    churn_distribution = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
    for row in churn_dist_rows:
        churn_distribution[row[0]] = row[1]

    total_scored = sum(churn_distribution.values())
    churn_rate = round(
        (churn_distribution["HIGH"] + churn_distribution["CRITICAL"]) / total_scored * 100, 1
    ) if total_scored > 0 else 0.0

    return {
        "recommendations": {
            "total_recommendations": users_with_books * 10,
            "coverage": coverage,
            "users_with_books": users_with_books,
            "total_books": total_books,
            "total_comments": total_comments,
        },
        "top_genres": [{"genre": r[0], "total": r[1]} for r in genre_rows],
        "top_at_risk_users": at_risk_users,
        "total_at_risk": len(at_risk_users),
        "churn_distribution": churn_distribution,
        "churn_rate_percent": churn_rate,
        "total_scored_users": total_scored,
    }
