from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from services.recommendation_service import (
    recommend_for_user,
    get_popular_books,
    get_recommendation_stats,
)

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])


@router.get("/user/{user_id}")
def get_user_recommendations(user_id: str, n: int = 10, db: Session = Depends(get_db)):
    """Recommandations personnalisées pour un utilisateur (tient compte du churn score)."""
    try:
        return {"user_id": user_id, "recommendations": recommend_for_user(db, user_id, n)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/popular")
def get_popular(n: int = 10, db: Session = Depends(get_db)):
    """Livres les plus populaires de la plateforme."""
    return {"books": get_popular_books(db, n)}


@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    """Statistiques de recommandations pour le dashboard modérateur."""
    try:
        return get_recommendation_stats(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
