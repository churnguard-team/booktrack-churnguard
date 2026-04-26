# Quick start guide

Vous avez maintenant une structure complète pour:
1. Entraîner 3 algorithmes de churn indépendamment
2. Entraîner un modèle de recommandation
3. Comparer et choisir le meilleur
4. Utiliser les modèles dans l'API

## 🚀 Démarrage rapide (5 minutes)

### 1. Installer les dépendances
```bash
pip install pandas numpy scikit-learn xgboost joblib matplotlib seaborn
```

### 2. Entraîner Random Forest
```bash
cd backend/ml_models/training
python churn_random_forest_train.py
```

### 3. Entraîner XGBoost
```bash
python churn_xgboost_train.py
```

### 4. Comparer
```bash
python compare_churn_models.py
```

### 5. Voir les résultats
```
✓ Modèles sauvegardés dans: backend/ml_models/saved_models/
✓ Graphiques générés automatiquement
✓ Meilleur modèle identifié
```

## 📂 Fichiers clés

- `churn_random_forest_train.py` - Scripts d'entraînement
- `churn_xgboost_train.py`
- `churn_deeplearning_train.py`
- `recommendation_train.py`
- `compare_churn_models.py` - Comparaison
- `README.md` - Documentation complète

## 💡 Important

Chaque script:
- ✅ Est indépendant (peut être exécuté séul)
- ✅ Gère les données d'exemple automatiquement
- ✅ Génère graphiques + métriques
- ✅ Sauvegarde le modèle + métadonnées
- ✅ Peut être utilisé avec vos propres données (CSV)

## 🔗 Utilisation dans l'API

```python
from ml_models.inference import get_churn_predictor

predictor = get_churn_predictor("random_forest_churn")
result = predictor.predict({'age': 35, 'spent': 500})
# → {'churn_prediction': 1, 'churn_probability': 0.75, 'risk_level': 'ÉLEVÉ'}
```

Voir `training/README.md` pour la documentation complète.
