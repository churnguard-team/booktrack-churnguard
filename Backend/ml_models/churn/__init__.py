from typing import Any, Dict

from ..inference import ChurnPredictor

_PREDICTOR: ChurnPredictor | None = None


def get_predictor() -> ChurnPredictor:
    """
    Get or create the XGBoost churn predictor.
    Uses lazy loading - only loads model on first call.
    """
    global _PREDICTOR
    if _PREDICTOR is None:
        # Using XGBoost model (trained on IBM Telco dataset)
        _PREDICTOR = ChurnPredictor(model_name="xgboost_churn")
    return _PREDICTOR


def predict_churn(user_features: Dict[str, Any]) -> Dict[str, Any]:
    """
    Predict churn probability for a user given their features.
    
    Args:
        user_features: Dictionary with feature names as keys and values
                      Example: {"tenure": 4, "MonthlyCharges": 30, ...}
    
    Returns:
        Dictionary with:
        - churn_prediction: 0 or 1
        - churn_probability: float between 0-1
        - risk_level: "FAIBLE", "MOYEN", "ÉLEVÉ", or "CRITIQUE"
    """
    predictor = get_predictor()
    return predictor.predict(user_features)


def get_stats_for_dashboard() -> Dict[str, Any]:
    """
    Get model statistics for the dashboard.
    Returns metrics from the trained XGBoost model.
    """
    predictor = get_predictor()
    return {
        "model_name": predictor.model_name,
        "metrics": predictor.get_metrics(),
        "feature_importance": predictor.get_feature_importance(),
    }
