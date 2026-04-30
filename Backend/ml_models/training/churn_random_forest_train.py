"""

  CHURN PREDICTION — RANDOM FOREST
  Dataset : IBM Telco Customer Churn (Kaggle)

CE QUE CE SCRIPT FAIT :
  1. Charge la dataset depuis Kaggle
  2. Nettoie et prépare les données
  3. Encode les colonnes texte en chiffres
  4. Divise en train/test
  5. Entraîne un modèle Random Forest
  6. Évalue les performances
  7. Affiche les facteurs qui causent le churn
  8. Sauvegarde le modèle pour l'utiliser plus tard
"""


#  IMPORTS — les bibliothèques dont on a besoin


import kagglehub                          # Pour télécharger la dataset depuis Kaggle
import pandas as pd                       # Pour manipuler les données (tableaux)
import numpy as np                        # Pour les calculs mathématiques
import joblib                             # Pour sauvegarder le modèle entraîné
import json                               # Pour sauvegarder les métriques en JSON
import warnings                           # Pour ignorer les avertissements inutiles
import matplotlib.pyplot as plt           # Pour tracer les graphiques
import seaborn as sns                     # Pour les graphiques stylisés (heatmap...)

from pathlib import Path                  # Pour gérer les chemins de fichiers
from datetime import datetime             # Pour horodater la sauvegarde du modèle

from sklearn.model_selection import train_test_split   # Pour diviser train/test
from sklearn.preprocessing import LabelEncoder          # Pour encoder Churn en 0/1
from sklearn.ensemble import RandomForestClassifier     # Notre algorithme principal
from sklearn.metrics import (
    accuracy_score,        # % de bonnes prédictions
    precision_score,       # Sur les churners prédits, combien sont vrais ?
    recall_score,          # Sur les vrais churners, combien on les a détectés ?
    f1_score,              # Moyenne harmonique de precision et recall
    roc_auc_score,         # Qualité globale du modèle (le plus important !)
    confusion_matrix,      # Tableau : vrais positifs, faux positifs, etc.
    classification_report  # Rapport complet des métriques
)

warnings.filterwarnings('ignore')  # On ignore les warnings pour garder la console propre


#  CONFIGURATION — paramètres du modèle

RANDOM_STATE = 42     # Graine aléatoire → résultats identiques à chaque run
TEST_SIZE    = 0.2    # 20% des données pour le test, 80% pour l'entraînement

# Paramètres du Random Forest
# n_estimators  : nombre d'arbres (plus = plus précis mais plus lent)
# max_depth      : profondeur max de chaque arbre (évite l'overfitting)
# min_samples_split : nb min d'exemples pour diviser un nœud
# min_samples_leaf  : nb min d'exemples dans une feuille finale
# n_jobs         : -1 = utilise tous les cœurs du processeur
RF_PARAMS = {
    'n_estimators'     : 100,
    'max_depth'        : 15,
    'min_samples_split': 10,
    'min_samples_leaf' : 5,
    'random_state'     : RANDOM_STATE,
    'n_jobs'           : -1
}

# Dossier où on va sauvegarder le modèle entraîné
OUTPUT_DIR = Path("saved_models/random_forest")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


#  ÉTAPE 1 — CHARGEMENT DES DONNÉES


print("=" * 55)
print("  RANDOM FOREST — CHURN PREDICTION")
print("=" * 55)

print("\n📥 Téléchargement de la dataset depuis Kaggle...")

# kagglehub télécharge automatiquement la dataset IBM Telco
# Cette dataset contient 7043 clients télécom avec 21 colonnes
path = kagglehub.dataset_download("blastchar/telco-customer-churn")
df   = pd.read_csv(f"{path}/WA_Fn-UseC_-Telco-Customer-Churn.csv")

print(f" Dataset chargée : {df.shape[0]} clients, {df.shape[1]} colonnes")


#  ÉTAPE 2 — NETTOYAGE DES DONNÉES


print("\n Nettoyage des données...")

# On supprime customerID car c'est juste un identifiant unique
# Le modèle n'a pas besoin de ça pour apprendre
df = df.drop(columns=['customerID'])

# TotalCharges est en format texte (string) dans cette dataset
# On la convertit en nombre décimal (float)
# errors='coerce' → les valeurs non convertibles deviennent NaN
df['TotalCharges'] = pd.to_numeric(df['TotalCharges'], errors='coerce')

# On remplace les NaN de TotalCharges par 0
# (clients avec 0 mois d'ancienneté n'ont pas encore été facturés)
df['TotalCharges'] = df['TotalCharges'].fillna(0)

print(f" Données nettoyées — Valeurs manquantes restantes : {df.isnull().sum().sum()}")


#  ÉTAPE 3 — ENCODAGE DES COLONNES TEXTE


print("\n  Encodage des variables catégorielles...")

# get_dummies transforme les colonnes texte en colonnes 0/1
# Exemple : ContractType [Month-to-Month, One-Year, Two-Year]
# Devient  : ContractType_Month-to-Month | ContractType_One-Year | ContractType_Two-Year
#            1                           | 0                     | 0
# drop_first=True supprime une colonne par groupe pour éviter la redondance
categorical_cols = [
    'gender', 'Partner', 'Dependents', 'PhoneService', 'MultipleLines',
    'InternetService', 'OnlineSecurity', 'OnlineBackup', 'DeviceProtection',
    'TechSupport', 'StreamingTV', 'StreamingMovies', 'Contract',
    'PaperlessBilling', 'PaymentMethod'
]
df = pd.get_dummies(df, columns=categorical_cols, drop_first=True)

# LabelEncoder pour la colonne cible Churn : Yes → 1, No → 0
le          = LabelEncoder()
df['Churn'] = le.fit_transform(df['Churn'])

print(f" Encodage terminé — Dataset finale : {df.shape[0]} lignes, {df.shape[1]} colonnes")
print(f"\n Distribution du Churn :")
print(df['Churn'].value_counts().rename({0: 'Actifs (0)', 1: 'Churners (1)'}))


#  ÉTAPE 4 — FEATURES ET TARGET


print("\n Préparation des features et de la cible...")

# X = toutes les colonnes sauf Churn → ce qu'on donne au modèle
# y = uniquement la colonne Churn   → ce que le modèle doit prédire
X = df.drop(columns=['Churn'])
y = df['Churn']

print(f" X (features) : {X.shape} | y (target) : {y.shape}")



#  ÉTAPE 5 — SPLIT TRAIN / TEST


print("\n Division Train / Test (80% / 20%)...")

# stratify=y garantit que la proportion de churners est
# la même dans le train et le test (important pour données déséquilibrées)
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size    = TEST_SIZE,
    random_state = RANDOM_STATE,
    stratify     = y           # ← garde le même ratio 73%/27% dans train et test
)

print(f"✅ Train : {X_train.shape[0]} exemples | Test : {X_test.shape[0]} exemples")


#  ÉTAPE  — ENTRAÎNEMENT DU MODÈLE

print("\n Entraînement du Random Forest...")
print(f"   → {RF_PARAMS['n_estimators']} arbres de décision")
print(f"   → Profondeur max : {RF_PARAMS['max_depth']}")

# On crée le modèle avec nos paramètres
rf_model = RandomForestClassifier(**RF_PARAMS)

# .fit() = phase d'apprentissage
# Le modèle construit 100 arbres en analysant X_train et y_train
rf_model.fit(X_train, y_train)

print(" Modèle entraîné !")


#  ÉTAPE 7 — ÉVALUATION DU MODÈLE


print("\n Évaluation sur les données de test...")

# predict()       → donne 0 ou 1 pour chaque client
# predict_proba() → donne la probabilité de churn (entre 0 et 1)
y_pred       = rf_model.predict(X_test)
y_pred_proba = rf_model.predict_proba(X_test)[:, 1]  # colonne 1 = prob de churn

# Calcul des métriques
metrics = {
    'accuracy' : accuracy_score(y_test, y_pred),
    'precision': precision_score(y_test, y_pred),
    'recall'   : recall_score(y_test, y_pred),
    'f1'       : f1_score(y_test, y_pred),
    'roc_auc'  : roc_auc_score(y_test, y_pred_proba)
}

print("\n" + "─" * 40)
print("  RÉSULTATS — RANDOM FOREST")
print("─" * 40)
# Accuracy  : % total de bonnes prédictions
# Precision : quand on dit "churn", on a raison X% du temps
# Recall    : on détecte X% des vrais churners
# F1        : équilibre entre precision et recall
# ROC-AUC   : 1.0 = parfait, 0.5 = aléatoire (le + important)
print(f"  Accuracy  : {metrics['accuracy']:.2%}")
print(f"  Precision : {metrics['precision']:.2%}")
print(f"  Recall    : {metrics['recall']:.2%}")
print(f"  F1-Score  : {metrics['f1']:.2%}")
print(f"  ROC-AUC   : {metrics['roc_auc']:.2%}  ← métrique principale")
print("─" * 40)

print("\n Rapport détaillé :")
print(classification_report(y_test, y_pred, target_names=['Actif', 'Churn']))


#  ÉTAPE 8 — VISUALISATIONS


print("\n Génération des graphiques...")

# ── Graphique 1 : Feature Importance ──────────
# Montre quelles colonnes influencent le plus la prédiction
importances = pd.DataFrame({
    'feature'   : X.columns,
    'importance': rf_model.feature_importances_
}).sort_values('importance', ascending=True).tail(15)  # Top 15

fig, ax = plt.subplots(figsize=(10, 7))
ax.barh(importances['feature'], importances['importance'], color='steelblue')
ax.set_xlabel('Importance')
ax.set_title('Top 15 Facteurs qui causent le Churn — Random Forest')
plt.tight_layout()
plt.savefig(OUTPUT_DIR / 'feature_importance.png', dpi=100)
plt.show()
print(" feature_importance.png sauvegardé")

# ── Graphique 2 : Confusion Matrix 
# Montre les vrais positifs, faux positifs, vrais négatifs, faux négatifs
cm = confusion_matrix(y_test, y_pred)

fig, ax = plt.subplots(figsize=(7, 5))
sns.heatmap(
    cm, annot=True, fmt='d', cmap='Blues', ax=ax,
    xticklabels=['Actif', 'Churn'],
    yticklabels=['Actif', 'Churn']
)
ax.set_xlabel('Prédiction')
ax.set_ylabel('Réalité')
ax.set_title('Confusion Matrix — Random Forest')
plt.tight_layout()
plt.savefig(OUTPUT_DIR / 'confusion_matrix.png', dpi=100)
plt.show()
print("  confusion_matrix.png sauvegardé")

# ── Graphique 3 : Distribution des probabilités ──
# Montre comment le modèle sépare les churners des non-churners
fig, ax = plt.subplots(figsize=(10, 5))
ax.hist(y_pred_proba[y_test == 0], bins=30, alpha=0.6, label='Actif',  color='green')
ax.hist(y_pred_proba[y_test == 1], bins=30, alpha=0.6, label='Churn',  color='red')
ax.set_xlabel('Probabilité de Churn prédite')
ax.set_ylabel('Nombre de clients')
ax.set_title('Distribution des Probabilités — Random Forest')
ax.legend()
plt.tight_layout()
plt.savefig(OUTPUT_DIR / 'prediction_distribution.png', dpi=100)
plt.show()
print("  prediction_distribution.png sauvegardé")


#  ÉTAPE 9 — SAUVEGARDE DU MODÈLE

print("\n Sauvegarde du modèle...")

# joblib.dump sauvegarde le modèle dans un fichier .pkl
# On pourra le recharger plus tard sans réentraîner
joblib.dump(rf_model, OUTPUT_DIR / 'model.pkl')
joblib.dump(list(X.columns), OUTPUT_DIR / 'features.pkl')

# On sauvegarde aussi les métriques en JSON pour comparer avec XGBoost plus tard
metadata = {
    'algorithm'    : 'Random Forest',
    'trained_at'   : datetime.now().isoformat(),
    'parameters'   : RF_PARAMS,
    'metrics'      : metrics,
    'feature_count': len(X.columns)
}
with open(OUTPUT_DIR / 'metadata.json', 'w') as f:
    json.dump(metadata, f, indent=2)

print(f" Modèle sauvegardé dans : {OUTPUT_DIR}/")
print(f"   → model.pkl       (modèle entraîné)")
print(f"   → features.pkl    (liste des colonnes)")
print(f"   → metadata.json   (métriques & paramètres)")

print("\n" + "=" * 55)
print("   ENTRAÎNEMENT TERMINÉ — RANDOM FOREST")
print(f"  ROC-AUC final : {metrics['roc_auc']:.2%}")
print("=" * 55)