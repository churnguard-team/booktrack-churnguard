# HOW TO USE WITH YOUR OWN DATA

## 🎯 Utiliser les scripts avec vos données réelles

### 1. Préparer vos données de churn

**Format attendu (CSV):**
```
age,total_spent,nb_books_read,days_active,last_activity_days,subscription_type,tech_support,internet_service,Churn
35,500.50,12,365,7,PREMIUM,Yes,Fiber,1
42,1200.00,25,730,2,STANDARD,No,DSL,0
28,350.75,8,180,15,BASIC,Yes,Cable,1
```

**Colonnes importantes:**
- ✅ Doit avoir une colonne `Churn` (ou contenant "churn" en minuscules)
- ✅ Toutes les autres colonnes = features
- ✅ Churn doit être 0/1 ou Yes/No (script convertit automatiquement)

**Exemple de scripts pour préparer les données:**

```python
import pandas as pd

# Charger vos données
df = pd.read_csv("telecom_customer_churn.csv")

# Nettoyer si besoin
df = df.dropna()  # Supprimer valeurs manquantes
df = df.drop_duplicates()  # Supprimer doublons

# S'assurer que Churn est présent
if 'Churn' not in df.columns:
    # Renommer la colonne si elle s'appelle différemment
    df.rename(columns={'ChurnLabel': 'Churn'}, inplace=True)

# Sauvegarder
df.to_csv("churn_data_clean.csv", index=False)
print(df.shape, df['Churn'].value_counts())
```

### 2. Préparer vos données de recommandations

**Format pour interactions (CSV):**
```
user_id,book_id,rating
user_1,book_42,5
user_1,book_15,4
user_2,book_42,5
user_2,book_99,3
```

**Format pour livres (CSV, optionnel):**
```
book_id,title,genre,author
book_42,The Great Book,Fiction,Author Smith
book_15,AI Future,Science-Fiction,Author Jones
book_99,Mystery Case,Mystery,Author Brown
```

**Important:**
- ✅ interactions.csv = requis
- ✅ books.csv = optionnel (pour content-based)
- ✅ rating = score 1-5 (ou 0-1 pour binaire)

### 3. Exécuter l'entraînement

#### Option A: Avec vos données

```bash
cd backend/ml_models/training

# Random Forest
python churn_random_forest_train.py /path/to/my_churn_data.csv

# XGBoost
python churn_xgboost_train.py /path/to/my_churn_data.csv

# Deep Learning
python churn_deeplearning_train.py /path/to/my_churn_data.csv

# Recommandations
python recommendation_train.py /path/to/interactions.csv /path/to/books.csv
```

#### Option B: Sans arguments (utilise données d'exemple)

```bash
python churn_random_forest_train.py
# → Crée "example_churn_data.csv" et entraîne dessus
```

### 4. Résultats

Après l'exécution, vous obtenez:

**Modèle sauvegardé:**
```
saved_models/random_forest_churn/
├── model.pkl              ← Le modèle
├── features.pkl           ← Noms des features
└── metadata.json          ← Métriques + params
```

**Graphiques générés:**
```
saved_models/random_forest_churn/
├── feature_importance.png        ← Top 15 features
├── confusion_matrix.png          ← Matrice de confusion
└── prediction_distribution.png   ← Distribution des probabilités
```

**Métriques (dans metadata.json):**
```json
{
  "metrics": {
    "accuracy": 0.8523,
    "precision": 0.7856,
    "recall": 0.7234,
    "f1": 0.7528,
    "roc_auc": 0.8912,
    "confusion_matrix": [[...], [...]]
  }
}
```

### 5. Comparer les modèles

```bash
python compare_churn_models.py
```

**Affichage:**
```
📊 RÉSULTATS DÉTAILLÉS
=========================================
ACCURACY:
  Random Forest          0.8523
  XGBoost                0.8612  ← Meilleur
  Deep Learning          0.8389

... (toutes les métriques)

⭐ SCORE GLOBAL
=========================================
  Random Forest              0.8165
  XGBoost                    0.8306  ← Recommandé
  Deep Learning              0.8087

🥇 RECOMMANDATION: XGBoost (0.8306)
```

**Graphiques de comparaison:**
```
saved_models/comparison/
├── comparison_radar.png    ← Visualisation radar
├── comparison_bars.png     ← Graphique barres
└── comparison_heatmap.png  ← Heatmap
```

### 6. Utiliser dans l'API

Une fois entraîné, charger dans `backend/routers/moderator.py`:

```python
from ml_models.inference import get_churn_predictor, get_recommendation_engine

# Charger le meilleur modèle
churn_predictor = get_churn_predictor("xgboost_churn")
rec_engine = get_recommendation_engine()

# Prédire pour un utilisateur
features = {
    'age': 35,
    'total_spent': 500.0,
    'nb_books_read': 12,
    'days_active': 365,
    'last_activity_days': 7,
    # ... toutes les autres features
}

result = churn_predictor.predict(features)
print(result)
# {'churn_prediction': 1, 'churn_probability': 0.75, 'risk_level': 'ÉLEVÉ'}

# Recommandations
recs = rec_engine.recommend("user_123", n_recommendations=5)
print(recs)
# [{'book_id': 'book_42', 'score': 0.85}, ...]
```

### 7. Réentraîner avec nouvelles données

```bash
# Les nouveaux modèles écrasent les anciens
python churn_random_forest_train.py /path/to/new_data.csv

# Les anciens modèles sont perdus!
# → Sauvegarder d'abord si vous en avez besoin
cp -r saved_models/random_forest_churn saved_models/random_forest_churn_v1
```

---

## 📋 Checklist

- [ ] Préparer données de churn (CSV)
- [ ] Préparer données de recommandations (interactions + books)
- [ ] Installer dépendances: `pip install pandas scikit-learn xgboost`
- [ ] Entraîner Random Forest: `python churn_random_forest_train.py data.csv`
- [ ] Entraîner XGBoost: `python churn_xgboost_train.py data.csv`
- [ ] Comparer: `python compare_churn_models.py`
- [ ] Choisir le meilleur modèle
- [ ] Mettre à jour `routers/moderator.py` pour utiliser ce modèle
- [ ] Tester l'API: `curl http://localhost:8000/moderator/churn/stats`
- [ ] Accéder au dashboard: `http://localhost:3000/dashboard/moderator`

---

## 🐛 Troubleshooting

### Erreur: "Column 'Churn' not found"
- Vérifier que votre CSV a bien une colonne avec "Churn" (sensible à la casse)
- Renommer si nécessaire: `df.rename(columns={'ChurnLabel': 'Churn'}, inplace=True)`

### Erreur: "Model not found"
- Assurez-vous d'avoir entraîné d'abord
- Vérifier que `saved_models/[model_name]/metadata.json` existe

### Modèle très lent
- Réduire le dataset pour tester
- Pour RF: réduire `n_estimators` de 100 à 50
- Pour XGB: réduire `n_estimators` de 200 à 100
- Pour DL: réduire `epochs` de 100 à 20

### Features incompatibles après réentraînement
- Les features doivent être identiques entre entraînement et prédiction
- Si vous changeztez de features, les anciens modèles ne fonctionnent plus
- Supprimer `saved_models/[model_name]/features.pkl` et réentraîner

---

## 📊 Exemple complet

### Données d'exemple que vous pourriez télécharger:

```bash
# De Kaggle via kagglehub
import kagglehub
path = kagglehub.dataset_download("abdullah0a/telecom-customer-churn-insights-for-analysis")
```

### Puis utiliser directement:

```bash
python churn_random_forest_train.py \
  "$path/telecom_customer_churn.csv"
```

### Résultats:
```
✓ Modèle entraîné: saved_models/random_forest_churn/
✓ Graphiques générés
✓ Métriques: accuracy=85.23%, f1=0.802
✓ Prêt à utiliser dans l'API!
```

---

**Vous êtes prêt!** 🚀 Commencez par vos propres données.
