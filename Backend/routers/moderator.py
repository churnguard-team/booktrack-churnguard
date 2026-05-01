# backend/routers/moderator.py

from fastapi import APIRouter
from ml_models.churn.xgboost_model import predict_churn, get_stats_for_dashboard

router = APIRouter(prefix="/api/moderator", tags=["moderator"])


@router.get("/churn/stats")
def get_churn_stats():
    return get_stats_for_dashboard()


@router.post("/churn/predict")
def predict_user_churn(user_features: dict):
    return predict_churn(user_features)