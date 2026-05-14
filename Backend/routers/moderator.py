# backend/routers/moderator.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ml_models.churn import predict_churn, get_stats_for_dashboard
from database import get_db
from services.recommendation_service import (
    get_recommendation_stats,
    recommend_for_user,
    get_popular_books,
)

router = APIRouter(prefix="/api/moderator", tags=["moderator"])


@router.get("/churn/stats")
def get_churn_stats():
    """Stats du modèle ML XGBoost (métriques entraînement)."""
    return get_stats_for_dashboard()


@router.post("/churn/predict")
def predict_user_churn(user_features: dict):
    return predict_churn(user_features)


@router.get("/dashboard-summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    """
    Résumé complet pour le dashboard modérateur.
    Combine : stats recommandations + churn distribution BD + métriques modèle ML.
    """
    rec_stats = get_recommendation_stats(db)

    # Métriques du modèle ML (XGBoost/Random Forest)
    try:
        ml_stats = get_stats_for_dashboard()
    except Exception:
        ml_stats = {}

    return {**rec_stats, "ml_model": ml_stats}


@router.get("/model-status")
def get_model_status():
    """Statut des modèles ML pour le composant ModelStatus."""
    try:
        churn = get_stats_for_dashboard()
        metrics = churn.get("metrics", {})
        model_name = churn.get("model_name", "random_forest")
        trained = bool(metrics)
    except Exception:
        metrics = {}
        model_name = "random_forest"
        trained = False

    return {
        "churn_model": {
            "name": model_name,
            "status": "active" if trained else "unavailable",
            "trained": trained,
            "metrics": metrics,
            "last_update": "Voir saved_models/",
        },
        "recommendation_model": {
            "name": "content_based_hybrid",
            "status": "active",
            "trained": True,
            "description": "Genres + notes + commentaires + churn priority",
            "last_update": "Temps réel",
        },
        # Structure attendue par ModelStatus.tsx
        "churn_models": {
            "random_forest": {
                "trained": trained,
                "last_update": "Voir saved_models/",
                "metrics": metrics,
            },
            "xgboost": {
                "trained": trained,
                "last_update": "Voir saved_models/",
                "metrics": metrics,
            },
        },
        "recommendation": {
            "trained": True,
            "last_update": "Temps réel",
        },
    }


@router.get("/recommendations/user/{user_id}")
def get_user_recs_moderator(user_id: str, n: int = 10, db: Session = Depends(get_db)):
    """Recommandations pour un utilisateur spécifique (vue modérateur)."""
    return {"user_id": user_id, "recommendations": recommend_for_user(db, user_id, n)}


@router.get("/recommendations/popular")
def get_popular_moderator(n: int = 10, db: Session = Depends(get_db)):
    return {"books": get_popular_books(db, n)}
