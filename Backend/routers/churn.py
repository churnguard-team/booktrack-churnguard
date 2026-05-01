# backend/routers/churn.py

from fastapi import APIRouter
from ml_models.churn.xgboost_model import (
    predict_churn,
    get_stats_for_dashboard
)

router = APIRouter(prefix="/api/churn", tags=["churn"])


@router.get("/stats")
def get_churn_stats():
    """
    Endpoint appele par ChurnSection.tsx dans le dashboard moderateur.
    Retourne les metriques du modele et la comparaison des 3 modeles.
    """
    return get_stats_for_dashboard()


@router.post("/predict")
def predict_user_churn(user_features: dict):
    """
    Predit le churn pour un user specifique.
    """
    return predict_churn(user_features)