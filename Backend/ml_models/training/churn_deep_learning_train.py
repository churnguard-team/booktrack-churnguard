# backend/ml_models/training/churn_deep_learning_train.py

"""
CHURN PREDICTION -- DEEP LEARNING (MLP)
Dataset : IBM Telco Customer Churn (Kaggle)

Architecture : MLP 3 couches cachées
  Input → 128 → 64 → 32 → Output (sigmoid)
  BatchNorm + Dropout pour régularisation
  EarlyStopping pour éviter l'overfitting
"""

import kagglehub
import pandas as pd
import numpy as np
import joblib
import json
import warnings
import matplotlib.pyplot as plt
import seaborn as sns

from pathlib import Path
from datetime import datetime

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, confusion_matrix, classification_report
)

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers

warnings.filterwarnings("ignore")

# ======================================================
# CONFIGURATION
# ======================================================

RANDOM_STATE = 42
TEST_SIZE    = 0.2
VAL_SIZE     = 0.2
EPOCHS       = 100
BATCH_SIZE   = 32
PATIENCE     = 10          # EarlyStopping

OUTPUT_DIR = Path("saved_models/deep_learning")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

tf.random.set_seed(RANDOM_STATE)
np.random.seed(RANDOM_STATE)

# ======================================================
# ETAPE 1 -- CHARGEMENT
# ======================================================

print("=" * 55)
print("  DEEP LEARNING (MLP) -- CHURN PREDICTION")
print("=" * 55)

print("\nChargement de la dataset IBM Telco...")
path = kagglehub.dataset_download("blastchar/telco-customer-churn")
df   = pd.read_csv(f"{path}/WA_Fn-UseC_-Telco-Customer-Churn.csv")
print(f"Dataset chargee : {df.shape[0]} clients, {df.shape[1]} colonnes")

# ======================================================
# ETAPE 2 -- NETTOYAGE & ENCODAGE
# ======================================================

df = df.drop(columns=["customerID"])
df["TotalCharges"] = pd.to_numeric(df["TotalCharges"], errors="coerce").fillna(0)

categorical_cols = [
    "gender", "Partner", "Dependents", "PhoneService", "MultipleLines",
    "InternetService", "OnlineSecurity", "OnlineBackup", "DeviceProtection",
    "TechSupport", "StreamingTV", "StreamingMovies", "Contract",
    "PaperlessBilling", "PaymentMethod"
]
df = pd.get_dummies(df, columns=categorical_cols, drop_first=True)

le           = LabelEncoder()
df["Churn"]  = le.fit_transform(df["Churn"])

X             = df.drop(columns=["Churn"])
y             = df["Churn"]
feature_names = list(X.columns)
n_features    = X.shape[1]

print(f"Features : {n_features} | Churners : {y.sum()} ({y.mean():.1%})")

# ======================================================
# ETAPE 3 -- SPLITS + NORMALISATION
# ======================================================

X_temp, X_test, y_temp, y_test = train_test_split(
    X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
)
X_train, X_val, y_train, y_val = train_test_split(
    X_temp, y_temp,
    test_size=VAL_SIZE / (1 - TEST_SIZE),
    random_state=RANDOM_STATE, stratify=y_temp
)

# Le DL nécessite une normalisation
scaler  = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_val   = scaler.transform(X_val)
X_test  = scaler.transform(X_test)

print(f"Train : {X_train.shape[0]} | Val : {X_val.shape[0]} | Test : {X_test.shape[0]}")

# ======================================================
# ETAPE 4 -- ARCHITECTURE MLP
# ======================================================

print("\nConstruction du modele MLP...")

# Gestion du déséquilibre de classes
neg = (y_train == 0).sum()
pos = (y_train == 1).sum()
class_weight = {0: 1.0, 1: neg / pos}
print(f"Class weights : {class_weight}")

model = keras.Sequential([
    layers.Input(shape=(n_features,)),

    # Couche 1
    layers.Dense(128),
    layers.BatchNormalization(),
    layers.Activation("relu"),
    layers.Dropout(0.3),

    # Couche 2
    layers.Dense(64),
    layers.BatchNormalization(),
    layers.Activation("relu"),
    layers.Dropout(0.3),

    # Couche 3
    layers.Dense(32),
    layers.BatchNormalization(),
    layers.Activation("relu"),
    layers.Dropout(0.2),

    # Sortie
    layers.Dense(1, activation="sigmoid"),
])

model.compile(
    optimizer=keras.optimizers.Adam(learning_rate=0.001),
    loss="binary_crossentropy",
    metrics=["accuracy", keras.metrics.AUC(name="auc")],
)

model.summary()

# ======================================================
# ETAPE 5 -- ENTRAINEMENT
# ======================================================

print("\nEntrainement du MLP...")

callbacks = [
    keras.callbacks.EarlyStopping(
        monitor="val_auc", patience=PATIENCE,
        restore_best_weights=True, mode="max"
    ),
    keras.callbacks.ReduceLROnPlateau(
        monitor="val_loss", factor=0.5, patience=5, min_lr=1e-6
    ),
]

history = model.fit(
    X_train, y_train,
    validation_data=(X_val, y_val),
    epochs=EPOCHS,
    batch_size=BATCH_SIZE,
    class_weight=class_weight,
    callbacks=callbacks,
    verbose=1,
)

print(f"Entrainement termine a l'epoch {len(history.history['loss'])}")

# ======================================================
# ETAPE 6 -- EVALUATION
# ======================================================

print("\nEvaluation sur les donnees de test...")

y_proba = model.predict(X_test, verbose=0).flatten()
y_pred  = (y_proba >= 0.5).astype(int)

metrics = {
    "accuracy" : float(accuracy_score(y_test, y_pred)),
    "precision": float(precision_score(y_test, y_pred)),
    "recall"   : float(recall_score(y_test, y_pred)),
    "f1"       : float(f1_score(y_test, y_pred)),
    "roc_auc"  : float(roc_auc_score(y_test, y_proba)),
}

print("\n" + "-" * 40)
print("RESULTATS -- DEEP LEARNING (MLP)")
print("-" * 40)
print(f"Accuracy  : {metrics['accuracy']:.2%}")
print(f"Precision : {metrics['precision']:.2%}")
print(f"Recall    : {metrics['recall']:.2%}")
print(f"F1-Score  : {metrics['f1']:.2%}")
print(f"ROC-AUC   : {metrics['roc_auc']:.2%}")
print("-" * 40)
print(classification_report(y_test, y_pred, target_names=["Actif", "Churn"]))

# ======================================================
# ETAPE 7 -- VISUALISATIONS
# ======================================================

print("\nGeneration des graphiques...")

# Courbes d'apprentissage
fig, axes = plt.subplots(1, 2, figsize=(14, 5))

axes[0].plot(history.history["loss"],     label="Train Loss")
axes[0].plot(history.history["val_loss"], label="Val Loss")
axes[0].set_title("Loss")
axes[0].set_xlabel("Epoch")
axes[0].legend()
axes[0].grid(alpha=0.3)

axes[1].plot(history.history["auc"],     label="Train AUC")
axes[1].plot(history.history["val_auc"], label="Val AUC")
axes[1].set_title("ROC-AUC")
axes[1].set_xlabel("Epoch")
axes[1].legend()
axes[1].grid(alpha=0.3)

plt.suptitle("Deep Learning MLP -- Courbes d'apprentissage", fontsize=13)
plt.tight_layout()
plt.savefig(OUTPUT_DIR / "learning_curves.png", dpi=100)
plt.close()

# Matrice de confusion
cm = confusion_matrix(y_test, y_pred)
plt.figure(figsize=(7, 5))
sns.heatmap(cm, annot=True, fmt="d", cmap="Purples",
            xticklabels=["Actif", "Churn"],
            yticklabels=["Actif", "Churn"])
plt.title("Matrice de Confusion -- Deep Learning MLP")
plt.tight_layout()
plt.savefig(OUTPUT_DIR / "confusion_matrix.png", dpi=100)
plt.close()

print("  learning_curves.png sauvegarde")
print("  confusion_matrix.png sauvegarde")

# ======================================================
# ETAPE 8 -- SAUVEGARDE
# ======================================================

print("\nSauvegarde du modele...")

model.save(OUTPUT_DIR / "model.keras")
joblib.dump(scaler,        OUTPUT_DIR / "scaler.pkl")
joblib.dump(feature_names, OUTPUT_DIR / "features.pkl")

metadata = {
    "algorithm"  : "Deep Learning MLP",
    "trained_at" : datetime.now().isoformat(),
    "architecture": "Input→128→64→32→1(sigmoid)",
    "epochs_run" : len(history.history["loss"]),
    "batch_size" : BATCH_SIZE,
    "n_features" : n_features,
    "metrics"    : metrics,
}

with open(OUTPUT_DIR / "metadata.json", "w") as f:
    json.dump(metadata, f, indent=2)

print(f"Modele sauvegarde dans : {OUTPUT_DIR}/")
print("\n" + "=" * 55)
print("ENTRAINEMENT DEEP LEARNING TERMINE")
print(f"ROC-AUC final : {metrics['roc_auc']:.2%}")
print("=" * 55)
