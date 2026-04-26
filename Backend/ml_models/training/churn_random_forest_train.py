"""
Training - Random Forest Churn Prediction
==========================================
Script indépendant pour entraîner et évaluer un modèle Random Forest.

À adapter avec vos données réelles.
"""

import pandas as pd
import numpy as np
import warnings
import joblib
from pathlib import Path
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, 
    roc_auc_score, confusion_matrix, classification_report
)
import matplotlib.pyplot as plt
import seaborn as sns

warnings.filterwarnings('ignore')

# ── CONFIGURATION ──────────────────────────────────────────
MODEL_NAME = "random_forest_churn"
MODEL_DIR = Path(__file__).parent.parent / "saved_models"
MODEL_DIR.mkdir(exist_ok=True)

RANDOM_STATE = 42
TEST_SIZE = 0.2
RANDOM_FOREST_PARAMS = {
    'n_estimators': 100,
    'max_depth': 15,
    'min_samples_split': 10,
    'min_samples_leaf': 5,
    'random_state': RANDOM_STATE,
    'n_jobs': -1,
    'class_weight': 'balanced'  # Pour gérer le déséquilibre des classes
}


def load_data(csv_path: str) -> pd.DataFrame:
    """
    Charger et précharger les données de churn.
    
    Args:
        csv_path: Chemin vers le fichier CSV
        
    Returns:
        DataFrame avec données préparées
    """
    print(f"📥 Chargement des données depuis {csv_path}")
    df = pd.read_csv(csv_path)
    print(f"✓ Données chargées: {df.shape}")
    return df


def preprocess_data(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Nettoyer et préparer les données.
    
    À adapter selon votre dataset!
    """
    print("\n🧹 Nettoyage des données...")
    
    # Faire une copie pour ne pas modifier l'original
    df = df.copy()
    
    # ── ÉTAPE 1: Supprimer les colonnes inutiles ──
    columns_to_drop = []
    for col in df.columns:
        if 'id' in col.lower() or 'identifier' in col.lower():
            columns_to_drop.append(col)
    
    if columns_to_drop:
        print(f"  - Suppression des colonnes ID: {columns_to_drop}")
        df = df.drop(columns=columns_to_drop, errors='ignore')
    
    # ── ÉTAPE 2: Gérer les valeurs manquantes ──
    print(f"  - Valeurs manquantes par colonne:")
    missing = df.isnull().sum()
    if missing.sum() > 0:
        print(missing[missing > 0])
        # Remplir avec la mode pour catégorielles, médiane pour numériques
        for col in df.columns:
            if df[col].isnull().sum() > 0:
                if df[col].dtype == 'object':
                    df[col] = df[col].fillna(df[col].mode()[0])
                else:
                    df[col] = df[col].fillna(df[col].median())
    else:
        print("  - Aucune valeur manquante")
    
    # ── ÉTAPE 3: Identifier la colonne cible (Churn) ──
    # À adapter selon votre dataset
    target_col = None
    for col in df.columns:
        if 'churn' in col.lower():
            target_col = col
            break
    
    if target_col is None:
        raise ValueError("Colonne 'Churn' non trouvée!")
    
    print(f"  - Colonne cible: {target_col}")
    
    # ── ÉTAPE 4: Encoder la cible en 0/1 ──
    if df[target_col].dtype == 'object':
        le = LabelEncoder()
        df[target_col] = le.fit_transform(df[target_col])
    
    return df, target_col


def feature_engineering(df: pd.DataFrame, target_col: str) -> tuple[np.ndarray, np.ndarray]:
    """
    Préparer les features et la cible.
    """
    print("\n⚙️  Feature Engineering...")
    
    X = df.drop(columns=[target_col])
    y = df[target_col]
    
    # ── Encoder les colonnes catégorielles ──
    categorical_cols = X.select_dtypes(include=['object']).columns
    if len(categorical_cols) > 0:
        print(f"  - One-Hot Encoding: {list(categorical_cols)}")
        X = pd.get_dummies(X, columns=categorical_cols, drop_first=True)
    
    # ── Convertir en numériques si nécessaire ──
    X = X.astype(float)
    
    print(f"  - Dimensions finales: X={X.shape}, y={y.shape}")
    print(f"  - Distribution des classes: {np.bincount(y)}")
    
    return X.values, y.values


def train_model(X_train: np.ndarray, y_train: np.ndarray) -> tuple[RandomForestClassifier, dict]:
    """
    Entraîner le modèle Random Forest.
    """
    print("\n🚀 Entraînement du modèle Random Forest...")
    print(f"  - Paramètres: {RANDOM_FOREST_PARAMS}")
    
    model = RandomForestClassifier(**RANDOM_FOREST_PARAMS)
    model.fit(X_train, y_train)
    
    print("✓ Modèle entraîné!")
    
    return model, RANDOM_FOREST_PARAMS


def evaluate_model(model: RandomForestClassifier, 
                   X_test: np.ndarray, y_test: np.ndarray,
                   feature_names: list) -> dict:
    """
    Évaluer le modèle et retourner les métriques.
    """
    print("\n📊 Évaluation du modèle...")
    
    # Prédictions
    y_pred = model.predict(X_test)
    y_pred_proba = model.predict_proba(X_test)[:, 1]
    
    # Métriques
    metrics = {
        'accuracy': accuracy_score(y_test, y_pred),
        'precision': precision_score(y_test, y_pred),
        'recall': recall_score(y_test, y_pred),
        'f1': f1_score(y_test, y_pred),
        'roc_auc': roc_auc_score(y_test, y_pred_proba),
    }
    
    # Affichage
    print(f"\n  Accuracy:  {metrics['accuracy']:.4f}")
    print(f"  Precision: {metrics['precision']:.4f}")
    print(f"  Recall:    {metrics['recall']:.4f}")
    print(f"  F1-Score:  {metrics['f1']:.4f}")
    print(f"  ROC-AUC:   {metrics['roc_auc']:.4f}")
    
    print("\n📋 Classification Report:")
    print(classification_report(y_test, y_pred))
    
    # Confusion Matrix
    cm = confusion_matrix(y_test, y_pred)
    print(f"\n🎯 Confusion Matrix:")
    print(cm)
    
    # Feature Importance
    importances = pd.DataFrame({
        'feature': feature_names,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print(f"\n🔍 Top 10 Features:")
    print(importances.head(10))
    
    # Sauvegarde des résultats
    metrics['confusion_matrix'] = cm.tolist()
    metrics['feature_importance'] = importances.head(10).to_dict('records')
    
    return metrics, y_pred, y_pred_proba, importances


def plot_results(model: RandomForestClassifier, 
                y_test: np.ndarray, y_pred: np.ndarray, y_pred_proba: np.ndarray,
                importances: pd.DataFrame,
                output_dir: Path = None):
    """
    Générer des visualisations des résultats.
    """
    if output_dir is None:
        output_dir = MODEL_DIR / MODEL_NAME
        output_dir.mkdir(exist_ok=True)
    
    print(f"\n📈 Génération des graphiques...")
    
    # 1. Feature Importance
    fig, ax = plt.subplots(figsize=(10, 6))
    top_n = 15
    top_features = importances.head(top_n)
    ax.barh(range(len(top_features)), top_features['importance'], color='steelblue')
    ax.set_yticks(range(len(top_features)))
    ax.set_yticklabels(top_features['feature'])
    ax.set_xlabel('Importance')
    ax.set_title(f'Top {top_n} Feature Importance - Random Forest')
    ax.invert_yaxis()
    plt.tight_layout()
    plt.savefig(output_dir / 'feature_importance.png', dpi=100)
    print(f"  ✓ Sauvegardé: feature_importance.png")
    
    # 2. Confusion Matrix
    fig, ax = plt.subplots(figsize=(8, 6))
    cm = confusion_matrix(y_test, y_pred)
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=ax)
    ax.set_xlabel('Prédiction')
    ax.set_ylabel('Réalité')
    ax.set_title('Confusion Matrix - Random Forest')
    plt.tight_layout()
    plt.savefig(output_dir / 'confusion_matrix.png', dpi=100)
    print(f"  ✓ Sauvegardé: confusion_matrix.png")
    
    # 3. Prediction Distribution
    fig, ax = plt.subplots(figsize=(10, 6))
    ax.hist(y_pred_proba[y_test == 0], bins=30, alpha=0.6, label='No Churn', color='green')
    ax.hist(y_pred_proba[y_test == 1], bins=30, alpha=0.6, label='Churn', color='red')
    ax.set_xlabel('Probabilité de Churn')
    ax.set_ylabel('Fréquence')
    ax.set_title('Distribution des Probabilités de Prédiction')
    ax.legend()
    plt.tight_layout()
    plt.savefig(output_dir / 'prediction_distribution.png', dpi=100)
    print(f"  ✓ Sauvegardé: prediction_distribution.png")
    
    print(f"\n✓ Graphiques sauvegardés dans: {output_dir}")


def save_model(model: RandomForestClassifier, feature_names: list, 
               metrics: dict, params: dict):
    """
    Sauvegarder le modèle et ses métadonnées.
    """
    print(f"\n💾 Sauvegarde du modèle...")
    
    model_dir = MODEL_DIR / MODEL_NAME
    model_dir.mkdir(exist_ok=True)
    
    # Modèle
    model_path = model_dir / "model.pkl"
    joblib.dump(model, model_path)
    print(f"  ✓ Modèle: {model_path}")
    
    # Features
    features_path = model_dir / "features.pkl"
    joblib.dump(feature_names, features_path)
    print(f"  ✓ Features: {features_path}")
    
    # Métadonnées
    metadata = {
        'model_name': MODEL_NAME,
        'algorithm': 'Random Forest',
        'trained_at': datetime.now().isoformat(),
        'metrics': metrics,
        'parameters': params,
        'feature_count': len(feature_names),
        'features': feature_names
    }
    
    import json
    metadata_path = model_dir / "metadata.json"
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"  ✓ Métadonnées: {metadata_path}")
    
    print(f"\n✓ Tous les fichiers sauvegardés dans: {model_dir}")
    
    return model_dir


def main(csv_path: str):
    """
    Pipeline complet d'entraînement.
    """
    print("=" * 60)
    print("🤖 RANDOM FOREST CHURN PREDICTION - TRAINING")
    print("=" * 60)
    
    # 1. Charger les données
    df = load_data(csv_path)
    
    # 2. Nettoyer et préparer
    df, target_col = preprocess_data(df)
    
    # 3. Feature engineering
    X, y = feature_engineering(df, target_col)
    feature_names = df.drop(columns=[target_col]).columns.tolist()
    
    # 4. Split train/test
    print(f"\n🔀 Split train/test (80/20)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
    )
    print(f"  - Train: {X_train.shape}")
    print(f"  - Test:  {X_test.shape}")
    
    # 5. Entraîner
    model, params = train_model(X_train, y_train)
    
    # 6. Évaluer
    metrics, y_pred, y_pred_proba, importances = evaluate_model(
        model, X_test, y_test, feature_names
    )
    
    # 7. Générer les graphiques
    plot_results(model, y_test, y_pred, y_pred_proba, importances)
    
    # 8. Sauvegarder
    save_model(model, feature_names, metrics, params)
    
    print("\n" + "=" * 60)
    print("✅ ENTRAÎNEMENT TERMINÉ!")
    print("=" * 60)
    
    return model, metrics


if __name__ == "__main__":
    # ⚠️ À ADAPTER avec votre chemin de données
    # Vous pouvez utiliser kagglehub pour télécharger:
    # import kagglehub
    # path = kagglehub.dataset_download("abdullah0a/telecom-customer-churn-insights-for-analysis")
    # csv_path = f"{path}/telecom_customer_churn.csv"
    
    # Pour le test, créer un dataset d'exemple
    import os
    from sklearn.datasets import make_classification
    
    print("⚠️  Aucun fichier CSV fourni!")
    print("Usage: python churn_random_forest_train.py <chemin_csv>")
    print("\nCréation d'un dataset d'exemple pour démonstration...")
    
    # Créer un dataset d'exemple
    X, y = make_classification(n_samples=1000, n_features=20, 
                               n_informative=15, n_redundant=5,
                               weights=[0.7, 0.3], random_state=42)
    
    # Créer un DataFrame
    df = pd.DataFrame(X, columns=[f'feature_{i}' for i in range(20)])
    df['Churn'] = y
    
    # Sauvegarder temporairement
    example_csv = Path(__file__).parent / "example_churn_data.csv"
    df.to_csv(example_csv, index=False)
    
    # Entraîner
    main(str(example_csv))
    
    # Nettoyer
    example_csv.unlink()
