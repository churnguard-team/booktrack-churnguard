# Guide d'implémentation des modèles ML - Dashboard Modérateur

## Structure créée

Vous avez maintenant une structure complète pour les modèles de churn et recommandation:

```
backend/
├── ml_models/
│   ├── __init__.py
│   ├── churn/                    # Modèles de prédiction de churn
│   │   ├── __init__.py
│   │   ├── random_forest.py     # TODO: Implémenter Random Forest
│   │   ├── xgboost_model.py     # TODO: Implémenter XGBoost
│   │   └── deep_learning.py     # TODO: Implémenter Deep Learning
│   └── recommendation/           # Modèle de recommandation de livres
│       ├── __init__.py
│       └── recommendation.py     # TODO: Implémenter recommandation
├── routers/
│   └── moderator.py             # API endpoints (endpoints vides prêts)
└── main.py                       # Mise à jour inclure moderator router
```

## Comment implémenter les modèles

### 1. Modèles de Churn

#### Random Forest (`ml_models/churn/random_forest.py`)
```python
# À implémenter dans la méthode train():
from sklearn.ensemble import RandomForestClassifier

self.model = RandomForestClassifier(
    n_estimators=self.n_estimators,
    random_state=self.random_state,
    n_jobs=-1
)
self.model.fit(X_train, y_train)
```

#### XGBoost (`ml_models/churn/xgboost_model.py`)
```python
# À implémenter dans la méthode train():
import xgboost as xgb

self.model = xgb.XGBClassifier(
    max_depth=self.max_depth,
    learning_rate=self.learning_rate,
    n_estimators=self.n_estimators,
    random_state=self.random_state
)
# Avec validation set si fourni
self.model.fit(X_train, y_train, 
    eval_set=[(X_val, y_val)] if X_val is not None else None,
    early_stopping_rounds=10)
```

#### Deep Learning (`ml_models/churn/deep_learning.py`)
```python
# À implémenter dans build_model():
from tensorflow import keras
from tensorflow.keras import layers

self.model = keras.Sequential([
    layers.Dense(self.hidden_layers[0], activation='relu', input_dim=self.input_dim),
    layers.Dropout(self.dropout_rate),
    layers.Dense(self.hidden_layers[1], activation='relu'),
    layers.Dropout(self.dropout_rate),
    layers.Dense(self.hidden_layers[2], activation='relu'),
    layers.Dropout(self.dropout_rate),
    layers.Dense(1, activation='sigmoid')
])

self.model.compile(
    optimizer=keras.optimizers.Adam(learning_rate=self.learning_rate),
    loss='binary_crossentropy',
    metrics=['accuracy', keras.metrics.AUC()]
)
```

### 2. Modèle de Recommandation (`ml_models/recommendation/recommendation.py`)

Plusieurs approches possibles:

#### Option A: Collaborative Filtering
```python
# À implémenter dans train():
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# Créer matrice user-book
user_book_matrix = interactions_df.pivot_table(
    index='user_id', 
    columns='book_id', 
    values='rating',
    fill_value=0
)

# Calculer similarité
user_similarity = cosine_similarity(user_book_matrix)
self.user_similarity = user_similarity
self.user_book_matrix = user_book_matrix
```

#### Option B: Matrix Factorization (SVD)
```python
# À implémenter dans train():
from scipy.sparse.linalg import svds
import scipy.sparse as sp

# SVD factorization
sparse_matrix = sp.csr_matrix(user_book_matrix)
U, sigma, Vt = svds(sparse_matrix, k=self.n_factors)
self.U = U
self.sigma = sigma
self.Vt = Vt
```

#### Option C: Content-Based
```python
# À implémenter dans train():
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Extraire features des livres
vectorizer = TfidfVectorizer(max_features=100)
book_features = vectorizer.fit_transform(books_df['genre'] + ' ' + books_df['author'])
book_similarity = cosine_similarity(book_features)
self.book_similarity = book_similarity
```

## API Endpoints (Backend)

Les endpoints suivants sont disponibles et attendent votre implémentation:

### Churn Prediction
- `GET /moderator/churn/stats` - Statistiques de churn
- `POST /moderator/churn/predict` - Prédiction pour un utilisateur
- `POST /moderator/churn/predict-batch` - Prédiction batch
- `GET /moderator/churn/feature-importance` - Importance des features
- `POST /moderator/train-churn-model` - Entraîner un modèle

### Recommandations
- `POST /moderator/recommendations/for-user` - Recommandations pour un utilisateur
- `POST /moderator/recommendations/batch` - Recommandations batch
- `GET /moderator/recommendations/similar/{book_id}` - Livres similaires
- `POST /moderator/train-recommendation-model` - Entraîner le modèle

### General
- `GET /moderator/dashboard-summary` - Résumé du dashboard
- `GET /moderator/model-status` - État des modèles

## Frontend Components

Les composants suivants sont prêts à être utilisés:

- `frontend/app/dashboard/moderator/page.tsx` - Page principale du dashboard
- `frontend/app/dashboard/moderator/components/ModelStatus.tsx` - Affichage l'état des modèles
- `frontend/app/dashboard/moderator/components/ChurnSection.tsx` - Section churn
- `frontend/app/dashboard/moderator/components/RecommendationSection.tsx` - Section recommandations

## Prochaines étapes

1. **Installer les dépendances**
   ```bash
   pip install scikit-learn xgboost tensorflow pandas numpy scipy
   ```

2. **Implémenter les méthodes dans les classes**
   - Commencez par Random Forest (plus simple)
   - Puis XGBoost
   - Puis Deep Learning
   - Puis recommandations

3. **Ajouter les données d'entraînement**
   - Créer endpoint pour charger/préparer les données
   - Implémenter feature engineering

4. **Tester les modèles**
   - Utiliser les endpoints API
   - Vérifier les prédictions

5. **Intégrer avec la base de données**
   - Sauvegarder les prédictions
   - Tracker les performances

## Structure des données attendues

### Input pour churn prediction
```python
# DataFrame avec colonnes:
# - user_id
# - age
# - total_spent
# - nb_books_read
# - days_active
# - last_activity_days
# - subscription_type
# - ...autres features
```

### Input pour recommandations
```python
# interactions_df columns:
# - user_id
# - book_id
# - rating (1-5) ou interaction (0/1)

# books_df columns (optionnel):
# - book_id
# - title
# - genre
# - author
# - description
```

## Fichiers de référence

- Modèles: `backend/ml_models/churn/*.py`
- Router API: `backend/routers/moderator.py`
- Frontend: `frontend/app/dashboard/moderator/*`
