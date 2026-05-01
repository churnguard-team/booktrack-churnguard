# backend/ml_models/training/compare_churn_models.py

"""
  COMPARAISON DES 3 MODELES DE CHURN
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
import matplotlib.gridspec as gridspec
import seaborn as sns

from pathlib import Path
from datetime import datetime

from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier

from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report,
    roc_curve
)

warnings.filterwarnings('ignore')


# ======================================================
# CONFIGURATION
# ======================================================

RANDOM_STATE          = 42
TEST_SIZE             = 0.2
VALIDATION_SIZE       = 0.2
EARLY_STOPPING_ROUNDS = 20

OUTPUT_DIR = Path("saved_models/comparison")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# ======================================================
# ETAPE 1 -- CHARGEMENT ET PREPARATION
# ======================================================

print("=" * 60)
print("  COMPARAISON DES 3 MODELES DE CHURN")
print("=" * 60)

print("\nChargement de la dataset IBM Telco...")

path = kagglehub.dataset_download("blastchar/telco-customer-churn")
df   = pd.read_csv(f"{path}/WA_Fn-UseC_-Telco-Customer-Churn.csv")

print(f"Dataset chargee : {df.shape[0]} clients, {df.shape[1]} colonnes")

# Nettoyage
df = df.drop(columns=['customerID'])
df['TotalCharges'] = pd.to_numeric(df['TotalCharges'], errors='coerce')
df['TotalCharges'] = df['TotalCharges'].fillna(0)

# Encodage
categorical_cols = [
    'gender', 'Partner', 'Dependents', 'PhoneService', 'MultipleLines',
    'InternetService', 'OnlineSecurity', 'OnlineBackup', 'DeviceProtection',
    'TechSupport', 'StreamingTV', 'StreamingMovies', 'Contract',
    'PaperlessBilling', 'PaymentMethod'
]
df = pd.get_dummies(df, columns=categorical_cols, drop_first=True)

le          = LabelEncoder()
df['Churn'] = le.fit_transform(df['Churn'])

X             = df.drop(columns=['Churn'])
y             = df['Churn']
feature_names = list(X.columns)

print(f"Dataset preparee : {X.shape[0]} lignes, {X.shape[1]} features")
print(f"Churners : {y.sum()} ({y.mean():.1%}) | Actifs : {(y==0).sum()} ({(y==0).mean():.1%})")


# ======================================================
# ETAPE 2 -- SPLITS
# ======================================================

print("\nDivision des donnees...")

# Split principal identique pour les 3 modeles
X_train_raw, X_test_raw, y_train, y_test = train_test_split(
    X, y,
    test_size    = TEST_SIZE,
    random_state = RANDOM_STATE,
    stratify     = y
)

# Split validation pour XGBoost uniquement
X_train_xgb, X_val, y_train_xgb, y_val = train_test_split(
    X_train_raw, y_train,
    test_size    = VALIDATION_SIZE / (1 - TEST_SIZE),
    random_state = RANDOM_STATE,
    stratify     = y_train
)

# Normalisation pour Logistic Regression uniquement
scaler     = StandardScaler()
X_train_lr = scaler.fit_transform(X_train_raw)
X_test_lr  = scaler.transform(X_test_raw)

# Random Forest et XGBoost utilisent les donnees brutes
X_train_rf  = X_train_raw
X_test_rf   = X_test_raw
X_test_xgb  = X_test_raw

print(f"Train      : {X_train_raw.shape[0]} exemples")
print(f"Validation : {X_val.shape[0]} exemples (XGBoost uniquement)")
print(f"Test       : {X_test_raw.shape[0]} exemples")


# ======================================================
# ETAPE 3 -- ENTRAINEMENT DES 3 MODELES
# ======================================================

print("\n" + "-" * 60)
print("  ENTRAINEMENT DES 3 MODELES")
print("-" * 60)

# -- Modele 1 : Logistic Regression
print("\n[1/3] Logistic Regression...")
lr_model = LogisticRegression(
    C            = 1.0,
    max_iter     = 1000,
    class_weight = 'balanced',
    solver       = 'lbfgs',
    random_state = RANDOM_STATE
)
lr_model.fit(X_train_lr, y_train)
print("      Logistic Regression entraine")

# -- Modele 2 : Random Forest
print("\n[2/3] Random Forest...")
rf_model = RandomForestClassifier(
    n_estimators = 200,
    max_depth    = 10,
    class_weight = 'balanced',
    random_state = RANDOM_STATE,
    n_jobs       = -1
)
rf_model.fit(X_train_rf, y_train)
print("      Random Forest entraine")

# -- Modele 3 : XGBoost 3.x
print("\n[3/3] XGBoost...")
xgb_model = XGBClassifier(
    n_estimators         = 200,
    max_depth            = 7,
    learning_rate        = 0.1,
    subsample            = 0.8,
    colsample_bytree     = 0.8,
    reg_alpha            = 1,
    reg_lambda           = 1,
    random_state         = RANDOM_STATE,
    eval_metric          = 'logloss',
    early_stopping_rounds= EARLY_STOPPING_ROUNDS   # dans constructeur pour 3.x
)
xgb_model.fit(
    X_train_xgb, y_train_xgb,
    eval_set = [(X_val, y_val)],
    verbose  = False
)
print(f"      XGBoost entraine (arrete a l'iteration {xgb_model.best_iteration})")


# ======================================================
# ETAPE 4 -- EVALUATION DES 3 MODELES
# ======================================================

print("\n" + "-" * 60)
print("  EVALUATION DES 3 MODELES")
print("-" * 60)

def compute_metrics(model, X_test, y_test, model_name):
    y_pred       = model.predict(X_test)
    y_pred_proba = model.predict_proba(X_test)[:, 1]

    metrics = {
        'model'    : model_name,
        'accuracy' : float(accuracy_score(y_test, y_pred)),
        'precision': float(precision_score(y_test, y_pred)),
        'recall'   : float(recall_score(y_test, y_pred)),
        'f1'       : float(f1_score(y_test, y_pred)),
        'roc_auc'  : float(roc_auc_score(y_test, y_pred_proba))
    }

    print(f"\n  {model_name}")
    print(f"    Accuracy  : {metrics['accuracy']:.2%}")
    print(f"    Precision : {metrics['precision']:.2%}")
    print(f"    Recall    : {metrics['recall']:.2%}")
    print(f"    F1-Score  : {metrics['f1']:.2%}")
    print(f"    ROC-AUC   : {metrics['roc_auc']:.2%}")

    return metrics, y_pred, y_pred_proba

metrics_lr,  y_pred_lr,  y_proba_lr  = compute_metrics(lr_model,  X_test_lr,  y_test, "Logistic Regression")
metrics_rf,  y_pred_rf,  y_proba_rf  = compute_metrics(rf_model,  X_test_rf,  y_test, "Random Forest")
metrics_xgb, y_pred_xgb, y_proba_xgb = compute_metrics(xgb_model, X_test_xgb, y_test, "XGBoost")

all_metrics = [metrics_lr, metrics_rf, metrics_xgb]
df_metrics  = pd.DataFrame(all_metrics).set_index('model')

print("\n\nTableau de comparaison complet :")
print(df_metrics.round(4).to_string())


# ======================================================
# ETAPE 5 -- MEILLEUR MODELE
# ======================================================

best_model_name = df_metrics['roc_auc'].idxmax()
best_auc        = df_metrics['roc_auc'].max()

print("\n" + "=" * 60)
print(f"  MEILLEUR MODELE : {best_model_name}")
print(f"  ROC-AUC         : {best_auc:.2%}")
print("=" * 60)


# ======================================================
# ETAPE 6 -- VISUALISATIONS
# ======================================================

print("\nGeneration des graphiques de comparaison...")

models       = ['Logistic\nRegression', 'Random\nForest', 'XGBoost']
colors       = ['#4C72B0', '#55A868', '#C44E52']
metric_keys  = ['accuracy', 'precision', 'recall', 'f1', 'roc_auc']
metric_labels= ['Accuracy', 'Precision', 'Recall', 'F1-Score', 'ROC-AUC']

# -- Graphique 1 : Barres groupees toutes metriques
fig, ax = plt.subplots(figsize=(14, 6))

x     = np.arange(len(metric_labels))
width = 0.25

for i, (metrics, color, model) in enumerate(zip(
    [metrics_lr, metrics_rf, metrics_xgb], colors, models
)):
    vals = [metrics[k] for k in metric_keys]
    bars = ax.bar(x + i * width, vals, width,
                  label=model.replace('\n', ' '),
                  color=color, alpha=0.85)

    for bar, val in zip(bars, vals):
        ax.text(
            bar.get_x() + bar.get_width() / 2,
            bar.get_height() + 0.005,
            f'{val:.2%}',
            ha='center', va='bottom', fontsize=7.5
        )

ax.set_xlabel('Metrique')
ax.set_ylabel('Score')
ax.set_title('Comparaison des 3 Modeles de Churn -- Toutes Metriques')
ax.set_xticks(x + width)
ax.set_xticklabels(metric_labels)
ax.set_ylim(0, 1.12)
ax.legend()
ax.grid(axis='y', alpha=0.3)
plt.tight_layout()
plt.savefig(OUTPUT_DIR / 'comparison_metrics.png', dpi=100)
plt.show()
print("  comparison_metrics.png sauvegarde")

# -- Graphique 2 : Courbes ROC
fig, ax = plt.subplots(figsize=(8, 6))

for y_proba, color, name, metrics in zip(
    [y_proba_lr, y_proba_rf, y_proba_xgb],
    colors,
    ['Logistic Regression', 'Random Forest', 'XGBoost'],
    [metrics_lr, metrics_rf, metrics_xgb]
):
    fpr, tpr, _ = roc_curve(y_test, y_proba)
    ax.plot(fpr, tpr, color=color, lw=2,
            label=f"{name} (AUC = {metrics['roc_auc']:.3f})")

ax.plot([0, 1], [0, 1], 'k--', lw=1, label='Aleatoire (AUC = 0.500)')
ax.set_xlabel('Taux de Faux Positifs')
ax.set_ylabel('Taux de Vrais Positifs')
ax.set_title('Courbes ROC -- Comparaison des 3 Modeles')
ax.legend(loc='lower right')
ax.grid(alpha=0.3)
plt.tight_layout()
plt.savefig(OUTPUT_DIR / 'comparison_roc_curves.png', dpi=100)
plt.show()
print("  comparison_roc_curves.png sauvegarde")

# -- Graphique 3 : Matrices de confusion cote a cote
fig, axes = plt.subplots(1, 3, figsize=(16, 5))

for ax, y_pred, name, color in zip(
    axes,
    [y_pred_lr, y_pred_rf, y_pred_xgb],
    ['Logistic Regression', 'Random Forest', 'XGBoost'],
    colors
):
    cm = confusion_matrix(y_test, y_pred)
    sns.heatmap(
        cm, annot=True, fmt='d', ax=ax,
        cmap=sns.light_palette(color, as_cmap=True),
        xticklabels=['Actif', 'Churn'],
        yticklabels=['Actif', 'Churn']
    )
    ax.set_title(f'{name}')
    ax.set_xlabel('Prediction')
    ax.set_ylabel('Realite')

plt.suptitle('Matrices de Confusion -- Comparaison des 3 Modeles', fontsize=13, y=1.02)
plt.tight_layout()
plt.savefig(OUTPUT_DIR / 'comparison_confusion_matrices.png', dpi=100, bbox_inches='tight')
plt.show()
print("  comparison_confusion_matrices.png sauvegarde")

# -- Graphique 4 : Radar Chart
categories = ['Accuracy', 'Precision', 'Recall', 'F1', 'ROC-AUC']
N          = len(categories)
angles     = [n / float(N) * 2 * np.pi for n in range(N)]
angles    += angles[:1]

fig, ax = plt.subplots(figsize=(8, 8), subplot_kw=dict(polar=True))

for metrics, color, name in zip(
    [metrics_lr, metrics_rf, metrics_xgb],
    colors,
    ['Logistic Regression', 'Random Forest', 'XGBoost']
):
    values  = [metrics[k] for k in ['accuracy', 'precision', 'recall', 'f1', 'roc_auc']]
    values += values[:1]

    ax.plot(angles, values, 'o-', linewidth=2, color=color, label=name)
    ax.fill(angles, values, alpha=0.1, color=color)

ax.set_xticks(angles[:-1])
ax.set_xticklabels(categories, size=11)
ax.set_ylim(0, 1)
ax.set_title('Radar Chart -- Performance Globale des 3 Modeles', size=13, pad=20)
ax.legend(loc='upper right', bbox_to_anchor=(1.3, 1.1))
ax.grid(True)
plt.tight_layout()
plt.savefig(OUTPUT_DIR / 'comparison_radar.png', dpi=100, bbox_inches='tight')
plt.show()
print("  comparison_radar.png sauvegarde")

# -- Graphique 5 : Tableau visuel recap
fig, ax = plt.subplots(figsize=(10, 4))
ax.axis('off')

table_data = [
    [f"{metrics_lr[k]:.2%}"  for k in metric_keys],
    [f"{metrics_rf[k]:.2%}"  for k in metric_keys],
    [f"{metrics_xgb[k]:.2%}" for k in metric_keys],
]

table = ax.table(
    cellText    = table_data,
    rowLabels   = ['Logistic Regression', 'Random Forest', 'XGBoost'],
    colLabels   = metric_labels,
    cellLoc     = 'center',
    loc         = 'center'
)
table.auto_set_font_size(False)
table.set_fontsize(11)
table.scale(1.2, 2)

# Colorier la meilleure valeur de chaque colonne en vert
for col_idx, key in enumerate(metric_keys):
    vals      = [metrics_lr[key], metrics_rf[key], metrics_xgb[key]]
    best_row  = np.argmax(vals)
    table[(best_row + 1, col_idx)].set_facecolor('#90EE90')

# Colorier les headers
for col_idx in range(len(metric_labels)):
    table[(0, col_idx)].set_facecolor('#4C72B0')
    table[(0, col_idx)].set_text_props(color='white', fontweight='bold')

ax.set_title('Tableau de Comparaison -- Meilleure valeur en vert', pad=20, fontsize=13)
plt.tight_layout()
plt.savefig(OUTPUT_DIR / 'comparison_table.png', dpi=100, bbox_inches='tight')
plt.show()
print("  comparison_table.png sauvegarde")


# ======================================================
# ETAPE 7 -- RAPPORT FINAL
# ======================================================

print("\n" + "=" * 60)
print("  RAPPORT FINAL DE COMPARAISON")
print("=" * 60)

print(f"""
  Logistic Regression
    ROC-AUC   : {metrics_lr['roc_auc']:.2%}
    Avantage  : auditable nativement (coefficients)
    Limite    : moins precis sur donnees complexes

  Random Forest
    ROC-AUC   : {metrics_rf['roc_auc']:.2%}
    Avantage  : robuste, simple a configurer
    Limite    : boite noire

  XGBoost
    ROC-AUC   : {metrics_xgb['roc_auc']:.2%}
    Avantage  : le plus precis + feature importance native
    Limite    : plus complexe a configurer

  CONCLUSION : {best_model_name} recommande
  Raison     : meilleur ROC-AUC ({best_auc:.2%})
""")


# ======================================================
# ETAPE 8 -- SAUVEGARDE
# ======================================================

rapport = {
    'generated_at'  : datetime.now().isoformat(),
    'dataset'       : 'IBM Telco Customer Churn',
    'n_samples'     : int(len(y)),
    'n_features'    : int(len(feature_names)),
    'churn_rate'    : float(y.mean()),
    'models'        : all_metrics,
    'best_model'    : best_model_name,
    'best_roc_auc'  : float(best_auc),
    'graphiques'    : [
        'comparison_metrics.png',
        'comparison_roc_curves.png',
        'comparison_confusion_matrices.png',
        'comparison_radar.png',
        'comparison_table.png'
    ]
}

with open(OUTPUT_DIR / 'comparison_report.json', 'w') as f:
    json.dump(rapport, f, indent=2)

# Sauvegarder aussi les 3 modeles
joblib.dump(lr_model,  OUTPUT_DIR / 'logistic_regression.pkl')
joblib.dump(rf_model,  OUTPUT_DIR / 'random_forest.pkl')
joblib.dump(xgb_model, OUTPUT_DIR / 'xgboost.pkl')
joblib.dump(scaler,    OUTPUT_DIR / 'scaler_lr.pkl')

print(f"Tout sauvegarde dans : {OUTPUT_DIR}/")
print(f"  -> comparison_metrics.png")
print(f"  -> comparison_roc_curves.png")
print(f"  -> comparison_confusion_matrices.png")
print(f"  -> comparison_radar.png")
print(f"  -> comparison_table.png")
print(f"  -> comparison_report.json")
print(f"  -> logistic_regression.pkl")
print(f"  -> random_forest.pkl")
print(f"  -> xgboost.pkl")
print(f"  -> scaler_lr.pkl")

print("\n" + "=" * 60)
print("  COMPARAISON TERMINEE")
print(f"  MEILLEUR MODELE : {best_model_name} (AUC : {best_auc:.2%})")
print("=" * 60)