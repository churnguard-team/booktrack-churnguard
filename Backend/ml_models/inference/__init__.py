"""
Inference - Load and use trained models
========================================
Classes pour charger et utiliser les modèles ML sauvegardés.
"""

import json
import joblib
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import numpy as np

MODEL_DIR = Path(__file__).parent.parent / "saved_models"


class ChurnPredictor:
    """
    Classe pour charger et utiliser un modèle de churn sauvegardé.
    """
    
    def __init__(self, model_name: str = "random_forest_churn"):
        """
        Initialiser le prédicteur de churn.
        
        Args:
            model_name: Nom du modèle ('random_forest_churn', 'xgboost_churn', 'deep_learning_churn')
        """
        self.model_name = model_name
        self.model_dir = MODEL_DIR / model_name
        self.model = None
        self.features = None
        self.metadata = None
        self.scaler = None  # Pour deep learning
        
        self._load_model()
    
    def _load_model(self):
        """Charger le modèle et ses métadonnées."""
        # Charger métadonnées
        metadata_path = self.model_dir / "metadata.json"
        if not metadata_path.exists():
            raise FileNotFoundError(f"Métadonnées non trouvées pour {self.model_name}")
        
        with open(metadata_path) as f:
            self.metadata = json.load(f)
        
        # Charger features
        features_path = self.model_dir / "features.pkl"
        if features_path.exists():
            self.features = joblib.load(features_path)
        
        # Charger le modèle
        algorithm = self.metadata.get('algorithm', '')
        
        if 'Deep Learning' in algorithm:
            # Pour deep learning
            self._load_keras_model()
        else:
            # Pour RF et XGBoost
            model_path = self.model_dir / "model.pkl"
            if not model_path.exists():
                # Essayer model.json pour XGBoost
                model_path = self.model_dir / "model.json"
                if not model_path.exists():
                    raise FileNotFoundError(f"Modèle non trouvé pour {self.model_name}")
            
            self.model = joblib.load(model_path)
        
        print(f"✓ Modèle chargé: {self.model_name}")
        print(f"  Algorithme: {algorithm}")
        print(f"  Features: {len(self.features) if self.features else 'N/A'}")
    
    def _load_keras_model(self):
        """Charger un modèle Keras."""
        try:
            import tensorflow as tf
            model_path = self.model_dir / "model.h5"
            self.model = tf.keras.models.load_model(model_path)
            
            # Charger le scaler
            scaler_path = self.model_dir / "scaler.pkl"
            if scaler_path.exists():
                self.scaler = joblib.load(scaler_path)
            
        except ImportError:
            raise ImportError("TensorFlow/Keras n'est pas installé")
    
    def predict(self, features: Dict[str, float]) -> Dict[str, float]:
        """
        Prédire la probabilité de churn pour un utilisateur.
        
        Args:
            features: Dictionnaire avec les features {feature_name: value, ...}
            
        Returns:
            Dictionnaire avec prédiction et probabilité
        """
        # Préparer les données
        X = self._prepare_features(features)
        
        # Normaliser si deep learning
        if self.scaler:
            X = self.scaler.transform([X])
        else:
            X = [X]
        
        # Prédire
        if hasattr(self.model, 'predict_proba'):
            # SK-Learn models
            proba = self.model.predict_proba(X)[0]
            pred = self.model.predict(X)[0]
            churn_probability = float(proba[1])
        else:
            # Keras model
            proba = self.model.predict(X, verbose=0)[0][0]
            pred = int(proba >= 0.5)
            churn_probability = float(proba)
        
        # Déterminer le niveau de risque
        if churn_probability < 0.3:
            risk_level = "FAIBLE"
        elif churn_probability < 0.6:
            risk_level = "MOYEN"
        elif churn_probability < 0.8:
            risk_level = "ÉLEVÉ"
        else:
            risk_level = "CRITIQUE"
        
        return {
            'churn_prediction': int(pred),
            'churn_probability': churn_probability,
            'risk_level': risk_level
        }
    
    def predict_batch(self, features_list: List[Dict[str, float]]) -> List[Dict]:
        """
        Prédire pour plusieurs utilisateurs.
        """
        results = []
        for features in features_list:
            result = self.predict(features)
            results.append(result)
        return results
    
    def _prepare_features(self, features: Dict[str, float]) -> np.ndarray:
        """Préparer les features dans le bon ordre."""
        if not self.features:
            raise ValueError("Features mapping non disponible")
        
        feature_vector = []
        for feature_name in self.features:
            value = features.get(feature_name, 0)
            feature_vector.append(float(value))
        
        return np.array(feature_vector)
    
    def get_feature_importance(self) -> Dict[str, float]:
        """Retourner l'importance des features."""
        if 'feature_importance' in self.metadata:
            return {
                item['feature']: item['importance']
                for item in self.metadata['feature_importance']
            }
        return {}
    
    def get_metrics(self) -> Dict:
        """Retourner les métriques du modèle."""
        return self.metadata.get('metrics', {})


class RecommendationEngine:
    """
    Classe pour charger et utiliser un modèle de recommandation.
    """
    
    def __init__(self, model_name: str = "book_recommendation"):
        """
        Initialiser le moteur de recommandation.
        
        Args:
            model_name: Nom du modèle ('book_recommendation')
        """
        self.model_name = model_name
        self.model_dir = MODEL_DIR / model_name
        self.model = None
        self.matrix = None
        self.user_to_idx = None
        self.book_to_idx = None
        self.idx_to_book = None
        self.metadata = None
        
        self._load_model()
    
    def _load_model(self):
        """Charger le modèle et ses composantes."""
        # Charger métadonnées
        metadata_path = self.model_dir / "metadata.json"
        if not metadata_path.exists():
            raise FileNotFoundError(f"Métadonnées non trouvées pour {self.model_name}")
        
        with open(metadata_path) as f:
            self.metadata = json.load(f)
        
        # Charger composantes
        self.model = joblib.load(self.model_dir / "model.pkl")
        self.matrix = joblib.load(self.model_dir / "user_book_matrix.pkl")
        self.user_to_idx = joblib.load(self.model_dir / "user_to_idx.pkl")
        self.book_to_idx = joblib.load(self.model_dir / "book_to_idx.pkl")
        
        # Index inverse
        self.idx_to_book = {idx: bid for bid, idx in self.book_to_idx.items()}
        
        print(f"✓ Modèle recommandation chargé")
        print(f"  Algorithme: {self.metadata.get('algorithm')}")
        print(f"  Users: {self.metadata.get('n_users')}")
        print(f"  Books: {self.metadata.get('n_books')}")
    
    def recommend(self, user_id: str, n_recommendations: int = 5,
                 exclude_read: bool = True) -> List[Dict]:
        """
        Obtenir des recommandations pour un utilisateur.
        
        Args:
            user_id: ID de l'utilisateur
            n_recommendations: Nombre de recommandations
            exclude_read: Exclure les livres déjà lus
            
        Returns:
            Liste des livres recommandés avec scores
        """
        if user_id not in self.user_to_idx:
            return []  # Utilisateur nouveau (cold start)
        
        user_idx = self.user_to_idx[user_id]
        algorithm = self.metadata.get('algorithm')
        
        if algorithm == 'collaborative_filtering':
            return self._recommend_collaborative(user_idx, n_recommendations, exclude_read)
        elif algorithm == 'content_based':
            return self._recommend_content_based(user_idx, n_recommendations, exclude_read)
        
        return []
    
    def _recommend_collaborative(self, user_idx: int, n_recommendations: int,
                                exclude_read: bool) -> List[Dict]:
        """Recommandation par collaborative filtering."""
        user_similarity = self.model['user_similarity']
        
        # Trouver les utilisateurs similaires
        similarities = user_similarity[user_idx]
        similar_users_idx = np.argsort(similarities)[::-1][1:11]  # Top 10 (sauf self)
        
        # Récupérer les livres appréciés par utilisateurs similaires
        book_scores = {}
        for sim_user_idx in similar_users_idx:
            sim = similarities[sim_user_idx]
            # Livres lus par l'utilisateur similaire
            read_books = np.where(self.matrix[sim_user_idx] > 0)[0]
            for book_idx in read_books:
                # Si l'utilisateur n'a pas déjà lu
                if exclude_read and self.matrix[user_idx, book_idx] > 0:
                    continue
                
                # Ajouter au score
                if book_idx not in book_scores:
                    book_scores[book_idx] = 0
                book_scores[book_idx] += sim * self.matrix[sim_user_idx, book_idx]
        
        # Trier par score
        top_books = sorted(book_scores.items(), key=lambda x: x[1], reverse=True)[:n_recommendations]
        
        return [
            {
                'book_id': self.idx_to_book[book_idx],
                'score': float(score)
            }
            for book_idx, score in top_books
        ]
    
    def _recommend_content_based(self, user_idx: int, n_recommendations: int,
                                exclude_read: bool) -> List[Dict]:
        """Recommandation par content-based."""
        book_similarity = self.model['book_similarity']
        
        # Livres lus par l'utilisateur
        read_books_idx = np.where(self.matrix[user_idx] > 0)[0]
        
        if len(read_books_idx) == 0:
            return []  # Pas d'historique
        
        # Calculer les scores de recommandation
        book_scores = {}
        for read_book_idx in read_books_idx:
            # Trouver les livres similaires
            similarities = book_similarity[read_book_idx]
            for book_idx in range(len(similarities)):
                # Exclure le livre lié et les livres déjà lus
                if book_idx == read_book_idx:
                    continue
                if exclude_read and self.matrix[user_idx, book_idx] > 0:
                    continue
                
                if book_idx not in book_scores:
                    book_scores[book_idx] = 0
                book_scores[book_idx] += similarities[book_idx]
        
        # Trier par score
        top_books = sorted(book_scores.items(), key=lambda x: x[1], reverse=True)[:n_recommendations]
        
        return [
            {
                'book_id': self.idx_to_book[book_idx],
                'score': float(score)
            }
            for book_idx, score in top_books
        ]
    
    def get_similar_books(self, book_id: str, n_similar: int = 5) -> List[Dict]:
        """Obtenir des livres similaires."""
        if book_id not in self.book_to_idx:
            return []
        
        book_idx = self.book_to_idx[book_id]
        book_similarity = self.model.get('book_similarity')
        
        if book_similarity is None:
            return []
        
        similarities = book_similarity[book_idx]
        # Top N (sauf le livre lui-même)
        similar_idx = np.argsort(similarities)[::-1][1:n_similar+1]
        
        return [
            {
                'book_id': self.idx_to_book[idx],
                'similarity': float(similarities[idx])
            }
            for idx in similar_idx
        ]


# Singleton instances pour utilisation dans l'API
_churn_predictors = {}
_recommendation_engine = None


def get_churn_predictor(model_name: str = "random_forest_churn") -> ChurnPredictor:
    """Obtenir une instance du prédicteur de churn (cached)."""
    if model_name not in _churn_predictors:
        try:
            _churn_predictors[model_name] = ChurnPredictor(model_name)
        except FileNotFoundError:
            return None
    return _churn_predictors[model_name]


def get_recommendation_engine() -> RecommendationEngine:
    """Obtenir une instance du moteur de recommandation (cached)."""
    global _recommendation_engine
    if _recommendation_engine is None:
        try:
            _recommendation_engine = RecommendationEngine()
        except FileNotFoundError:
            return None
    return _recommendation_engine
