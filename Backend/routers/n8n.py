"""
Endpoints dédiés à l8n workflow.
Appelés par les outils du chatbot et l'automatisation de rétention.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from services.recommendation_service import recommend_for_user, get_popular_books
from services.retention_service import (
    get_high_churn_users,
    trigger_retention_campaign,
    get_similar_books,
)

router = APIRouter(prefix="/api", tags=["n8n"])


# ── Schémas ───────────────────────────────────────────────────────────────────

class RecommendationRequest(BaseModel):
    user_id: str
    n: Optional[int] = 10
    # Champs optionnels envoyés par le chatbot n8n
    message: Optional[str] = None
    genre: Optional[str] = None


class SimilarBooksRequest(BaseModel):
    book_id: str
    n: Optional[int] = 5


class ExplainRequest(BaseModel):
    user_id: str
    book_id: str


class RetentionRequest(BaseModel):
    user_id: str
    discount_percent: Optional[int] = 20
    message: Optional[str] = None


class ChurnDataRequest(BaseModel):
    threshold: Optional[float] = 0.6


# ── Endpoints attendus par n8n ────────────────────────────────────────────────

@router.post("/recommendations")
def post_recommendations(req: RecommendationRequest, db: Session = Depends(get_db)):
    """
    Appelé par le chatbot n8n : Get Book Recommendations.
    Retourne les recommandations personnalisées de l'utilisateur.
    """
    try:
        recs = recommend_for_user(db, req.user_id, req.n or 10)

        # Filtre par genre si le chatbot a extrait un genre du message
        if req.genre:
            filtered = [r for r in recs if r.get("genre", "").lower() == req.genre.lower()]
            recs = filtered if filtered else recs

        return {"recommendations": recs, "user_id": req.user_id, "total": len(recs)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/similar-books")
def post_similar_books(req: SimilarBooksRequest, db: Session = Depends(get_db)):
    """Appelé par le chatbot n8n : Search Similar Books."""
    try:
        similar = get_similar_books(db, req.book_id, req.n or 5)
        return {"similar_books": similar, "book_id": req.book_id, "total": len(similar)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/explain-recommendation")
def post_explain_recommendation(req: ExplainRequest, db: Session = Depends(get_db)):
    """
    Appelé par le chatbot n8n : Explain Recommendation.
    Explique pourquoi un livre est recommandé à un utilisateur.
    """
    try:
        # Récupère les infos du livre
        from sqlalchemy import text
        book = db.execute(text("""
            SELECT b.title, b.auteur, b.genre, b.description,
                   COUNT(DISTINCT ub.id) AS nb_ajouts,
                   ROUND(AVG(ub.note), 2) AS note_moyenne,
                   COUNT(DISTINCT bc.id) AS nb_commentaires
            FROM books b
            LEFT JOIN user_books ub ON ub.book_id = b.id
            LEFT JOIN book_comments bc ON bc.book_id = b.id
            WHERE b.id = :bid
            GROUP BY b.id
        """), {"bid": req.book_id}).fetchone()

        if not book:
            raise HTTPException(status_code=404, detail="Livre non trouvé")

        # Récupère les genres préférés de l'utilisateur
        user = db.execute(text("""
            SELECT genres_preferes, nom, prenom FROM users WHERE id = :uid
        """), {"uid": req.user_id}).fetchone()

        genres_user = list(user[0]) if user and user[0] else []
        reasons = []

        if book[2] in genres_user:
            reasons.append(f"correspond à votre genre préféré : {book[2]}")
        if book[5] and float(book[5]) >= 4:
            reasons.append(f"très bien noté ({book[5]}/5)")
        if int(book[6]) > 0:
            reasons.append(f"{book[6]} commentaire(s) de lecteurs")
        if int(book[4]) > 1:
            reasons.append(f"ajouté par {book[4]} lecteurs")
        if not reasons:
            reasons.append("populaire sur la plateforme")

        return {
            "explanation": {
                "book_id": req.book_id,
                "title": book[0],
                "auteur": book[1],
                "genre": book[2],
                "reasons": reasons,
                "summary": f"'{book[0]}' vous est recommandé car il " + ", ".join(reasons) + ".",
                "stats": {
                    "nb_ajouts": int(book[4]),
                    "note_moyenne": float(book[5]) if book[5] else None,
                    "nb_commentaires": int(book[6]),
                },
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/retention/trigger")
def post_retention_trigger(req: RetentionRequest, db: Session = Depends(get_db)):
    """
    Appelé par n8n quand un utilisateur est détecté à haut risque churn.
    Crée une action de rétention (discount) dans la base.
    """
    try:
        result = trigger_retention_campaign(
            db, req.user_id, req.discount_percent or 20, req.message
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/churn-data")
def post_churn_data(req: ChurnDataRequest, db: Session = Depends(get_db)):
    """
    Appelé par n8n : Extract Churn Data.
    Retourne tous les utilisateurs au-dessus du seuil de risque.
    """
    try:
        users = get_high_churn_users(db, req.threshold or 0.6)
        return {
            "high_churn_users": users,
            "total": len(users),
            "threshold": req.threshold,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/trending-books")
def post_trending_books(db: Session = Depends(get_db)):
    """Appelé par n8n : Get Trending Books."""
    try:
        books = get_popular_books(db, n=10)
        return {"trending_books": books, "total": len(books)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/user-profile")
def post_user_profile(body: dict, db: Session = Depends(get_db)):
    """
    Appelé par n8n : Get User Profile.
    Retourne le profil complet d'un utilisateur pour le chatbot.
    """
    from sqlalchemy import text
    user_id = body.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id requis")
    try:
        row = db.execute(text("""
            SELECT u.id::text, u.nom, u.prenom, u.email,
                   u.genres_preferes, u.objectif_annuel,
                   cs.score, cs.niveau_risque,
                   COUNT(DISTINCT ub.id) AS nb_livres,
                   COUNT(DISTINCT ub.id) FILTER (WHERE ub.statut = 'READ') AS lus
            FROM users u
            LEFT JOIN churn_scores cs ON cs.user_id = u.id AND cs.is_latest = true
            LEFT JOIN user_books ub ON ub.user_id = u.id
            WHERE u.id = :uid
            GROUP BY u.id, cs.score, cs.niveau_risque
        """), {"uid": user_id}).fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

        return {
            "user_id": row[0],
            "nom": row[1],
            "prenom": row[2],
            "email": row[3],
            "genres_preferes": list(row[4]) if row[4] else [],
            "objectif_annuel": row[5],
            "churn_score": float(row[6]) if row[6] else None,
            "niveau_risque": row[7],
            "nb_livres_bibliotheque": int(row[8]),
            "nb_livres_lus": int(row[9]),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
