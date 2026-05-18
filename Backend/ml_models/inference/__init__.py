"""
Inference - Load and use trained models
=======================================
Classes pour charger et utiliser les modeles ML sauvegardes.
"""

import json
import joblib
from pathlib import Path
from typing import Dict, List
import numpy as np

# Allow saved models either in backend/ml_models/saved_models or at the repository root saved_models.
BACKEND_MODEL_DIR = Path(__file__).resolve().parent.parent / "saved_models"
REPO_ROOT_MODEL_DIR = Path(__file__).resolve().parents[3] / "saved_models"

MODEL_DIR = BACKEND_MODEL_DIR if BACKEND_MODEL_DIR.exists() and any(BACKEND_MODEL_DIR.iterdir()) else REPO_ROOT_MODEL_DIR


class ChurnPredictor:
    """
    Classe pour charger et utiliser un modele de churn sauvegarde.
    """

    def __init__(self, model_name: str = "random_forest"):
        self.model_name = model_name
        self.model_dir = MODEL_DIR / model_name
        self.model = None
        self.features = None
        self.metadata = None
        self.scaler = None

        self._load_model()

    def _load_model(self):
        metadata_path = self.model_dir / "metadata.json"
        if not metadata_path.exists():
            raise FileNotFoundError(f"Metadonnees non trouvees pour {self.model_name}")

        with open(metadata_path, "r", encoding="utf-8") as handle:
            self.metadata = json.load(handle)

        features_path = self.model_dir / "features.pkl"
        if features_path.exists():
            self.features = joblib.load(features_path)

        algorithm = self.metadata.get("algorithm", "")

        if "Deep Learning" in algorithm:
            self._load_keras_model()
        else:
            model_path = self.model_dir / "model.pkl"
            if not model_path.exists():
                model_path = self.model_dir / "model.json"
                if not model_path.exists():
                    raise FileNotFoundError(f"Modele non trouve pour {self.model_name}")

            self.model = joblib.load(model_path)

        print(f"Model loaded: {self.model_name}")

    def _load_keras_model(self):
        try:
            import tensorflow as tf
            model_path = self.model_dir / "model.h5"
            self.model = tf.keras.models.load_model(model_path)

            scaler_path = self.model_dir / "scaler.pkl"
            if scaler_path.exists():
                self.scaler = joblib.load(scaler_path)
        except ImportError as exc:
            raise ImportError("TensorFlow/Keras n'est pas installe") from exc

    def predict(self, features: Dict[str, float]) -> Dict[str, float]:
        X = self._prepare_features(features)

        if self.scaler:
            X = self.scaler.transform([X])
        else:
            X = [X]

        if hasattr(self.model, "predict_proba"):
            proba = self.model.predict_proba(X)[0]
            pred = self.model.predict(X)[0]
            churn_probability = float(proba[1])
        else:
            proba = self.model.predict(X, verbose=0)[0][0]
            pred = int(proba >= 0.5)
            churn_probability = float(proba)

        if churn_probability < 0.3:
            risk_level = "FAIBLE"
        elif churn_probability < 0.6:
            risk_level = "MOYEN"
        elif churn_probability < 0.8:
            risk_level = "ELEVE"
        else:
            risk_level = "CRITIQUE"

        return {
            "churn_prediction": int(pred),
            "churn_probability": churn_probability,
            "risk_level": risk_level,
        }

    def predict_batch(self, features_list: List[Dict[str, float]]) -> List[Dict]:
        results = []
        for features in features_list:
            result = self.predict(features)
            results.append(result)
        return results

    def _prepare_features(self, features: Dict[str, float]) -> np.ndarray:
        if not self.features:
            raise ValueError("Features mapping non disponible")

        feature_vector = []
        for feature_name in self.features:
            value = features.get(feature_name, 0)
            feature_vector.append(float(value))

        return np.array(feature_vector)

    def get_feature_importance(self) -> Dict[str, float]:
        if "feature_importance" in self.metadata:
            return {
                item["feature"]: item["importance"]
                for item in self.metadata["feature_importance"]
            }
        return {}

    def get_metrics(self) -> Dict:
        return self.metadata.get("metrics", {})
