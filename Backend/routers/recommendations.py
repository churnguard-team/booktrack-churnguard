from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from services.recommendation_service import (
    recommend_for_user,
    get_popular_books,
    get_recommendation_stats,
)
import uuid

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])


@router.get("/user/{user_id}")
def get_user_recommendations(user_id: str, n: int = 10, db: Session = Depends(get_db)):
    """Recommandations personnalisees pour un utilisateur."""
    try:
        return {"user_id": user_id, "recommendations": recommend_for_user(db, user_id, n)}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/track-view")
def track_book_view(payload: dict, db: Session = Depends(get_db)):
    """Enregistre la consultation d'un livre par un utilisateur."""
    user_id = payload.get("user_id")
    book_id = payload.get("book_id")
    if not user_id or not book_id:
        raise HTTPException(status_code=400, detail="user_id et book_id requis")
    try:
        db.execute(text("""
            INSERT INTO user_events (user_id, event_type, book_id, occurred_at)
            VALUES (:uid, 'BOOK_VIEW', :bid, NOW())
        """), {"uid": uuid.UUID(user_id), "bid": uuid.UUID(book_id)})
        db.commit()
    except Exception:
        db.rollback()
    return {"ok": True}


@router.get("/popular")
def get_popular(n: int = 10, db: Session = Depends(get_db)):
    """Livres les plus populaires de la plateforme."""
    return {"books": get_popular_books(db, n)}


@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    """Statistiques de recommandations pour le dashboard moderateur."""
    try:
        return get_recommendation_stats(db)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
