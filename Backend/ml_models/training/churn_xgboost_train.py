"""
Training - XGBoost Churn Prediction
===================================
Script indépendant pour entraîner et évaluer un modèle XGBoost.
"""

import pandas as pd
import numpy as np
import warnings
import joblib
from pathlib import Path
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, 
    roc_auc_score, confusion_matrix, classification_report
)
import matplotlib.pyplot as plt
import seaborn as sns

warnings.filterwarnings('ignore')

# ── CONFIGURATION ──────────────────────────────────────────
MODEL_NAME = "xgboost_churn"
MODEL_DIR = Path(__file__).parent.parent / "saved_models"
MODEL_DIR.mkdir(exist_ok=True)

RANDOM_STATE = 42
TEST_SIZE = 0.2
XGBOOST_PARAMS = {
    'n_estimators': 200,
    'max_depth': 7,
    'learning_rate': 0.1,
    'subsample': 0.8,
    'colsample_bytree': 0.8,
    'reg_alpha': 1,
    'reg_lambda': 1,
    'random_state': RANDOM_STATE,
    'eval_metric': 'logloss',
    'use_label_encoder': False
}

EARLY_STOPPING_ROUNDS = 20
VALIDATION_SIZE = 0.2


def load_data(csv_path: str) -> pd.DataFrame:
    """Charger les données."""
    print(f"📥 Chargement des données depuis {csv_path}")
    df = pd.read_csv(csv_path)
    print(f"✓ Données chargées: {df.shape}")
    return df


def preprocess_data(df: pd.DataFrame) -> tuple[pd.DataFrame, str]:
    """Nettoyer et préparer les données."""
    print("\n🧹 Nettoyage des données...")
    df = df.copy()
    
    # Supprimer colonnes ID
    columns_to_drop = [col for col in df.columns if 'id' in col.lower()]
    if columns_to_drop:
        print(f"  - Suppression: {columns_to_drop}")
        df = df.drop(columns=columns_to_drop, errors='ignore')
    
    # Gérer les valeurs manquantes
    for col in df.columns:
        if df[col].isnull().sum() > 0:
            if df[col].dtype == 'object':
                df[col] = df[col].fillna(df[col].mode()[0])
            else:
                df[col] = df[col].fillna(df[col].median())
    
    # Trouver colonne cible
    target_col = next((col for col in df.columns if 'churn' in col.lower()), None)
    if not target_col:
        raise ValueError("Colonne 'Churn' non trouvée!")
    
    # Encoder la cible
    if df[target_col].dtype == 'object':
        le = LabelEncoder()
        df[target_col] = le.fit_transform(df[target_col])
    
    return df, target_col


def feature_engineering(df: pd.DataFrame, target_col: str) -> tuple[np.ndarray, np.ndarray]:
    """Préparer les features."""
    print("\n⚙️  Feature Engineering...")
    
    X = df.drop(columns=[target_col])
    y = df[target_col]
    
    # One-Hot Encoding
    categorical_cols = X.select_dtypes(include=['object']).columns
    if len(categorical_cols) > 0:
        print(f"  - One-Hot Encoding: {list(categorical_cols)}")
        X = pd.get_dummies(X, columns=categorical_cols, drop_first=True)
    
    X = X.astype(float)
    print(f"  - Dimensions: X={X.shape}, y={y.shape}")
    
    return X.values, y.values, X.columns.tolist()


def train_model(X_train: np.ndarray, y_train: np.ndarray,
                X_val: np.ndarray, y_val: np.ndarray) -> XGBClassifier:
    """Entraîner le modèle XGBoost avec early stopping."""
    print("\n🚀 Entraînement du modèle XGBoost...")
    print(f"  - Paramètres: {XGBOOST_PARAMS}")
    
    model = XGBClassifier(**XGBOOST_PARAMS)
    
    model.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        early_stopping_rounds=EARLY_STOPPING_ROUNDS,
        verbose=False
    )
    
    print(f"✓ Modèle entraîné! (meilleure itération: {model.best_iteration})")
    return model


def evaluate_model(model: XGBClassifier,
                   X_test: np.ndarray, y_test: np.ndarray,
                   feature_names: list) -> dict:
    """Évaluer le modèle."""
    print("\n📊 Évaluation du modèle...")
    
    y_pred = model.predict(X_test)
    y_pred_proba = model.predict_proba(X_test)[:, 1]
    
    metrics = {
        'accuracy': accuracy_score(y_test, y_pred),
        'precision': precision_score(y_test, y_pred),
        'recall': recall_score(y_test, y_pred),
        'f1': f1_score(y_test, y_pred),
        'roc_auc': roc_auc_score(y_test, y_pred_proba),
    }
    
    print(f"\n  Accuracy:  {metrics['accuracy']:.4f}")
    print(f"  Precision: {metrics['precision']:.4f}")
    print(f"  Recall:    {metrics['recall']:.4f}")
    print(f"  F1-Score:  {metrics['f1']:.4f}")
    print(f"  ROC-AUC:   {metrics['roc_auc']:.4f}")
    
    print("\n📋 Classification Report:")
    print(classification_report(y_test, y_pred))
    
    # Feature importance
    importances = pd.DataFrame({
        'feature': feature_names,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print(f"\n🔍 Top 10 Features:")
    print(importances.head(10))
    
    cm = confusion_matrix(y_test, y_pred)
    metrics['confusion_matrix'] = cm.tolist()
    metrics['feature_importance'] = importances.head(10).to_dict('records')
    
    return metrics, y_pred, y_pred_proba, importances


def plot_results(model: XGBClassifier,
                y_test: np.ndarray, y_pred: np.ndarray, y_pred_proba: np.ndarray,
                importances: pd.DataFrame,
                output_dir: Path = None):
    """Générer les visualisations."""
    if output_dir is None:
        output_dir = MODEL_DIR / MODEL_NAME
        output_dir.mkdir(exist_ok=True)
    
    print(f"\n📈 Génération des graphiques...")
    
    # Feature importance
    fig, ax = plt.subplots(figsize=(10, 6))
    top_features = importances.head(15)
    ax.barh(range(len(top_features)), top_features['importance'], color='#2E86AB')
    ax.set_yticks(range(len(top_features)))
    ax.set_yticklabels(top_features['feature'])
    ax.set_xlabel('Importance')
    ax.set_title('Top 15 Feature Importance - XGBoost')
    ax.invert_yaxis()
    plt.tight_layout()
    plt.savefig(output_dir / 'feature_importance.png', dpi=100)
    print(f"  ✓ feature_importance.png")
    
    # Confusion matrix
    fig, ax = plt.subplots(figsize=(8, 6))
    cm = confusion_matrix(y_test, y_pred)
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=ax)
    ax.set_title('Confusion Matrix - XGBoost')
    plt.tight_layout()
    plt.savefig(output_dir / 'confusion_matrix.png', dpi=100)
    print(f"  ✓ confusion_matrix.png")
    
    # Prediction distribution
    fig, ax = plt.subplots(figsize=(10, 6))
    ax.hist(y_pred_proba[y_test == 0], bins=30, alpha=0.6, label='No Churn', color='green')
    ax.hist(y_pred_proba[y_test == 1], bins=30, alpha=0.6, label='Churn', color='red')
    ax.set_xlabel('Probabilité de Churn')
    ax.set_ylabel('Fréquence')
    ax.set_title('Distribution des Probabilités - XGBoost')
    ax.legend()
    plt.tight_layout()
    plt.savefig(output_dir / 'prediction_distribution.png', dpi=100)
    print(f"  ✓ prediction_distribution.png")


def save_model(model: XGBClassifier, feature_names: list,
               metrics: dict, params: dict):
    """Sauvegarder le modèle."""
    print(f"\n💾 Sauvegarde du modèle...")
    
    model_dir = MODEL_DIR / MODEL_NAME
    model_dir.mkdir(exist_ok=True)
    
    # Modèle
    model.save_model(str(model_dir / "model.json"))
    print(f"  ✓ Modèle: model.json")
    
    # Aussi sauvegarder avec joblib pour compatibility
    joblib.dump(model, model_dir / "model.pkl")
    joblib.dump(feature_names, model_dir / "features.pkl")
    print(f"  ✓ Features: features.pkl")
    
    # Métadonnées
    import json
    metadata = {
        'model_name': MODEL_NAME,
        'algorithm': 'XGBoost',
        'trained_at': datetime.now().isoformat(),
        'best_iteration': int(model.best_iteration),
        'metrics': metrics,
        'parameters': params,
        'feature_count': len(feature_names),
        'features': feature_names
    }
    
    with open(model_dir / "metadata.json", 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"  ✓ Métadonnées: metadata.json")
    
    print(f"\n✓ Sauvegardé dans: {model_dir}")


def main(csv_path: str):
    """Pipeline complet."""
    print("=" * 60)
    print("🤖 XGBOOST CHURN PREDICTION - TRAINING")
    print("=" * 60)
    
    df = load_data(csv_path)
    df, target_col = preprocess_data(df)
    X, y, feature_names = feature_engineering(df, target_col)
    
    # Split: train (60%) + val (20%) + test (20%)
    X_temp, X_test, y_temp, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
    )
    X_train, X_val, y_train, y_val = train_test_split(
        X_temp, y_temp, test_size=VALIDATION_SIZE / (1 - TEST_SIZE), 
        random_state=RANDOM_STATE, stratify=y_temp
    )
    
    print(f"\n🔀 Split train/val/test:")
    print(f"  - Train: {X_train.shape}")
    print(f"  - Val:   {X_val.shape}")
    print(f"  - Test:  {X_test.shape}")
    
    model = train_model(X_train, y_train, X_val, y_val)
    metrics, y_pred, y_pred_proba, importances = evaluate_model(
        model, X_test, y_test, feature_names
    )
    
    plot_results(model, y_test, y_pred, y_pred_proba, importances)
    save_model(model, feature_names, metrics, XGBOOST_PARAMS)
    
    print("\n" + "=" * 60)
    print("✅ ENTRAÎNEMENT XGBOOST TERMINÉ!")
    print("=" * 60)
    
    return model, metrics


if __name__ == "__main__":
    from sklearn.datasets import make_classification
    
    print("⚠️  Créer un dataset d'exemple...")
    X, y = make_classification(n_samples=1000, n_features=20,
                               n_informative=15, n_redundant=5,
                               weights=[0.7, 0.3], random_state=42)
    
    df = pd.DataFrame(X, columns=[f'feature_{i}' for i in range(20)])
    df['Churn'] = y
    
    example_csv = Path(__file__).parent / "example_churn_data.csv"
    df.to_csv(example_csv, index=False)
    
    main(str(example_csv))
    example_csv.unlink()
