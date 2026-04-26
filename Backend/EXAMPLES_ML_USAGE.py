"""
Exemple d'utilisation des modèles ML
====================================

Ce fichier montre comment utiliser les classes de modèles créées.
À adapter selon votre implémentation réelle.
"""

import pandas as pd
import numpy as np
from ml_models.churn import RandomForestChurnModel, XGBoostChurnModel, DeepLearningChurnModel
from ml_models.recommendation import BookRecommendationModel

# ============================================================
# EXEMPLE 1: Random Forest Churn Model
# ============================================================

def example_random_forest():
    """Exemple d'utilisation du modèle Random Forest"""
    
    # Créer des données d'exemple
    X_train = np.random.randn(100, 10)  # 100 utilisateurs, 10 features
    y_train = np.random.randint(0, 2, 100)  # 0 ou 1 (churn ou pas)
    X_test = np.random.randn(20, 10)
    
    # Initialiser le modèle
    model = RandomForestChurnModel(
        n_estimators=100,
        random_state=42
    )
    
    # Entraîner
    metrics = model.train(X_train, y_train)
    print("Random Forest - Training metrics:", metrics)
    
    # Faire des prédictions
    predictions = model.predict(X_test)
    print("Predictions:", predictions)
    
    # Probabilités
    probabilities = model.predict_proba(X_test)
    print("Probabilities shape:", probabilities.shape)
    
    # Feature importance
    importance = model.get_feature_importance()
    print("Top features:\n", importance.head())


# ============================================================
# EXEMPLE 2: XGBoost Churn Model
# ============================================================

def example_xgboost():
    """Exemple d'utilisation du modèle XGBoost"""
    
    X_train = np.random.randn(100, 10)
    y_train = np.random.randint(0, 2, 100)
    X_val = np.random.randn(20, 10)
    y_val = np.random.randint(0, 2, 20)
    X_test = np.random.randn(20, 10)
    
    model = XGBoostChurnModel(
        max_depth=6,
        learning_rate=0.1,
        n_estimators=100
    )
    
    # Entraîner avec validation set
    metrics = model.train(X_train, y_train, X_val, y_val)
    print("XGBoost - Training metrics:", metrics)
    
    # Prédictions
    predictions = model.predict(X_test)
    probabilities = model.predict_proba(X_test)
    
    # Feature importance
    importance = model.get_feature_importance(importance_type='weight')
    print("Top features:\n", importance.head())


# ============================================================
# EXEMPLE 3: Deep Learning Churn Model
# ============================================================

def example_deep_learning():
    """Exemple d'utilisation du modèle Deep Learning"""
    
    n_samples = 100
    n_features = 10
    
    X_train = np.random.randn(n_samples, n_features).astype('float32')
    y_train = np.random.randint(0, 2, n_samples)
    X_val = np.random.randn(20, n_features).astype('float32')
    y_val = np.random.randint(0, 2, 20)
    X_test = np.random.randn(20, n_features).astype('float32')
    
    model = DeepLearningChurnModel(
        input_dim=n_features,
        hidden_layers=[128, 64, 32],
        dropout_rate=0.3,
        learning_rate=0.001,
        epochs=50,
        batch_size=32
    )
    
    # Construire l'architecture
    model.build_model()
    
    # Entraîner
    metrics = model.train(X_train, y_train, X_val, y_val)
    print("Deep Learning - Training metrics:", metrics)
    
    # Prédictions
    predictions = model.predict(X_test)
    probabilities = model.predict_proba(X_test)
    
    # Historique
    history = model.get_training_history()
    print("Training history keys:", history.keys())


# ============================================================
# EXEMPLE 4: Recommendation Model
# ============================================================

def example_recommendation():
    """Exemple d'utilisation du modèle de recommandation"""
    
    # Créer des données d'interactions
    interactions_data = {
        'user_id': ['user1', 'user1', 'user2', 'user2', 'user3', 'user3'],
        'book_id': ['book1', 'book2', 'book2', 'book3', 'book1', 'book4'],
        'rating': [5, 4, 5, 3, 4, 5]
    }
    interactions_df = pd.DataFrame(interactions_data)
    
    # Données des livres (optionnel)
    books_data = {
        'book_id': ['book1', 'book2', 'book3', 'book4'],
        'title': ['Book A', 'Book B', 'Book C', 'Book D'],
        'genre': ['Fiction', 'Science', 'Fiction', 'Mystery'],
        'author': ['Author X', 'Author Y', 'Author Z', 'Author W']
    }
    books_df = pd.DataFrame(books_data)
    
    # Initialiser le modèle
    model = BookRecommendationModel(
        algorithm='collaborative',
        n_factors=10
    )
    
    # Entraîner
    metrics = model.train(interactions_df, books_df)
    print("Recommendation - Training metrics:", metrics)
    
    # Obtenir recommandations pour un utilisateur
    recommendations = model.recommend('user1', n_recommendations=3)
    print("Recommendations for user1:", recommendations)
    
    # Recommandations batch
    batch_recs = model.recommend_batch(['user1', 'user2', 'user3'], n_recommendations=2)
    print("Batch recommendations:", batch_recs)
    
    # Livres similaires
    similar = model.get_similar_books('book1', n_similar=3)
    print("Books similar to book1:", similar)
    
    # Profil utilisateur
    user_profile = model.get_user_profile('user1')
    print("User1 profile:", user_profile)


# ============================================================
# EXEMPLE 5: Utilisation dans une API FastAPI
# ============================================================

def example_fastapi_integration():
    """Exemple d'intégration dans FastAPI"""
    
    # Code à mettre dans routers/moderator.py
    
    from fastapi import APIRouter, Body
    
    router = APIRouter(prefix="/moderator", tags=["Moderator"])
    
    # Initialiser les modèles au démarrage
    rf_model = RandomForestChurnModel()
    xgb_model = XGBoostChurnModel()
    dl_model = DeepLearningChurnModel()
    rec_model = BookRecommendationModel()
    
    @router.post("/churn/predict")
    def predict_churn(user_id: str = Body(...)):
        """Exemple d'endpoint de prédiction"""
        
        # À implémenter:
        # 1. Récupérer les features de l'utilisateur depuis la DB
        # 2. Préparer les données
        # 3. Faire la prédiction avec l'ensemble des modèles
        # 4. Combiner les résultats
        
        return {
            "user_id": user_id,
            "churn_probability": 0.65,
            "risk_level": "HIGH",
            "models": {
                "random_forest": 0.68,
                "xgboost": 0.63,
                "deep_learning": 0.64,
                "ensemble": 0.65
            }
        }


# ============================================================
# Main
# ============================================================

if __name__ == "__main__":
    print("=== Exemple 1: Random Forest ===")
    # example_random_forest()
    
    print("\n=== Exemple 2: XGBoost ===")
    # example_xgboost()
    
    print("\n=== Exemple 3: Deep Learning ===")
    # example_deep_learning()
    
    print("\n=== Exemple 4: Recommendation ===")
    example_recommendation()
    
    print("\nPour utiliser ces exemples:")
    print("1. Décommenter les appels de fonction")
    print("2. Implémenter les méthodes des classes")
    print("3. Adapter les données à votre contexte réel")
