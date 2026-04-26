# Dashboard Modérateur - Churn & Recommandations

## Résumé des modifications

Un nouveau dashboard **Modérateur** a été ajouté au projet pour gérer:
- **Prédictions de churn** avec 3 algorithmes (Random Forest, XGBoost, Deep Learning)
- **Recommandations de livres** pour les clients

Aucun code existant n'a été modifié, sauf l'ajout du nouveau router dans `main.py`.

## Fichiers créés

### Backend ML Models (`backend/ml_models/`)

#### Structure:
```
ml_models/
├── __init__.py
├── churn/
│   ├── __init__.py
│   ├── random_forest.py      # Classe RandomForestChurnModel (template)
│   ├── xgboost_model.py      # Classe XGBoostChurnModel (template)
│   └── deep_learning.py      # Classe DeepLearningChurnModel (template)
└── recommendation/
    ├── __init__.py
    └── recommendation.py      # Classe BookRecommendationModel (template)
```

#### Caractéristiques:
- **RandomForestChurnModel**: Interface pour Random Forest
  - `train()`, `predict()`, `predict_proba()`
  - `get_feature_importance()` pour l'analyse des features
  - Sauvegarde/chargement du modèle

- **XGBoostChurnModel**: Interface pour XGBoost avec early stopping
  - Support pour validation set
  - Historique d'entraînement
  - Importance des features (multiples types)

- **DeepLearningChurnModel**: Interface pour neural network (Keras/TensorFlow)
  - Architecture configurable
  - Dropout et régularisation
  - Normalisation des features

- **BookRecommendationModel**: Interface flexible pour recommandations
  - Support pour multiple stratégies (collaborative, content-based, hybrid)
  - Recommandations individuelles et batch
  - Livres similaires
  - Évaluation avec métriques de ranking

### Backend API Router (`backend/routers/moderator.py`)

Endpoints disponibles (prêts pour implémentation):

**Churn:**
- `GET /moderator/churn/stats` - Statistiques globales
- `POST /moderator/churn/predict` - Prédiction pour un user
- `POST /moderator/churn/predict-batch` - Prédictions batch
- `GET /moderator/churn/feature-importance` - Importance des features

**Recommandations:**
- `POST /moderator/recommendations/for-user` - Recs pour un user
- `POST /moderator/recommendations/batch` - Recs batch
- `GET /moderator/recommendations/similar/{book_id}` - Livres similaires

**Management:**
- `POST /moderator/train-churn-model` - Entraîner churn model
- `POST /moderator/train-recommendation-model` - Entraîner recs model
- `GET /moderator/model-status` - État des modèles
- `GET /moderator/dashboard-summary` - Résumé complet

### Frontend Dashboard (`frontend/app/dashboard/moderator/`)

#### Structure:
```
moderator/
├── page.tsx                    # Page principale (refactorisée)
└── components/
    ├── ModelStatus.tsx         # Affiche l'état des 4 modèles
    ├── ChurnSection.tsx        # Vue du churn avec distribution
    └── RecommendationSection.tsx # Vue des recommandations
```

#### Fonctionnalités Frontend:
- Vue d'ensemble de l'état des modèles
- Statistiques de churn avec distribution par risque
- Métriques de recommandations
- Utilisateurs prioritaires à haut risque
- Boutons pour actions (voir détails, former modèles, générer batch)
- Gestion des erreurs et état de chargement

## Modification existante

**Fichier: `backend/main.py`**
- Importation du nouveau router: `from routers import ... moderator`
- Inclusion du router: `app.include_router(moderator.router)`

## Comment utiliser

### 1. Implémenter les algorithmes
Voir [GUIDE_ML_IMPLEMENTATION.md](./GUIDE_ML_IMPLEMENTATION.md) pour:
- Code d'exemple pour chaque algorithme
- Structure des données attendues
- Étapes d'implémentation

### 2. Tester les endpoints
```bash
# Après avoir implémenté les modèles
curl http://localhost:8000/moderator/model-status
curl http://localhost:8000/moderator/churn/stats
```

### 3. Accéder au dashboard
- URL: `http://localhost:3000/dashboard/moderator`
- Rôles autorisés: `MODERATOR`, `SUPER_ADMIN`

## Permissions

Le dashboard est accessible uniquement par:
- **MODERATOR** - Rôle modérateur
- **SUPER_ADMIN** - Administrateur super

## Templates vides prêts

Tous les fichiers contiennent:
- ✅ Signatures de méthodes complètes
- ✅ Docstrings détaillés en français
- ✅ TODO comments pour guider l'implémentation
- ✅ Types hints pour la validation
- ✅ Structure d'erreurs appropriée

## Prochaines étapes

1. Installer dépendances ML: `pip install scikit-learn xgboost tensorflow`
2. Implémenter les méthodes dans les classes ML
3. Connecter avec la base de données pour les données d'entraînement
4. Tester les endpoints API
5. Affiner le frontend avec les données réelles

## Notes

- Aucun code existant n'a été modifié (sauf main.py)
- L'ancien dashboard de modération n'a pas été touché
- Les modèles sont séparés dans `ml_models/` pour une meilleure organisation
- Tous les TODO sont clairement marqués pour faciliter l'implémentation
