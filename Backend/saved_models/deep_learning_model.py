"""
CHURN PREDICTION -- DEEP LEARNING (TensorFlow/Keras)
Dataset : IBM Telco Customer Churn (Kaggle)

Saves to saved_models/deep_learning/:
  model.h5, scaler.pkl, features.pkl, metadata.json
"""

import kagglehub
import pandas as pd
import numpy as np
import joblib
import json
import warnings

from pathlib import Path
from datetime import datetime

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, classification_report
)

import tensorflow as tf
from tensorflow.keras import Sequential
from tensorflow.keras.layers import Dense, Dropout, BatchNormalization
from tensorflow.keras.callbacks import EarlyStopping

warnings.filterwarnings("ignore")

RANDOM_STATE = 42
TEST_SIZE = 0.2
OUTPUT_DIR = Path("saved_models/deep_learning")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# ── 1. LOAD ──────────────────────────────────────────────────────────────────
print("=" * 55)
print("  DEEP LEARNING -- CHURN PREDICTION")
print("=" * 55)

path = kagglehub.dataset_download("blastchar/telco-customer-churn")
df = pd.read_csv(f"{path}/WA_Fn-UseC_-Telco-Customer-Churn.csv")
print(f"Dataset : {df.shape[0]} clients, {df.shape[1]} colonnes")

# ── 2. CLEAN ─────────────────────────────────────────────────────────────────
df = df.drop(columns=["customerID"])
df["TotalCharges"] = pd.to_numeric(df["TotalCharges"], errors="coerce").fillna(0)

# ── 3. ENCODE ────────────────────────────────────────────────────────────────
categorical_cols = [
    "gender", "Partner", "Dependents", "PhoneService", "MultipleLines",
    "InternetService", "OnlineSecurity", "OnlineBackup", "DeviceProtection",
    "TechSupport", "StreamingTV", "StreamingMovies", "Contract",
    "PaperlessBilling", "PaymentMethod"
]
df = pd.get_dummies(df, columns=categorical_cols, drop_first=True)
df["Churn"] = LabelEncoder().fit_transform(df["Churn"])

# ── 4. SPLIT ─────────────────────────────────────────────────────────────────
X = df.drop(columns=["Churn"])
y = df["Churn"]
feature_names = list(X.columns)

X_temp, X_test, y_temp, y_test = train_test_split(
    X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
)
X_train, X_val, y_train, y_val = train_test_split(
    X_temp, y_temp, test_size=0.25, random_state=RANDOM_STATE, stratify=y_temp
)

# ── 5. SCALE ─────────────────────────────────────────────────────────────────
scaler = StandardScaler()
X_train_s = scaler.fit_transform(X_train)
X_val_s   = scaler.transform(X_val)
X_test_s  = scaler.transform(X_test)

# ── 6. BUILD MODEL ───────────────────────────────────────────────────────────
tf.random.set_seed(RANDOM_STATE)

model = Sequential([
    Dense(128, activation="relu", input_shape=(X_train_s.shape[1],)),
    BatchNormalization(),
    Dropout(0.3),
    Dense(64, activation="relu"),
    BatchNormalization(),
    Dropout(0.3),
    Dense(32, activation="relu"),
    Dropout(0.2),
    Dense(1, activation="sigmoid"),
])

model.compile(optimizer="adam", loss="binary_crossentropy", metrics=["accuracy"])
model.summary()

# ── 7. TRAIN ─────────────────────────────────────────────────────────────────
print("\nEntrainement...")
history = model.fit(
    X_train_s, y_train,
    validation_data=(X_val_s, y_val),
    epochs=100,
    batch_size=32,
    callbacks=[EarlyStopping(patience=10, restore_best_weights=True)],
    verbose=1,
)

# ── 8. EVALUATE ──────────────────────────────────────────────────────────────
y_pred_proba = model.predict(X_test_s, verbose=0).flatten()
y_pred = (y_pred_proba >= 0.5).astype(int)

metrics = {
    "accuracy":  float(accuracy_score(y_test, y_pred)),
    "precision": float(precision_score(y_test, y_pred)),
    "recall":    float(recall_score(y_test, y_pred)),
    "f1":        float(f1_score(y_test, y_pred)),
    "roc_auc":   float(roc_auc_score(y_test, y_pred_proba)),
}

print("\n" + "-" * 40)
print("RESULTATS -- DEEP LEARNING")
print("-" * 40)
for k, v in metrics.items():
    print(f"{k:10s}: {v:.2%}")
print("-" * 40)
print(classification_report(y_test, y_pred, target_names=["Actif", "Churn"]))

# ── 9. SAVE ───────────────────────────────────────────────────────────────────
model.save(OUTPUT_DIR / "model.h5")
joblib.dump(scaler, OUTPUT_DIR / "scaler.pkl")
joblib.dump(feature_names, OUTPUT_DIR / "features.pkl")

metadata = {
    "algorithm": "Deep Learning",
    "trained_at": datetime.now().isoformat(),
    "epochs_run": len(history.history["loss"]),
    "metrics": metrics,
}
with open(OUTPUT_DIR / "metadata.json", "w") as f:
    json.dump(metadata, f, indent=2)

print(f"\nModele sauvegarde dans : {OUTPUT_DIR}")
print("=" * 55)
print(f"ROC-AUC final : {metrics['roc_auc']:.2%}")
print("=" * 55)
