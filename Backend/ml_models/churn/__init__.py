from typing import Any, Dict

from ..inference import ChurnPredictor

_PREDICTOR: ChurnPredictor | None = None


def get_predictor() -> ChurnPredictor:
    global _PREDICTOR
    if _PREDICTOR is None:
        _PREDICTOR = ChurnPredictor(model_name="random_forest")
    return _PREDICTOR


def predict_churn(user_features: Dict[str, Any]) -> Dict[str, Any]:
    predictor = get_predictor()
    return predictor.predict(user_features)


def get_stats_for_dashboard() -> Dict[str, Any]:
    predictor = get_predictor()
    return {
        "model_name": predictor.model_name,
        "metrics": predictor.get_metrics(),
        "feature_importance": predictor.get_feature_importance(),
    }
