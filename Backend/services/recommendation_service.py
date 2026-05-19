"""
Service de recommandation de livres.
Signaux utilises :
  - genres_preferes declares a l'onboarding
  - genres des livres lus/favoris (user_books)
  - notes donnees aux livres (user_books.note)
  - nombre de commentaires par livre (book_comments) -> popularite sociale
  - churn score existant (lecture seule) -> boost priorite
  - popularite globale (nb d'ajouts en bibliotheque)
"""

from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Dict, Any


def _get_churn_score(db: Session, user_id: str) -> float:
    """Lecture seule du dernier score churn - jamais modifie."""
    row = db.execute(text("""
        SELECT score FROM churn_scores
        WHERE user_id = :uid AND is_latest = true
        LIMIT 1
    """), {"uid": user_id}).fetchone()
    return float(row[0]) if row else 0.0


def _get_user_genres(db: Session, user_id: str) -> List[str]:
    """
    Genres preferes = union de :
    1. genres declares a l'onboarding (genres_preferes)
    2. genres des livres lus, en cours ou favoris
    3. genres des livres bien notes (note >= 4)
    """
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


def recommend_for_user(db: Session, user_id: str, n: int = 10) -> List[Dict[str, Any]]:
    """
    Recommandations personnalisees multi-signaux.

    Score final d'un livre =
        popularite (nb ajouts en bibliotheque)
      + note_moyenne * 2          (qualite percue)
      + nb_commentaires * 0.5     (engagement social)
      + churn_boost               (si utilisateur a risque > 0.6)
    """
    already_in_library = _get_user_book_ids(db, user_id)
    genres = _get_user_genres(db, user_id)
    churn_score = _get_churn_score(db, user_id)
    churn_boost = churn_score * 3 if churn_score > 0.6 else 0.0

    recommendations: List[Dict[str, Any]] = []

    # Etape 1 : livres des genres preferes
    if genres:
        excl = "AND b.id::text != ALL(:exclude)" if already_in_library else ""
        params: Dict[str, Any] = {"genres": genres, "n": n}
        if already_in_library:
            params["exclude"] = already_in_library

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
                COUNT(DISTINCT bc.id)          AS nb_commentaires
            FROM books b
            LEFT JOIN user_books ub  ON ub.book_id = b.id
            LEFT JOIN book_comments bc ON bc.book_id = b.id
            WHERE b.genre = ANY(:genres)
            {excl}
            GROUP BY b.id
            ORDER BY
                (COUNT(DISTINCT ub.id) + COALESCE(AVG(ub.note),0)*2 + COUNT(DISTINCT bc.id)*0.5) DESC,
                b.date_publication DESC
            LIMIT :n
        """), params).fetchall()

        for r in rows:
            score = float(r[7]) + float(r[8]) * 2 + float(r[9]) * 0.5 + churn_boost
            recommendations.append({
                "book_id": r[0], "title": r[1], "auteur": r[2],
                "genre": r[3], "cover_url": r[4], "nb_pages": r[5],
                "date_publication": str(r[6]) if r[6] else None,
                "score": round(score, 2),
                "nb_commentaires": int(r[9]),
                "note_moyenne": round(float(r[8]), 2) if r[8] else None,
                "reason": "genre_preference",
            })

    # Etape 2 : fallback livres populaires
    if len(recommendations) < n:
        existing_ids = [r["book_id"] for r in recommendations] + already_in_library
        params2: Dict[str, Any] = {"n": n - len(recommendations)}
        excl2 = ""
        if existing_ids:
            params2["exclude2"] = existing_ids
            excl2 = "AND b.id::text != ALL(:exclude2)"

        rows2 = db.execute(text(f"""
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
                COUNT(DISTINCT bc.id)          AS nb_commentaires
            FROM books b
            LEFT JOIN user_books ub  ON ub.book_id = b.id
            LEFT JOIN book_comments bc ON bc.book_id = b.id
            {excl2}
            GROUP BY b.id
            ORDER BY
                (COUNT(DISTINCT ub.id) + COALESCE(AVG(ub.note),0)*2 + COUNT(DISTINCT bc.id)*0.5) DESC
            LIMIT :n
        """), params2).fetchall()

        for r in rows2:
            score = float(r[7]) + float(r[8]) * 2 + float(r[9]) * 0.5
            recommendations.append({
                "book_id": r[0], "title": r[1], "auteur": r[2],
                "genre": r[3], "cover_url": r[4], "nb_pages": r[5],
                "date_publication": str(r[6]) if r[6] else None,
                "score": round(score, 2),
                "nb_commentaires": int(r[9]),
                "note_moyenne": round(float(r[8]), 2) if r[8] else None,
                "reason": "popular",
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
