from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ml_models.churn import predict_churn, get_stats_for_dashboard
from database import get_db
from services.churn_service import get_churn_history, get_high_risk_users
from services.recommendation_service import (
    get_recommendation_stats,
    recommend_for_user,
    get_popular_books,
)

router = APIRouter(prefix="/api/moderator", tags=["moderator"])


@router.get("/churn/stats")
def get_churn_stats():
    """Stats du modele ML (metriques entrainement)."""
    return get_stats_for_dashboard()


@router.post("/churn/predict")
def predict_user_churn(user_features: dict):
    return predict_churn(user_features)


@router.get("/churn/history")
def get_churn_history_endpoint(db: Session = Depends(get_db), days: int = 30):
    return get_churn_history(db, days)


@router.get("/churn/high-risk")
def get_high_risk_users_endpoint(db: Session = Depends(get_db), limit: int = 10):
    return get_high_risk_users(db, limit)


@router.get("/dashboard-summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    """
    Resume complet pour le dashboard moderateur.
    Combine : stats recommandations + churn distribution BD + metriques ML.
    """
    rec_stats = get_recommendation_stats(db)

    try:
        ml_stats = get_stats_for_dashboard()
    except Exception:
        ml_stats = {}

    return {**rec_stats, "ml_model": ml_stats}


@router.get("/model-status")
def get_model_status():
    """Statut des modeles ML pour le composant ModelStatus."""
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
            "last_update": "Temps reel",
        },
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
            "last_update": "Temps reel",
        },
    }


@router.get("/recommendations/user/{user_id}")
def get_user_recs_moderator(user_id: str, n: int = 10, db: Session = Depends(get_db)):
    """Recommandations pour un utilisateur specifique (vue moderateur)."""
    return {"user_id": user_id, "recommendations": recommend_for_user(db, user_id, n)}


@router.get("/recommendations/popular")
def get_popular_moderator(n: int = 10, db: Session = Depends(get_db)):
    return {"books": get_popular_books(db, n)}
