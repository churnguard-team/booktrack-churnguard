# backend/ml_models/training/churn_xgboost_train.py

"""
CHURN PREDICTION -- XGBOOST AUDITE
Dataset : IBM Telco Customer Churn (Kaggle)

FIXED VERSION:
- XGBoost 2.1.4
- SHAP 0.48.0
- No base_score crash
- No shap_values NameError
- Safe fallback if SHAP fails
"""

import kagglehub
import pandas as pd
import numpy as np
import joblib
import json
import warnings
import matplotlib.pyplot as plt
import seaborn as sns
import shap

from pathlib import Path
from datetime import datetime

from xgboost import XGBClassifier

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report
)

warnings.filterwarnings("ignore")

# ======================================================
# CONFIGURATION
# ======================================================

RANDOM_STATE = 42
TEST_SIZE = 0.2
VALIDATION_SIZE = 0.2
EARLY_STOPPING_ROUNDS = 20

XGB_PARAMS = {
    "n_estimators": 200,
    "max_depth": 7,
    "learning_rate": 0.1,
    "subsample": 0.8,
    "colsample_bytree": 0.8,
    "reg_alpha": 1,
    "reg_lambda": 1,
    "random_state": RANDOM_STATE,
    "eval_metric": "logloss",
    "early_stopping_rounds": EARLY_STOPPING_ROUNDS
}

OUTPUT_DIR = Path("saved_models/xgboost")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# ======================================================
# ETAPE 1 -- CHARGEMENT
# ======================================================

print("=" * 55)
print("  XGBOOST AUDITE -- CHURN PREDICTION")
print("=" * 55)

print("\nTelecharger la dataset depuis Kaggle...")

path = kagglehub.dataset_download("blastchar/telco-customer-churn")
df = pd.read_csv(f"{path}/WA_Fn-UseC_-Telco-Customer-Churn.csv")

print(f"Dataset chargee : {df.shape[0]} clients, {df.shape[1]} colonnes")

# ======================================================
# ETAPE 2 -- NETTOYAGE
# ======================================================

print("\nNettoyage des donnees...")

df = df.drop(columns=["customerID"])
df["TotalCharges"] = pd.to_numeric(df["TotalCharges"], errors="coerce")
df["TotalCharges"] = df["TotalCharges"].fillna(0)

print(f"Valeurs manquantes restantes : {df.isnull().sum().sum()}")

# ======================================================
# ETAPE 3 -- ENCODAGE
# ======================================================

print("\nEncodage des variables categorielles...")

categorical_cols = [
    "gender", "Partner", "Dependents", "PhoneService", "MultipleLines",
    "InternetService", "OnlineSecurity", "OnlineBackup", "DeviceProtection",
    "TechSupport", "StreamingTV", "StreamingMovies", "Contract",
    "PaperlessBilling", "PaymentMethod"
]

df = pd.get_dummies(df, columns=categorical_cols, drop_first=True)

le = LabelEncoder()
df["Churn"] = le.fit_transform(df["Churn"])

print(f"Dataset finale : {df.shape[0]} lignes, {df.shape[1]} colonnes")

print("\nDistribution du Churn :")
print(df["Churn"].value_counts().rename({0: "Actifs (0)", 1: "Churners (1)"}))

# ======================================================
# ETAPE 4 -- FEATURES / TARGET
# ======================================================

X = df.drop(columns=["Churn"])
y = df["Churn"]
feature_names = list(X.columns)

print(f"\nX (features) : {X.shape} | y (target) : {y.shape}")

# ======================================================
# ETAPE 5 -- SPLIT
# ======================================================

print("\nDivision Train / Validation / Test (60% / 20% / 20%)...")

X_temp, X_test, y_temp, y_test = train_test_split(
    X, y,
    test_size=TEST_SIZE,
    random_state=RANDOM_STATE,
    stratify=y
)

X_train, X_val, y_train, y_val = train_test_split(
    X_temp, y_temp,
    test_size=VALIDATION_SIZE / (1 - TEST_SIZE),
    random_state=RANDOM_STATE,
    stratify=y_temp
)

print(f"Train      : {X_train.shape[0]} exemples")
print(f"Validation : {X_val.shape[0]} exemples")
print(f"Test       : {X_test.shape[0]} exemples")

# ======================================================
# ETAPE 6 -- TRAIN
# ======================================================

print("\nEntrainement du XGBoost...")

xgb_model = XGBClassifier(**XGB_PARAMS)

xgb_model.fit(
    X_train,
    y_train,
    eval_set=[(X_val, y_val)],
    verbose=False
)

print(f"Modele entraine ! (iteration : {xgb_model.best_iteration})")

# ======================================================
# ETAPE 7 -- EVALUATION
# ======================================================

print("\nEvaluation sur les donnees de test...")

y_pred = xgb_model.predict(X_test)
y_pred_proba = xgb_model.predict_proba(X_test)[:, 1]

metrics = {
    "accuracy": float(accuracy_score(y_test, y_pred)),
    "precision": float(precision_score(y_test, y_pred)),
    "recall": float(recall_score(y_test, y_pred)),
    "f1": float(f1_score(y_test, y_pred)),
    "roc_auc": float(roc_auc_score(y_test, y_pred_proba))
}

print("\n" + "-" * 40)
print("RESULTATS -- XGBOOST")
print("-" * 40)
print(f"Accuracy  : {metrics['accuracy']:.2%}")
print(f"Precision : {metrics['precision']:.2%}")
print(f"Recall    : {metrics['recall']:.2%}")
print(f"F1-Score  : {metrics['f1']:.2%}")
print(f"ROC-AUC   : {metrics['roc_auc']:.2%}")
print("-" * 40)

print("\nRapport detaille :")
print(classification_report(y_test, y_pred, target_names=["Actif", "Churn"]))

# ======================================================
# ETAPE 8 -- SHAP FIXED
# ======================================================

print("\nCalcul des SHAP values (audit du modele)...")

shap_ok = False
shap_values = None
expected_value = 0.0
explainer = None

try:
    booster = xgb_model.get_booster()

    attrs = booster.attributes()

    if "base_score" in attrs:
        raw = attrs["base_score"].strip("[]")
        booster.set_attr(base_score=str(float(raw)))

    explainer = shap.TreeExplainer(booster)

    shap_values = explainer.shap_values(X_test)

    if isinstance(shap_values, list):
        shap_values = shap_values[1]
        expected_value = float(explainer.expected_value[1])
    else:
        expected_value = float(explainer.expected_value)

    shap_ok = True

    print(f"SHAP values calculees : {shap_values.shape}")

except Exception as e:
    print("SHAP desactive :", e)

# ======================================================
# ETAPE 9 -- VISUALISATIONS
# ======================================================

print("\nGeneration des graphiques...")

if shap_ok:

    plt.figure(figsize=(12, 8))
    shap.summary_plot(
        shap_values,
        X_test,
        feature_names=feature_names,
        show=False
    )
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / "shap_summary.png", dpi=100)
    plt.close()

cm = confusion_matrix(y_test, y_pred)

plt.figure(figsize=(7, 5))
sns.heatmap(
    cm,
    annot=True,
    fmt="d",
    cmap="Blues",
    xticklabels=["Actif", "Churn"],
    yticklabels=["Actif", "Churn"]
)
plt.tight_layout()
plt.savefig(OUTPUT_DIR / "confusion_matrix.png", dpi=100)
plt.close()

importances = pd.DataFrame({
    "feature": feature_names,
    "importance": xgb_model.feature_importances_
}).sort_values("importance", ascending=True).tail(15)

plt.figure(figsize=(10, 7))
plt.barh(importances["feature"], importances["importance"])
plt.tight_layout()
plt.savefig(OUTPUT_DIR / "feature_importance.png", dpi=100)
plt.close()

# ======================================================
# ETAPE 10 -- SAVE
# ======================================================

print("\nSauvegarde du modele...")

joblib.dump(xgb_model, OUTPUT_DIR / "model.pkl")
joblib.dump(feature_names, OUTPUT_DIR / "features.pkl")

metadata = {
    "algorithm": "XGBoost Fixed",
    "trained_at": datetime.now().isoformat(),
    "best_iteration": int(xgb_model.best_iteration),
    "metrics": metrics,
    "shap_enabled": shap_ok
}

with open(OUTPUT_DIR / "metadata.json", "w") as f:
    json.dump(metadata, f, indent=2)

print(f"Modele sauvegarde dans : {OUTPUT_DIR}")

print("\n" + "=" * 55)
print("ENTRAINEMENT TERMINE")
print(f"ROC-AUC final : {metrics['roc_auc']:.2%}")
print("=" * 55)