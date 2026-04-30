# backend/ml_models/training/churn_xgboost_train.py

"""
  CHURN PREDICTION -- XGBOOST AUDITE
  Dataset : IBM Telco Customer Churn (Kaggle)
  Compatible : XGBoost 3.x + SHAP 0.49
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

warnings.filterwarnings('ignore')


# ======================================================
# CONFIGURATION
# ======================================================

RANDOM_STATE          = 42
TEST_SIZE             = 0.2
VALIDATION_SIZE       = 0.2
EARLY_STOPPING_ROUNDS = 20

XGB_PARAMS = {
    'n_estimators'         : 200,
    'max_depth'            : 7,
    'learning_rate'        : 0.1,
    'subsample'            : 0.8,
    'colsample_bytree'     : 0.8,
    'reg_alpha'            : 1,
    'reg_lambda'           : 1,
    'random_state'         : RANDOM_STATE,
    'eval_metric'          : 'logloss',
    'early_stopping_rounds': EARLY_STOPPING_ROUNDS
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
df   = pd.read_csv(f"{path}/WA_Fn-UseC_-Telco-Customer-Churn.csv")

print(f"Dataset chargee : {df.shape[0]} clients, {df.shape[1]} colonnes")


# ======================================================
# ETAPE 2 -- NETTOYAGE
# ======================================================

print("\nNettoyage des donnees...")

df = df.drop(columns=['customerID'])
df['TotalCharges'] = pd.to_numeric(df['TotalCharges'], errors='coerce')
df['TotalCharges'] = df['TotalCharges'].fillna(0)

print(f"Valeurs manquantes restantes : {df.isnull().sum().sum()}")


# ======================================================
# ETAPE 3 -- ENCODAGE
# ======================================================

print("\nEncodage des variables categorielles...")

categorical_cols = [
    'gender', 'Partner', 'Dependents', 'PhoneService', 'MultipleLines',
    'InternetService', 'OnlineSecurity', 'OnlineBackup', 'DeviceProtection',
    'TechSupport', 'StreamingTV', 'StreamingMovies', 'Contract',
    'PaperlessBilling', 'PaymentMethod'
]
df = pd.get_dummies(df, columns=categorical_cols, drop_first=True)

le          = LabelEncoder()
df['Churn'] = le.fit_transform(df['Churn'])

print(f"Dataset finale : {df.shape[0]} lignes, {df.shape[1]} colonnes")
print(f"\nDistribution du Churn :")
print(df['Churn'].value_counts().rename({0: 'Actifs (0)', 1: 'Churners (1)'}))


# ======================================================
# ETAPE 4 -- FEATURES ET TARGET
# ======================================================

X             = df.drop(columns=['Churn'])
y             = df['Churn']
feature_names = list(X.columns)

print(f"\nX (features) : {X.shape} | y (target) : {y.shape}")


# ======================================================
# ETAPE 5 -- SPLIT TRAIN / VALIDATION / TEST
# ======================================================

print("\nDivision Train / Validation / Test (60% / 20% / 20%)...")

X_temp, X_test, y_temp, y_test = train_test_split(
    X, y,
    test_size    = TEST_SIZE,
    random_state = RANDOM_STATE,
    stratify     = y
)

X_train, X_val, y_train, y_val = train_test_split(
    X_temp, y_temp,
    test_size    = VALIDATION_SIZE / (1 - TEST_SIZE),
    random_state = RANDOM_STATE,
    stratify     = y_temp
)

print(f"Train      : {X_train.shape[0]} exemples (60%)")
print(f"Validation : {X_val.shape[0]} exemples   (20%)")
print(f"Test       : {X_test.shape[0]} exemples   (20%)")


# ======================================================
# ETAPE 6 -- ENTRAINEMENT
# ======================================================

print("\nEntrainement du XGBoost...")
print(f"   -> Maximum {XGB_PARAMS['n_estimators']} arbres")
print(f"   -> Learning rate : {XGB_PARAMS['learning_rate']}")
print(f"   -> Early stopping apres {EARLY_STOPPING_ROUNDS} iterations sans amelioration")

xgb_model = XGBClassifier(**XGB_PARAMS)

xgb_model.fit(
    X_train, y_train,
    eval_set = [(X_val, y_val)],
    verbose  = False
)

print(f"Modele entraine ! (arrete a l'iteration : {xgb_model.best_iteration})")


# ======================================================
# ETAPE 7 -- EVALUATION
# ======================================================

print("\nEvaluation sur les donnees de test...")

y_pred       = xgb_model.predict(X_test)
y_pred_proba = xgb_model.predict_proba(X_test)[:, 1]

metrics = {
    'accuracy' : float(accuracy_score(y_test, y_pred)),
    'precision': float(precision_score(y_test, y_pred)),
    'recall'   : float(recall_score(y_test, y_pred)),
    'f1'       : float(f1_score(y_test, y_pred)),
    'roc_auc'  : float(roc_auc_score(y_test, y_pred_proba))
}

print("\n" + "-" * 40)
print("  RESULTATS -- XGBOOST AUDITE")
print("-" * 40)
print(f"  Accuracy  : {metrics['accuracy']:.2%}")
print(f"  Precision : {metrics['precision']:.2%}")
print(f"  Recall    : {metrics['recall']:.2%}")
print(f"  F1-Score  : {metrics['f1']:.2%}")
print(f"  ROC-AUC   : {metrics['roc_auc']:.2%}  <- metrique principale")
print("-" * 40)

print("\nRapport detaille :")
print(classification_report(y_test, y_pred, target_names=['Actif', 'Churn']))


# ======================================================
# ETAPE 8 -- AUDIT SHAP
#
# WORKAROUND XGBoost 3.x + SHAP 0.49 :
# XGBoost 3.x stocke base_score comme string '[2.65E-1]'
# on le convertit en float avant d'appeler TreeExplainer
# ======================================================

print("\nCalcul des SHAP values (audit du modele)...")

# Workaround : corriger base_score avant TreeExplainer
try:
    attrs      = xgb_model.get_booster().attrs()
    base_score = attrs.get('base_score', '0.5')
    # Nettoyer le format '[2.65E-1]' -> float
    base_score_clean = base_score.strip('[]')
    xgb_model.get_booster().attrs()['base_score'] = str(float(base_score_clean))
except Exception:
    pass  # si ca echoue on laisse SHAP essayer quand meme

explainer   = shap.TreeExplainer(xgb_model)
shap_values = explainer.shap_values(X_test)

# Normalisation : selon la version SHAP retourne
# une liste [class0, class1] ou un array direct
if isinstance(shap_values, list):
    shap_values    = shap_values[1]   # classe 1 = churn
    expected_value = float(explainer.expected_value[1])
else:
    expected_value = float(explainer.expected_value)

print(f"SHAP values calculees pour {X_test.shape[0]} clients")
print(f"Shape : {shap_values.shape}  (clients x variables)")


# ======================================================
# ETAPE 9 -- VISUALISATIONS
# ======================================================

print("\nGeneration des graphiques...")

# -- Graphique 1 : SHAP Summary Plot
# Chaque point = un client
# Position horizontale = valeur SHAP
# Couleur = valeur reelle de la variable
plt.figure(figsize=(12, 8))
shap.summary_plot(
    shap_values,
    X_test,
    feature_names = feature_names,
    show          = False
)
plt.title("SHAP Summary -- Impact de chaque variable sur le Churn")
plt.tight_layout()
plt.savefig(OUTPUT_DIR / 'shap_summary.png', dpi=100, bbox_inches='tight')
plt.show()
print("  shap_summary.png sauvegarde")

# -- Graphique 2 : SHAP Importance (barres)
plt.figure(figsize=(10, 7))
shap.summary_plot(
    shap_values,
    X_test,
    feature_names = feature_names,
    plot_type     = "bar",
    show          = False
)
plt.title("SHAP Importance -- Top variables qui expliquent le Churn")
plt.tight_layout()
plt.savefig(OUTPUT_DIR / 'shap_importance.png', dpi=100, bbox_inches='tight')
plt.show()
print("  shap_importance.png sauvegarde")

# -- Graphique 3 : Waterfall pour le client le plus a risque
client_index = np.argmax(y_pred_proba)

print(f"\nAudit du client le plus a risque (index {client_index}) :")
print(f"  Probabilite de churn : {y_pred_proba[client_index]:.2%}")
print(f"  Realite              : {'Churn' if y_test.iloc[client_index] == 1 else 'Actif'}")

plt.figure(figsize=(12, 6))
shap.waterfall_plot(
    shap.Explanation(
        values        = shap_values[client_index],
        base_values   = expected_value,
        data          = X_test.iloc[client_index].values,
        feature_names = feature_names
    ),
    show = False
)
plt.title(f"Audit Client {client_index} -- Pourquoi predit CHURN a {y_pred_proba[client_index]:.0%} ?")
plt.tight_layout()
plt.savefig(OUTPUT_DIR / 'shap_waterfall.png', dpi=100, bbox_inches='tight')
plt.show()
print("  shap_waterfall.png sauvegarde")

# -- Graphique 4 : Confusion Matrix
cm = confusion_matrix(y_test, y_pred)

fig, ax = plt.subplots(figsize=(7, 5))
sns.heatmap(
    cm, annot=True, fmt='d', cmap='Blues', ax=ax,
    xticklabels=['Actif', 'Churn'],
    yticklabels=['Actif', 'Churn']
)
ax.set_xlabel('Prediction')
ax.set_ylabel('Realite')
ax.set_title('Confusion Matrix -- XGBoost Audite')
plt.tight_layout()
plt.savefig(OUTPUT_DIR / 'confusion_matrix.png', dpi=100)
plt.show()
print("  confusion_matrix.png sauvegarde")

# -- Graphique 5 : Feature Importance native XGBoost
# En complement de SHAP -- importance basee sur
# le nombre de fois qu'une variable est utilisee
importances = pd.DataFrame({
    'feature'   : feature_names,
    'importance': xgb_model.feature_importances_
}).sort_values('importance', ascending=True).tail(15)

fig, ax = plt.subplots(figsize=(10, 7))
ax.barh(importances['feature'], importances['importance'], color='#2E86AB')
ax.set_xlabel('Importance')
ax.set_title('Top 15 Features -- XGBoost Native Importance')
plt.tight_layout()
plt.savefig(OUTPUT_DIR / 'feature_importance.png', dpi=100)
plt.show()
print("  feature_importance.png sauvegarde")


# ======================================================
# ETAPE 10 -- FONCTION AUDIT INDIVIDUEL
# Branchable directement sur le router FastAPI
# ======================================================

def audit_client(client_data: pd.DataFrame, top_n: int = 5) -> dict:
    """
    Explique la prediction de churn pour un client specifique.

    Parametres :
        client_data : DataFrame avec les features du client (1 ligne)
        top_n       : nombre de variables a afficher

    Retourne :
        dict avec probabilite de churn et top_n raisons
    """
    proba = xgb_model.predict_proba(client_data)[:, 1][0]

    sv = explainer.shap_values(client_data)
    client_shap = sv[1][0] if isinstance(sv, list) else sv[0]

    contributions = pd.DataFrame({
        'variable'    : feature_names,
        'contribution': client_shap
    }).reindex(
        pd.Series(np.abs(client_shap)).sort_values(ascending=False).index
    ).head(top_n)

    raisons = []
    for _, row in contributions.iterrows():
        raisons.append({
            'variable'    : row['variable'],
            'contribution': round(row['contribution'], 4),
            'sens'        : 'augmente le churn' if row['contribution'] > 0 else 'reduit le churn'
        })

    return {
        'churn_probability': round(float(proba), 4),
        'prediction'       : 'CHURNER' if proba > 0.5 else 'ACTIF',
        'top_raisons'      : raisons
    }


# Test sur le premier client du test set
print("\nTest de la fonction audit_client :")
resultat = audit_client(X_test.iloc[[0]])
print(f"  Prediction  : {resultat['prediction']}")
print(f"  Probabilite : {resultat['churn_probability']:.2%}")
print(f"  Top raisons :")
for r in resultat['top_raisons']:
    print(f"    {r['variable']:35s} : {r['contribution']:+.4f}  ({r['sens']})")


# ======================================================
# ETAPE 11 -- SAUVEGARDE
# ======================================================

print("\nSauvegarde du modele...")

joblib.dump(xgb_model,     OUTPUT_DIR / 'model.pkl')
joblib.dump(explainer,     OUTPUT_DIR / 'shap_explainer.pkl')
joblib.dump(feature_names, OUTPUT_DIR / 'features.pkl')

metadata = {
    'algorithm'      : 'XGBoost + SHAP (Audite)',
    'xgboost_version': '3.x',
    'shap_version'   : '0.49',
    'trained_at'     : datetime.now().isoformat(),
    'best_iteration' : int(xgb_model.best_iteration),
    'parameters'     : XGB_PARAMS,
    'metrics'        : metrics,
    'feature_count'  : len(feature_names),
    'audit_method'   : 'SHAP TreeExplainer + workaround XGBoost 3.x'
}
with open(OUTPUT_DIR / 'metadata.json', 'w') as f:
    json.dump(metadata, f, indent=2)

print(f"Modele sauvegarde dans : {OUTPUT_DIR}/")
print(f"  -> model.pkl           (modele entraine)")
print(f"  -> shap_explainer.pkl  (explainer SHAP)")
print(f"  -> features.pkl        (liste des colonnes)")
print(f"  -> metadata.json       (metriques & parametres)")

print("\n" + "=" * 55)
print("  ENTRAINEMENT TERMINE -- XGBOOST AUDITE")
print(f"  ROC-AUC final : {metrics['roc_auc']:.2%}")
print("=" * 55)