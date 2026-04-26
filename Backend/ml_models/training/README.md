# ML Models - Structure Complète d'Entraînement et Inférence

## 📁 Structure des répertoires

```
backend/ml_models/
├── training/                          # Scripts d'entraînement indépendants
│   ├── churn_random_forest_train.py   # Entraîner Random Forest (standalone)
│   ├── churn_xgboost_train.py         # Entraîner XGBoost (standalone)
│   ├── churn_deeplearning_train.py    # Entraîner Deep Learning (standalone)
│   ├── recommendation_train.py        # Entraîner recommandation (standalone)
│   ├── compare_churn_models.py        # Comparer les 3 algos de churn
│   └── example_*.csv                  # Données d'exemple générées lors du test
│
├── inference/                         # Classes pour charger et utiliser les modèles
│   └── __init__.py                    # ChurnPredictor, RecommendationEngine
│
├── saved_models/                      # Modèles entraînés (générés après training)
│   ├── random_forest_churn/
│   │   ├── model.pkl                  # Modèle sauvegardé
│   │   ├── features.pkl               # Noms des features
│   │   └── metadata.json              # Métriques et paramètres
│   ├── xgboost_churn/
│   │   ├── model.json
│   │   ├── model.pkl
│   │   ├── features.pkl
│   │   └── metadata.json
│   ├── deep_learning_churn/
│   │   ├── model.h5                   # Modèle Keras
│   │   ├── scaler.pkl                 # Normalisation
│   │   ├── features.pkl
│   │   └── metadata.json
│   ├── book_recommendation/
│   │   ├── model.pkl
│   │   ├── user_book_matrix.pkl
│   │   ├── user_to_idx.pkl
│   │   ├── book_to_idx.pkl
│   │   └── metadata.json
│   └── comparison/                    # Résultats de la comparaison
│       ├── comparison_radar.png
│       ├── comparison_bars.png
│       └── comparison_heatmap.png
│
├── churn/                             # (Ancien) Templates - À IGNORER
├── recommendation/                    # (Ancien) Templates - À IGNORER
└── __init__.py
```

## 🚀 Workflow de travail

### 1️⃣ Entraîner les modèles (Scripts indépendants)

Chaque script d'entraînement est **complètement autonome** et peut être exécuté séparément:

#### Random Forest
```bash
cd backend/ml_models/training
python churn_random_forest_train.py <chemin_vers_dataset.csv>
```

**Résultat:**
- ✓ Modèle entraîné: `saved_models/random_forest_churn/model.pkl`
- ✓ Graphiques: `feature_importance.png`, `confusion_matrix.png`, `prediction_distribution.png`
- ✓ Métriques: `saved_models/random_forest_churn/metadata.json`

#### XGBoost
```bash
python churn_xgboost_train.py <chemin_vers_dataset.csv>
```

**Résultat:**
- ✓ Modèle: `saved_models/xgboost_churn/model.json`
- ✓ Graphiques + métriques

#### Deep Learning
```bash
python churn_deeplearning_train.py <chemin_vers_dataset.csv>
```

**Résultat:**
- ✓ Modèle: `saved_models/deep_learning_churn/model.h5`
- ✓ Scaler: `saved_models/deep_learning_churn/scaler.pkl`
- ✓ Graphiques + métriques

#### Book Recommendations
```bash
python recommendation_train.py <chemin_interactions.csv> <chemin_books.csv>
```

### 2️⃣ Comparer les modèles

```bash
python compare_churn_models.py
```

**Affiche:**
- Métriques détaillées pour chaque modèle
- Meilleur modèle par métrique
- Score global (moyenne pondérée)
- Graphiques de comparaison:
  - `saved_models/comparison/comparison_radar.png`
  - `saved_models/comparison/comparison_bars.png`
  - `saved_models/comparison/comparison_heatmap.png`

### 3️⃣ Charger le meilleur modèle dans l'API

Une fois votre meilleur modèle choisi, l'API peut le charger automatiquement:

```python
from ml_models.inference import get_churn_predictor, get_recommendation_engine

# Charger le modèle de churn (example: Random Forest)
predictor = get_churn_predictor("random_forest_churn")

# Faire une prédiction
features = {
    'age': 35,
    'total_spent': 500.0,
    'nb_books_read': 12,
    # ... autres features
}

result = predictor.predict(features)
# {'churn_prediction': 1, 'churn_probability': 0.75, 'risk_level': 'ÉLEVÉ'}

# Charger le modèle de recommandation
engine = get_recommendation_engine()

# Obtenir des recommandations
recs = engine.recommend("user123", n_recommendations=5)
# [{'book_id': 'book42', 'score': 0.85}, ...]
```

## 📊 Exemple complet: Utilisation avec votre dataset

### Étape 1: Préparer les données

**Format pour Churn:**
```csv
age,total_spent,nb_books_read,days_active,last_activity_days,subscription_type,...,Churn
35,500,12,365,7,PREMIUM,...,1
42,1200,25,730,2,STANDARD,...,0
```

**Format pour Recommendations:**
```csv
user_id,book_id,rating
user_1,book_42,5
user_1,book_15,4
user_2,book_42,5
```

### Étape 2: Entraîner

```bash
# Random Forest
python churn_random_forest_train.py ./my_churn_data.csv
# → saved_models/random_forest_churn/

# XGBoost
python churn_xgboost_train.py ./my_churn_data.csv
# → saved_models/xgboost_churn/

# Deep Learning (nécessite TensorFlow)
pip install tensorflow
python churn_deeplearning_train.py ./my_churn_data.csv
# → saved_models/deep_learning_churn/
```

### Étape 3: Comparer et choisir

```bash
python compare_churn_models.py
```

Vous verrez:
```
📊 RÉSULTATS DÉTAILLÉS
========================================
ACCURACY:
  Random Forest          0.8523
  XGBoost                0.8612  ← Meilleur
  Deep Learning          0.8389

PRECISION:
  Random Forest          0.7856
  XGBoost                0.8234  ← Meilleur
  Deep Learning          0.7923

🏆 MEILLEUR MODÈLE PAR MÉTRIQUE
========================================
  accuracy       → XGBoost (0.8612)
  precision      → XGBoost (0.8234)
  recall         → Random Forest (0.7945)
  f1             → XGBoost (0.8018)
  roc_auc        → XGBoost (0.8850)

⭐ SCORE GLOBAL
========================================
  Random Forest              0.8165
  XGBoost                    0.8306  ← Recommandé
  Deep Learning              0.8087
```

### Étape 4: Utiliser le meilleur

Modifier `backend/routers/moderator.py` pour charger le meilleur modèle:

```python
from ml_models.inference import get_churn_predictor

# Charger XGBoost (le meilleur)
churn_model = get_churn_predictor("xgboost_churn")

@router.post("/churn/predict")
def predict_churn(user_id: str = Body(...)):
    # Récupérer features de l'utilisateur
    features = fetch_user_features(user_id)
    
    # Prédire
    result = churn_model.predict(features)
    
    return {
        "user_id": user_id,
        "churn_probability": result['churn_probability'],
        "risk_level": result['risk_level']
    }
```

## 📦 Dépendances requises

```bash
# Minimum (Random Forest, XGBoost)
pip install pandas numpy scikit-learn xgboost joblib matplotlib seaborn

# Avec Deep Learning
pip install tensorflow

# Pour Kaggle (optionnel)
pip install kagglehub
```

## 💡 Points clés

✅ **Chaque script est indépendant:**
- Vous pouvez entraîner RF, XGB, DL en parallèle
- Chacun charge ses données, entraîne, évalue
- Pas de dépendances entre les scripts

✅ **Les modèles sont sauvegardés:**
- Modèle + Features + Métadonnées
- Peut être chargé sans réentraîner

✅ **Inference unifiée:**
- `ChurnPredictor` charge n'importe quel modèle de churn
- `RecommendationEngine` pour les recommandations
- Interface simple pour l'API

✅ **Comparaison facile:**
- Un script pour comparer tous les modèles
- Métriques et graphiques générés automatiquement
- Recommandation du meilleur

## 🔧 Troubleshooting

**Erreur: "TensorFlow not installed"**
```bash
pip install tensorflow
```

**Erreur: "Model not found"**
- Assurez-vous d'avoir d'abord entraîné le modèle
- Vérifiez que `saved_models/[model_name]/metadata.json` existe

**Modèle trop lent**
- Réduire `n_estimators` pour Random Forest
- Réduire `epochs` pour Deep Learning
- Utiliser un dataset plus petit pour tester

## 📚 Ressources

- [Sklearn ensemble methods](https://scikit-learn.org/stable/modules/ensemble.html)
- [XGBoost documentation](https://xgboost.readthedocs.io/)
- [TensorFlow/Keras](https://www.tensorflow.org/guide/keras)
- [Collaborative Filtering](https://en.wikipedia.org/wiki/Collaborative_filtering)

---

**Prêt à entraîner vos modèles?** 🚀 Commencez par:
```bash
python churn_random_forest_train.py ./your_data.csv
```
