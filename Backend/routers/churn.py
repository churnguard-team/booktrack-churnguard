from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from ml_models.churn import predict_churn, get_stats_for_dashboard
from services.churn_service import run_daily_churn_scoring

router = APIRouter(prefix="/api/churn", tags=["churn"])


@router.get("/stats")
def get_churn_stats():
    """Retourne les metriques du modele et la comparaison des modeles."""
    return get_stats_for_dashboard()


@router.post("/predict")
def predict_user_churn(user_features: dict):
    """Predit le churn pour un utilisateur specifique."""
    return predict_churn(user_features)


@router.post("/run")
def run_churn_detection(db: Session = Depends(get_db)):
    """Exécute une détection de churn manuelle et met à jour les scores en base."""
    return run_daily_churn_scoring(db)
