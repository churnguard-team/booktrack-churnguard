from typing import Any, Dict
from pathlib import Path

import joblib
import numpy as np
from pathlib import Path

_MODEL = None

FEATURE_NAMES = [
    'SeniorCitizen', 'tenure', 'MonthlyCharges', 'TotalCharges',
    'gender_Male', 'Partner_Yes', 'Dependents_Yes', 'PhoneService_Yes',
    'MultipleLines_No phone service', 'MultipleLines_Yes',
    'InternetService_Fiber optic', 'InternetService_No',
    'OnlineSecurity_No internet service', 'OnlineSecurity_Yes',
    'OnlineBackup_No internet service', 'OnlineBackup_Yes',
    'DeviceProtection_No internet service', 'DeviceProtection_Yes',
    'TechSupport_No internet service', 'TechSupport_Yes',
    'StreamingTV_No internet service', 'StreamingTV_Yes',
    'StreamingMovies_No internet service', 'StreamingMovies_Yes',
    'Contract_One year', 'Contract_Two year',
    'PaperlessBilling_Yes',
    'PaymentMethod_Credit card (automatic)',
    'PaymentMethod_Electronic check', 'PaymentMethod_Mailed check'
]

MODEL_PATH = Path(__file__).resolve().parents[3] / "saved_models" / "comparison" / "xgboost.pkl"


def _get_model():
    global _MODEL
    if _MODEL is None:
        _MODEL = joblib.load(MODEL_PATH)
    return _MODEL


def predict_churn(user_features: Dict[str, Any]) -> Dict[str, Any]:
    model = _get_model()
    X = np.array([[user_features.get(f, 0) for f in FEATURE_NAMES]])
    proba = float(model.predict_proba(X)[0][1])
    pred = int(proba >= 0.5)

    if proba < 0.3:
        risk_level = "FAIBLE"
    elif proba < 0.6:
        risk_level = "MOYEN"
    elif proba < 0.8:
        risk_level = "ÉLEVÉ"
    else:
        risk_level = "CRITIQUE"

    return {
        "churn_prediction": pred,
        "churn_probability": proba,
        "risk_level": risk_level
    }


def get_stats_for_dashboard() -> Dict[str, Any]:
    return {
        "model_name": "XGBoost",
        "roc_auc": 0.8433,
        "accuracy": 0.8013,
        "features": FEATURE_NAMES
    }
