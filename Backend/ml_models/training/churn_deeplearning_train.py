"""
Training - Deep Learning Churn Prediction
==========================================
Script indépendant pour entraîner un modèle Deep Learning (TensorFlow/Keras).
"""

import pandas as pd
import numpy as np
import warnings
import joblib
from pathlib import Path
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report
)
import matplotlib.pyplot as plt
import seaborn as sns

try:
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers, callbacks
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    print("⚠️  TensorFlow non installé! Installer avec: pip install tensorflow")

warnings.filterwarnings('ignore')

# ── CONFIGURATION ──────────────────────────────────────────
MODEL_NAME = "deep_learning_churn"
MODEL_DIR = Path(__file__).parent.parent / "saved_models"
MODEL_DIR.mkdir(exist_ok=True)

RANDOM_STATE = 42
TEST_SIZE = 0.2
VALIDATION_SIZE = 0.2

NEURAL_NET_CONFIG = {
    'input_dim': None,  # À déterminer d'après les features
    'hidden_layers': [128, 64, 32],
    'dropout_rate': 0.3,
    'learning_rate': 0.001,
    'batch_size': 32,
    'epochs': 100,
    'early_stopping_patience': 15
}


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


def feature_engineering(df: pd.DataFrame, target_col: str) -> tuple[np.ndarray, np.ndarray, list]:
    """Préparer et normaliser les features."""
    print("\n⚙️  Feature Engineering...")
    
    X = df.drop(columns=[target_col])
    y = df[target_col]
    
    # One-Hot Encoding
    categorical_cols = X.select_dtypes(include=['object']).columns
    if len(categorical_cols) > 0:
        print(f"  - One-Hot Encoding: {list(categorical_cols)}")
        X = pd.get_dummies(X, columns=categorical_cols, drop_first=True)
    
    X = X.astype(float)
    feature_names = X.columns.tolist()
    
    print(f"  - Dimensions: X={X.shape}, y={y.shape}")
    
    return X.values, y.values, feature_names


def build_model(input_dim: int, config: dict) -> keras.Model:
    """Construire l'architecture du réseau de neurones."""
    print("\n🏗️  Construction du modèle...")
    
    model = keras.Sequential(name='ChurnDeepLearning')
    
    # Input + Hidden layers
    model.add(layers.Input(shape=(input_dim,)))
    
    for i, units in enumerate(config['hidden_layers']):
        model.add(layers.Dense(units, activation='relu', name=f'dense_{i+1}'))
        model.add(layers.BatchNormalization(name=f'batch_norm_{i+1}'))
        model.add(layers.Dropout(config['dropout_rate'], name=f'dropout_{i+1}'))
    
    # Output layer
    model.add(layers.Dense(1, activation='sigmoid', name='output'))
    
    # Compiler
    optimizer = keras.optimizers.Adam(learning_rate=config['learning_rate'])
    model.compile(
        optimizer=optimizer,
        loss='binary_crossentropy',
        metrics=['accuracy', keras.metrics.AUC(name='auc')]
    )
    
    print(f"✓ Modèle créé!")
    model.summary()
    
    return model


def train_model(model: keras.Model,
                X_train: np.ndarray, y_train: np.ndarray,
                X_val: np.ndarray, y_val: np.ndarray,
                config: dict) -> dict:
    """Entraîner le modèle."""
    print("\n🚀 Entraînement du modèle...")
    
    # Callbacks
    early_stop = callbacks.EarlyStopping(
        monitor='val_loss',
        patience=config['early_stopping_patience'],
        restore_best_weights=True,
        verbose=1
    )
    
    # Entraînement
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=config['epochs'],
        batch_size=config['batch_size'],
        callbacks=[early_stop],
        verbose=1
    )
    
    print(f"✓ Entraînement terminé!")
    
    return history


def evaluate_model(model: keras.Model,
                   X_test: np.ndarray, y_test: np.ndarray,
                   feature_names: list) -> dict:
    """Évaluer le modèle."""
    print("\n📊 Évaluation du modèle...")
    
    # Prédictions
    y_pred_proba = model.predict(X_test, verbose=0)
    y_pred = (y_pred_proba >= 0.5).astype(int).flatten()
    y_pred_proba = y_pred_proba.flatten()
    
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
    
    cm = confusion_matrix(y_test, y_pred)
    print(f"\n🎯 Confusion Matrix:")
    print(cm)
    
    metrics['confusion_matrix'] = cm.tolist()
    
    return metrics, y_pred, y_pred_proba


def plot_results(history: dict,
                y_test: np.ndarray, y_pred: np.ndarray, y_pred_proba: np.ndarray,
                output_dir: Path = None):
    """Générer les visualisations."""
    if output_dir is None:
        output_dir = MODEL_DIR / MODEL_NAME
        output_dir.mkdir(exist_ok=True)
    
    print(f"\n📈 Génération des graphiques...")
    
    # 1. Training history
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    
    # Loss
    axes[0].plot(history.history['loss'], label='Train Loss', linewidth=2)
    axes[0].plot(history.history['val_loss'], label='Val Loss', linewidth=2)
    axes[0].set_xlabel('Epoch')
    axes[0].set_ylabel('Loss')
    axes[0].set_title('Training & Validation Loss')
    axes[0].legend()
    axes[0].grid(True, alpha=0.3)
    
    # Accuracy
    axes[1].plot(history.history['accuracy'], label='Train Accuracy', linewidth=2)
    axes[1].plot(history.history['val_accuracy'], label='Val Accuracy', linewidth=2)
    axes[1].set_xlabel('Epoch')
    axes[1].set_ylabel('Accuracy')
    axes[1].set_title('Training & Validation Accuracy')
    axes[1].legend()
    axes[1].grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.savefig(output_dir / 'training_history.png', dpi=100)
    print(f"  ✓ training_history.png")
    
    # 2. Confusion Matrix
    fig, ax = plt.subplots(figsize=(8, 6))
    cm = confusion_matrix(y_test, y_pred)
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=ax)
    ax.set_title('Confusion Matrix - Deep Learning')
    plt.tight_layout()
    plt.savefig(output_dir / 'confusion_matrix.png', dpi=100)
    print(f"  ✓ confusion_matrix.png")
    
    # 3. Prediction Distribution
    fig, ax = plt.subplots(figsize=(10, 6))
    ax.hist(y_pred_proba[y_test == 0], bins=30, alpha=0.6, label='No Churn', color='green')
    ax.hist(y_pred_proba[y_test == 1], bins=30, alpha=0.6, label='Churn', color='red')
    ax.set_xlabel('Probabilité de Churn')
    ax.set_ylabel('Fréquence')
    ax.set_title('Distribution des Probabilités - Deep Learning')
    ax.legend()
    plt.tight_layout()
    plt.savefig(output_dir / 'prediction_distribution.png', dpi=100)
    print(f"  ✓ prediction_distribution.png")


def save_model(model: keras.Model, scaler: StandardScaler,
               feature_names: list, metrics: dict, config: dict):
    """Sauvegarder le modèle."""
    print(f"\n💾 Sauvegarde du modèle...")
    
    model_dir = MODEL_DIR / MODEL_NAME
    model_dir.mkdir(exist_ok=True)
    
    # Modèle Keras
    model.save(str(model_dir / "model.h5"))
    print(f"  ✓ Modèle: model.h5")
    
    # Scaler
    joblib.dump(scaler, model_dir / "scaler.pkl")
    print(f"  ✓ Scaler: scaler.pkl")
    
    # Features
    joblib.dump(feature_names, model_dir / "features.pkl")
    print(f"  ✓ Features: features.pkl")
    
    # Métadonnées
    import json
    metadata = {
        'model_name': MODEL_NAME,
        'algorithm': 'Deep Learning (TensorFlow/Keras)',
        'trained_at': datetime.now().isoformat(),
        'metrics': metrics,
        'architecture': {
            'input_dim': len(feature_names),
            'hidden_layers': config['hidden_layers'],
            'dropout_rate': config['dropout_rate'],
        },
        'feature_count': len(feature_names),
        'features': feature_names
    }
    
    with open(model_dir / "metadata.json", 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"  ✓ Métadonnées: metadata.json")
    
    print(f"\n✓ Sauvegardé dans: {model_dir}")


def main(csv_path: str):
    """Pipeline complet."""
    if not TF_AVAILABLE:
        print("❌ TensorFlow n'est pas installé!")
        return
    
    print("=" * 60)
    print("🤖 DEEP LEARNING CHURN PREDICTION - TRAINING")
    print("=" * 60)
    
    df = load_data(csv_path)
    df, target_col = preprocess_data(df)
    X, y, feature_names = feature_engineering(df, target_col)
    
    # Normaliser les features
    print("\n📊 Normalisation des features...")
    scaler = StandardScaler()
    X = scaler.fit_transform(X)
    print("✓ Features normalisées")
    
    # Split
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
    
    # Configuration
    config = NEURAL_NET_CONFIG.copy()
    config['input_dim'] = X_train.shape[1]
    
    # Construire et entraîner
    model = build_model(config['input_dim'], config)
    history = train_model(model, X_train, y_train, X_val, y_val, config)
    
    # Évaluer
    metrics, y_pred, y_pred_proba = evaluate_model(model, X_test, y_test, feature_names)
    
    # Visualiser
    plot_results(history, y_test, y_pred, y_pred_proba)
    
    # Sauvegarder
    save_model(model, scaler, feature_names, metrics, config)
    
    print("\n" + "=" * 60)
    print("✅ ENTRAÎNEMENT DEEP LEARNING TERMINÉ!")
    print("=" * 60)
    
    return model, metrics


if __name__ == "__main__":
    from sklearn.datasets import make_classification
    
    if TF_AVAILABLE:
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
