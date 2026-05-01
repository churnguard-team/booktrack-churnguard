# ml_models/training/logistic_regression.py

"""
  CHURN PREDICTION -- LOGISTIC REGRESSION
  Dataset : IBM Telco Customer Churn (Kaggle)

CE QUE CE SCRIPT FAIT :
  1. Charge la dataset depuis Kaggle
  2. Nettoie et prepare les donnees
  3. Encode les colonnes texte en chiffres
  4. Divise en train / test
  5. Entraine un modele de Regression Logistique
  6. Evalue les performances
  7. Affiche les coefficients (pourquoi le modele decide)
  8. Sauvegarde le modele pour l'utiliser plus tard

DIFFERENCE AVEC XGBOOST :
  - La Regression Logistique calcule une formule mathematique lineaire
  - Chaque variable a un coefficient fixe (positif = churn, negatif = reste)
  - Pas besoin de validation set car pas d'early stopping
  - On a donc 2 splits : train / test (comme Random Forest)
  - AVANTAGE PRINCIPAL : modele auditable, on peut expliquer chaque decision
"""

# IMPORTS

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

from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report
)

warnings.filterwarnings('ignore')



# CONFIGURATION

RANDOM_STATE = 42
TEST_SIZE    = 0.2

# Parametres de la Regression Logistique
#
# C               : inverse de la regularisation
#                   C petit  -> regularisation forte (modele simple)
#                   C grand  -> regularisation faible (modele complexe)
#                   On garde C=1.0 par defaut (bon equilibre)
#
# max_iter        : nombre max d'iterations pour que l'algorithme converge
#                   1000 est suffisant pour cette dataset
#
# class_weight    : 'balanced' -> compense le desequilibre churners/actifs
#                   sans ca, le modele ignore les churners (minorite)
#
# solver          : algorithme d'optimisation utilise en interne
#                   'lbfgs' est le meilleur choix pour des datasets moyennes
#
# penalty         : type de regularisation
#                   'l2' penalise les coefficients trop grands -> evite overfitting

LR_PARAMS = {
    'C'            : 1.0,
    'max_iter'     : 1000,
    'class_weight' : 'balanced',
    'solver'       : 'lbfgs',
    'penalty'      : 'l2',
    'random_state' : RANDOM_STATE
}

# CHANGEMENT :
# ancien path = saved_models/logistic_regression
# nouveau path adapte a ton execution depuis training/
OUTPUT_DIR = Path("ml_models/training/saved_models/logistic_regression")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# ======================================================
# ETAPE 1 -- CHARGEMENT DES DONNEES
# ======================================================

print("=" * 55)
print("  LOGISTIC REGRESSION -- CHURN PREDICTION")
print("=" * 55)

print("\nTelecharger la dataset depuis Kaggle...")

path = kagglehub.dataset_download("blastchar/telco-customer-churn")
df   = pd.read_csv(f"{path}/WA_Fn-UseC_-Telco-Customer-Churn.csv")

print(f"Dataset chargee : {df.shape[0]} clients, {df.shape[1]} colonnes")


# ======================================================
# ETAPE 2 -- NETTOYAGE DES DONNEES
# ======================================================

print("\nNettoyage des donnees...")

df = df.drop(columns=['customerID'])

df['TotalCharges'] = pd.to_numeric(df['TotalCharges'], errors='coerce')
df['TotalCharges'] = df['TotalCharges'].fillna(0)

print(f"Donnees nettoyees -- Valeurs manquantes restantes : {df.isnull().sum().sum()}")


# ======================================================
# ETAPE 3 -- ENCODAGE DES COLONNES TEXTE
# ======================================================

print("\nEncodage des variables categorielles...")

# Meme encodage que XGBoost pour garantir une comparaison juste
# Les deux modeles voient exactement les memes colonnes
categorical_cols = [
    'gender', 'Partner', 'Dependents', 'PhoneService', 'MultipleLines',
    'InternetService', 'OnlineSecurity', 'OnlineBackup', 'DeviceProtection',
    'TechSupport', 'StreamingTV', 'StreamingMovies', 'Contract',
    'PaperlessBilling', 'PaymentMethod'
]

df = pd.get_dummies(df, columns=categorical_cols, drop_first=True)

le          = LabelEncoder()
df['Churn'] = le.fit_transform(df['Churn'])

print(f"Encodage termine -- Dataset finale : {df.shape[0]} lignes, {df.shape[1]} colonnes")

print(f"\nDistribution du Churn :")
print(df['Churn'].value_counts().rename({0: 'Actifs (0)', 1: 'Churners (1)'}))


# ======================================================
# ETAPE 4 -- FEATURES ET TARGET
# ======================================================

print("\nPreparation des features et de la cible...")

X = df.drop(columns=['Churn'])
y = df['Churn']

print(f"X (features) : {X.shape} | y (target) : {y.shape}")


# ======================================================
# ETAPE 5 -- SPLIT TRAIN / TEST
# ======================================================

print("\nDivision Train / Test (80% / 20%)...")

X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=TEST_SIZE,
    random_state=RANDOM_STATE,
    stratify=y
)

print(f"Train : {X_train.shape[0]} exemples ({X_train.shape[0]/len(X)*100:.0f}%)")
print(f"Test  : {X_test.shape[0]} exemples ({X_test.shape[0]/len(X)*100:.0f}%)")


# ======================================================
# ETAPE 5b -- NORMALISATION
# ======================================================

print("\nNormalisation des features (StandardScaler)...")

scaler  = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test  = scaler.transform(X_test)

print("Normalisation terminee")


# ======================================================
# ETAPE 6 -- ENTRAINEMENT
# ======================================================

print("\nEntrainement de la Regression Logistique...")

lr_model = LogisticRegression(**LR_PARAMS)
lr_model.fit(X_train, y_train)

print("Modele entraine !")


# ======================================================
# ETAPE 7 -- EVALUATION
# ======================================================

print("\nEvaluation sur les donnees de test...")

y_pred       = lr_model.predict(X_test)
y_pred_proba = lr_model.predict_proba(X_test)[:, 1]

metrics = {
    'accuracy': accuracy_score(y_test, y_pred),
    'precision': precision_score(y_test, y_pred),
    'recall': recall_score(y_test, y_pred),
    'f1': f1_score(y_test, y_pred),
    'roc_auc': roc_auc_score(y_test, y_pred_proba)
}

cv_scores = cross_val_score(lr_model, X_train, y_train, cv=5, scoring='roc_auc')

print("\n" + "-" * 40)
print("  RESULTATS -- LOGISTIC REGRESSION")
print("-" * 40)
print(f"  Accuracy  : {metrics['accuracy']:.2%}")
print(f"  Precision : {metrics['precision']:.2%}")
print(f"  Recall    : {metrics['recall']:.2%}")
print(f"  F1-Score  : {metrics['f1']:.2%}")
print(f"  ROC-AUC   : {metrics['roc_auc']:.2%}")
print(f"  CV AUC    : {cv_scores.mean():.2%}")
print("-" * 40)

print("\nRapport detaille :")
print(classification_report(y_test, y_pred, target_names=['Actif', 'Churn']))


# ======================================================
# ETAPE 8 -- COEFFICIENTS
# ======================================================

print("\nCoefficients du modele (auditabilite) :")

coefficients = pd.DataFrame({
    'feature': X.columns,
    'coefficient': lr_model.coef_[0]
}).sort_values('coefficient', ascending=False)

print("\nTop 5 variables qui AUGMENTENT le churn :")
print(coefficients.head(5).to_string(index=False))

print("\nTop 5 variables qui REDUISENT le churn :")
print(coefficients.tail(5).to_string(index=False))


# ======================================================
# ETAPE 9 -- VISUALISATIONS
# ======================================================

print("\nGeneration des graphiques...")

top_coef = pd.concat([coefficients.head(10), coefficients.tail(10)])
colors = ['red' if c > 0 else 'green' for c in top_coef['coefficient']]

fig, ax = plt.subplots(figsize=(10, 8))
ax.barh(top_coef['feature'], top_coef['coefficient'], color=colors)
ax.axvline(x=0, color='black')
ax.set_title("Impact des variables sur le Churn")
plt.tight_layout()
plt.savefig(OUTPUT_DIR / "coefficients.png", dpi=100)
plt.show()

cm = confusion_matrix(y_test, y_pred)

fig, ax = plt.subplots(figsize=(7, 5))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=ax)
plt.tight_layout()
plt.savefig(OUTPUT_DIR / "confusion_matrix.png", dpi=100)
plt.show()


# ======================================================
# ETAPE 10 -- SAUVEGARDE
# ======================================================

print("\nSauvegarde du modele...")

joblib.dump(lr_model, OUTPUT_DIR / "model.pkl")
joblib.dump(scaler, OUTPUT_DIR / "scaler.pkl")
joblib.dump(list(X.columns), OUTPUT_DIR / "features.pkl")

metadata = {
    'algorithm': 'Logistic Regression',
    'trained_at': datetime.now().isoformat(),
    'parameters': LR_PARAMS,
    'metrics': metrics
}

with open(OUTPUT_DIR / "metadata.json", "w") as f:
    json.dump(metadata, f, indent=2)

print(f"Modele sauvegarde dans : {OUTPUT_DIR}/")

print("\n" + "=" * 55)
print("  ENTRAINEMENT TERMINE -- LOGISTIC REGRESSION")
print(f"  ROC-AUC final : {metrics['roc_auc']:.2%}")
print("=" * 55)