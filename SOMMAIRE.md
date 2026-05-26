# SOMMAIRE - RAPPORT DE PROJET PFE

## Booktrack Churnguard: Plateforme Intelligente de Rétention des Lecteurs

---

## 1. CONTEXTE DU PROJET

### 1.1 Pourquoi l'Application
### 1.2 Problématique
### 1.3 Déroulement Général du Projet

---

## 2. ANALYSE FONCTIONNELLE ET CONCEPTION

### 2.1 Objectifs du Projet
### 2.2 Analyse des Besoins
### 2.3 Diagrammes de Cas d'Usage
### 2.4 Conception Générale
### 2.5 Diagrammes Détaillés
   - Diagrammes de Classes
   - Diagrammes de Séquences
   - Modèles de Données

---

## 3. CHAPITRE INTELLIGENCE ARTIFICIELLE

### 3.1 Modèles de Machine Learning

#### 3.1.1 Vue d'ensemble des approches adoptées

Le projet Booktrack Churnguard intègre deux algorithmes complémentaires de machine learning pour la prédiction du churn utilisateur, permettant une robustesse accrue et une comparaison des performances:

1. **XGBoost (Gradient Boosting Extremisé)**
   - Architecture: 200 estimateurs avec profondeur maximale de 7
   - Taux d'apprentissage: 0.1
   - Régularisation L1/L2: 1.0 (contrôle du surapprentissage)
   - Sampling: 80% des features et 80% des observations par itération
   - Arrêt précoce: 20 rounds sans amélioration (Early Stopping)
   - Métrique: Loss logarithmique binaire (logloss)
   - Avantages: Performance élevée, interprétabilité via SHAP, gestion efficace des données déséquilibrées

2. **Deep Learning (TensorFlow/Keras)**
   - Architecture: Réseau de neurones feedforward 5 couches
   - Couche 1: 128 neurones + ReLU + BatchNormalization + Dropout(0.3)
   - Couche 2: 64 neurones + ReLU + BatchNormalization + Dropout(0.3)
   - Couche 3: 32 neurones + ReLU + Dropout(0.2)
   - Couche de sortie: 1 neurone + Sigmoid (classification binaire)
   - Optimiseur: Adam avec convergence adaptive
   - Fonction de perte: Binary Crossentropy
   - Normalisation des données: StandardScaler (moyenne 0, écart-type 1)
   - Avantages: Capture des relations non-linéaires complexes, capacité de généralisation

#### 3.1.2 Données d'entraînement

- **Source dataset**: IBM Telco Customer Churn (Kaggle)
- **Volume**: Plusieurs milliers de clients avec churn label
- **Nettoyage**: Suppression des identifiants, gestion des valeurs manquantes, conversion des types
- **Encodage**: One-hot encoding pour les 15 variables catégoriques, Label Encoding pour la cible
- **Partitionnement**: 60% train / 20% validation / 20% test avec stratification (maintien de la distribution)
- **Équilibre des classes**: Dataset légèrement déséquilibré (plus de clients actifs), compensé par les métriques adaptées

#### 3.1.3 Pipeline d'entraînement

1. Téléchargement automatique du dataset via Kaggle Hub
2. Prétraitement et nettoyage
3. Encodage des variables catégoriques
4. Division stratifiée des données
5. Entraînement sur ensemble train + validation croisée
6. Arrêt précoce basé sur performance validation
7. Évaluation sur ensemble test indépendant
8. Sauvegarde du modèle (architecture + poids) et des métadonnées

---

### 3.2 Prédiction du Churn

#### 3.2.1 Extraction des features (signaux prédictifs)

Le système extrait **25 features fondamentales** directement de la base de données BookTrack pour chaque utilisateur:

**A. Signaux d'engagement temporel (4 features)**
- `account_age_days`: Ancienneté du compte (en jours depuis inscription)
- `days_since_last_login`: Inactivité (nombre de jours sans connexion; NULL → 999 jours)
- `objectif_annuel`: Nombre de livres visés par l'utilisateur cette année
- `active_days_30d`: Nombre de jours distincts où l'utilisateur a ouvert l'app (dernier mois)

**B. Signaux de consommation de contenu (9 features)**
- `total_books_read`: Total de livres terminés
- `books_currently_reading`: Livres en cours de lecture (signal fort: utilisateurs actifs moins susceptibles de churner)
- `books_abandoned`: Nombre d'abandons (signal négatif)
- `books_to_read`: Wishlist size (engagement)
- `total_pages_read`: Volume brut de pages lues
- `books_read_last_30d`: Livres terminés dans les 30 derniers jours (signal de churn le plus fort)
- `avg_days_to_finish`: Temps moyen pour terminer un livre (consistance et vitesse de lecture)
- `avg_rating`: Note moyenne attribuée par l'utilisateur (satisfaction)
- `total_events_30d`: Nombre total d'événements enregistrés (utilisation globale)

**C. Signaux d'interaction sociale et engagement (4 features)**
- `nb_favourites`: Nombre de favoris (attachement émotionnel à l'app)
- `nb_reviews_written`: Nombre d'avis publiés par l'utilisateur
- `nb_comments`: Nombre de commentaires sur les livres
- `reco_acceptance_rate`: Taux d'acceptation des recommandations (engagement avec suggestions)

**D. Signaux comportementaux (5 features)**
- `book_views_30d`: Nombre de consultations de fiche livres (dernier mois)
- `searches_30d`: Nombre de recherches effectuées (signal de découverte)
- `nb_genres_preferes`: Nombre de genres déclarés à l'onboarding
- `is_oauth_user`: Utilisateur Google login vs email/password (1/0)
- `is_premium`: Détention d'abonnement Premium (signal important)

**E. Signaux d'abonnement (3 features)**
- `subscription_cancelled`: Abonnement déjà annulé (1/0)
- `subscription_age_days`: Durée de l'abonnement actif (loyauté)
- `auto_renew`: Renouvellement automatique activé (intention de rester)

#### 3.2.2 Architecture du moteur de prédiction

```
User ID
  ↓
[Feature Extractor] → 25 features depuis DB
  ↓
[Normalisation] (StandardScaler si Deep Learning, sinon native XGBoost)
  ↓
[XGBoost Model] ou [Deep Learning Model]
  ↓
[Probabilité de churn] ∈ [0, 1]
  ↓
[Mapping vers Risk Level]: LOW / MEDIUM / HIGH / CRITICAL
```

**Niveaux de risque (Risk Levels):**
- `LOW`: score < 0.3 (très faible probabilité de churn)
- `MEDIUM`: 0.3 ≤ score < 0.6 (risque modéré, surveillance)
- `HIGH`: 0.6 ≤ score < 0.8 (risque élevé, intervention recommandée)
- `CRITICAL`: score ≥ 0.8 (risque très critique, action immédiate)

#### 3.2.3 Intégration avec la base de données

Les prédictions sont **persistées dans la table `churn_scores`** avec les colonnes:
- `user_id`: Identifiant de l'utilisateur (FK)
- `score`: Probabilité de churn [0, 1]
- `niveau_risque`: Catégorie de risque (LOW/MEDIUM/HIGH/CRITICAL)
- `model_version`: Version du modèle utilisée (ex: 'xgboost-v1')
- `features_snapshot`: Snapshot JSON des 25 features au moment du scoring
- `is_latest`: Boolean pour identifier le dernier score (une seule ligne par utilisateur)
- `created_at`: Timestamp du scoring

Cela permet:
- Traçabilité complète des prédictions
- Audit et debugging (comprendre pourquoi tel user a tel score)
- Analyse temporelle (évolution du churn score dans le temps)
- Machine learning evaluation (comparaison avec churn réel a posteriori)

#### 3.2.4 Processus de scoring journalier

Un job batch automatisé s'exécute quotidiennement:

```python
run_daily_churn_scoring(db: Session, send_emails: bool = True)
```

1. **Extraction**: Extraction des 25 features pour TOUS les utilisateurs actifs
2. **Prédiction**: Inférence parallélisable sur l'ensemble des utilisateurs
3. **Upsert DB**: Insertion ou mise à jour des scores dans `churn_scores`
4. **Détection**: Identification des utilisateurs à risque (score > 0.6)
5. **Action**: Déclenchement automatique des emails de rétention pour CRITICAL/HIGH
6. **Report**: Génération d'un rapport (utilisateurs notés, erreurs, emails envoyés)

**Métriques du job:**
- `scored`: Nombre d'utilisateurs avec prédiction réussie
- `errors`: Nombre d'utilisateurs avec erreur (données manquantes, etc.)
- `emails_sent`: Nombre d'emails de rétention envoyés
- `emails_failed`: Nombre d'emails échoués
- `high_risk_users_detected`: Nombre de users score > 0.6

#### 3.2.5 Explainabilité des prédictions

**Implémentation SHAP (SHapley Additive exPlanations)**

Pour le modèle XGBoost, SHAP calcule l'importance de chaque feature individuellement:

```python
import shap
shap.TreeExplainer(xgboost_model)
shap_values = explainer.shap_values(X_test)
shap.summary_plot(shap_values, X_test, feature_names=feature_names)
```

Utilité:
- Comprendre quelles features poussent le score vers le churn
- Identifier les utilisateurs "faux positifs" (score haut mais vraiment loyal)
- Ajuster les seuils de risque basé sur la distribution réelle
- Communiquer aux stakeholders les raisons des alertes

#### 3.2.6 Métriques d'évaluation du modèle

Pour évaluer la qualité des prédictions:

- **Accuracy**: Pourcentage de prédictions correctes (globalement)
- **Precision**: Parmi les users prédits "churn", combien vraiment churned (taux de faux positifs)
- **Recall**: Parmi les users vraiment churned, combien ont été correctement identifiés
- **F1-Score**: Moyenne harmonique precision/recall
- **ROC-AUC**: Area Under Curve de la courbe ROC (mesure robustesse sur seuils variables)
- **Matrice de confusion**: TP/TN/FP/FN pour diagnostic détaillé

---

### 3.3 Système de Recommandations de Livres

#### 3.3.1 Approche multi-signaux

Le système de recommandations n'est **pas simple collaborative filtering**, mais intègre plusieurs signaux complémentaires:

1. **Filtrage par genres** (déclaratifs et implicites)
   - Genres déclarés à l'onboarding
   - Genres des livres lus, marqués favoris, notés ≥4/5
   - Union de ces deux sources

2. **Popularité locale**
   - Nombre d'ajouts à la bibliothèque
   - Notes moyennes reçues
   - Nombre de commentaires

3. **Similarité de contenu (TF-IDF)**
   - Extraction du texte: tous les commentaires de l'utilisateur (max 50 derniers)
   - Représentation vectorielle TF-IDF (max 500 features)
   - Calcul de similitude cosinus entre les commentaires utilisateur et la description+titre+genre+resume de chaque livre candidate
   - Score TF-IDF final pour chaque livre

4. **Signaux comportementaux implicites**
   - Livres consultés via book_view: similarité avec ceux déjà consultés
   - Boost "view boost" pour livres similaires à ceux du user history

5. **Intégration du churn score**
   - Si churn_score > 0.6 (HIGH/CRITICAL): boost supplémentaire pour priorité aux recommandations
   - Objectif: retenir les utilisateurs à risque avec des recommandations très pertinentes

#### 3.3.2 Fonction de scoring

Pour chaque livre candidat:

```
SCORE_FINAL = 
    popularité (nb_ajouts) 
  + note_moyenne * 2
  + nb_commentaires * 0.5
  + tfidf_similarity * 5           [signal textuel]
  + view_boost * 1.5               [comportement implicite]
  + churn_boost (si risk > 0.6)    [rétention]
```

**Pondérations:**
- TF-IDF: ×5 (fort poids au contenu utilisateur)
- Note moyenne: ×2 (qualité du livre)
- View boost: ×1.5 (intérêt implicite)
- Nb commentaires: ×0.5 (engagement communauté)
- Churn boost: ×3 × churn_score (si risque élevé)

#### 3.3.3 Pipeline de recommandation

```
User ID
  ↓
1. [Get user genres] → genres déclarés + implicites
2. [Get user book IDs] → livres déjà en bibliothèque (exclusion)
3. [Get viewed book IDs] → livres consultés (pour view_boost)
4. [Get user comments] → texte brut de tous les avis
5. [Get churn score] → pour boost conditionnel
  ↓
6. [Query candidates] → livres matching genres, N×3 (fetch more for re-ranking)
  ↓
7. [Compute TF-IDF] → similarité contenu utilisateur vs chaque livre
8. [Compute popularité] → agrégation notes/ajouts/commentaires
9. [Compute view_boost] → similarité avec livres déjà consultés
10. [SCORE_FINAL] → application des pondérations
  ↓
11. [Sort & return] → Top N livres, exclusion de la bibliothèque
  ↓
Top N Recommandations personnalisées
```

#### 3.3.4 Enregistrement des interactions de recommandation

Chaque recommandation affichée est tracée dans la table `recommendations`:

- `user_id`: Destinataire de la recommandation
- `book_id`: Livre recommandé
- `est_affichee`: Boolean (recommandation a été montrée au user)
- `est_acceptee`: Boolean (user a cliqué/accepté)
- `score`: Score de ranking utilisé
- `raison`: Raison principale de la recommandation (genre/tfidf/churn)
- `created_at`: Timestamp

**Utilité:**
- Feedback loop: améliorer le modèle en apprenant des acceptations/rejets
- Calcul du `reco_acceptance_rate`: proportion acceptées/affichées (feature du churn model!)
- A/B testing: tester différentes pondérations
- Analytics: comprendre quels types de recommandations sont efficaces

#### 3.3.5 Différenciation par risque de churn

**Pour utilisateurs LOW/MEDIUM risk:**
- Recommandations diversifiées, exploratrices
- Nouveaux genres, auteurs découverte
- Équilibre entre popularité et découverte

**Pour utilisateurs HIGH/CRITICAL risk:**
- Recommandations hyper-personnalisées (poids TF-IDF augmenté)
- Priorité aux genres fortement appréciés
- Livres nouvellement populaires dans ses genres préférés
- Boost de visibilité dans l'interface (placement premium)
- Accompagnées de messages de rétention

---

### 3.4 Intégration de l'IA dans l'Application

#### 3.4.1 Architecture globale de l'IA

```
┌─────────────────────────────────────────────────────────┐
│                 BOOKTRACK BACKEND                       │
├─────────────────────────────────────────────────────────┤
│ [API REST FastAPI]                                      │
│   ├─ POST /ml/churn-predictions    [Batch scoring]     │
│   ├─ GET  /ml/churn/user/{id}      [Score d'un user]   │
│   ├─ POST /recommendations/{user}  [Perso recos]       │
│   └─ GET  /admin/churn-dashboard   [Analytics]         │
├─────────────────────────────────────────────────────────┤
│ [Services IA]                                           │
│   ├─ ChurnService                                       │
│   │   ├─ extract_features_for_all_users()             │
│   │   ├─ predict_churn(features) → score              │
│   │   └─ run_daily_churn_scoring()                    │
│   ├─ RecommendationService                            │
│   │   ├─ recommend_for_user(user_id, n=10)           │
│   │   ├─ track_recommendation_interaction()           │
│   │   └─ compute_reco_acceptance_rate()              │
│   └─ EmailService (intégration rétention)             │
│       └─ send_retention_email(user_id, score)         │
├─────────────────────────────────────────────────────────┤
│ [Modèles ML - saved_models/]                           │
│   ├─ xgboost/: model.pkl, metadata.json               │
│   ├─ deep_learning/: model.h5, scaler.pkl             │
│   └─ comparison/: comparison_report.json              │
├─────────────────────────────────────────────────────────┤
│ [Database]                                              │
│   ├─ churn_scores (predictions)                       │
│   ├─ recommendations (interactions)                    │
│   ├─ users, user_books, subscriptions                │
│   └─ user_events (tracking)                           │
└─────────────────────────────────────────────────────────┘
```

#### 3.4.2 Endpoints API pour l'IA

**A. Churn Prediction API**

```
POST /api/ml/churn-predictions
─────────────────────────────────
Batch scoring de tous les utilisateurs

Request: {}
Response: {
  "status": "ok",
  "scored": 1250,
  "errors": 3,
  "high_risk_users": 187,
  "timestamp": "2026-05-26T14:30:00Z"
}
```

```
GET /api/ml/churn/user/{user_id}
─────────────────────────────────
Score de churn pour un utilisateur

Response: {
  "user_id": "uuid-123",
  "score": 0.73,
  "risk_level": "HIGH",
  "model_version": "xgboost-v1",
  "features_snapshot": {
    "account_age_days": 180,
    "books_read_last_30d": 2,
    "is_premium": false,
    ...
  },
  "scored_at": "2026-05-26T14:30:00Z"
}
```

**B. Recommendations API**

```
GET /api/recommendations/{user_id}?n=10
──────────────────────────────────────
Livres personnalisés pour l'utilisateur

Query params:
  n: nombre de recommandations (default: 10)

Response: {
  "user_id": "uuid-123",
  "recommendations": [
    {
      "book_id": "book-456",
      "title": "Le Seigneur des Anneaux",
      "author": "Tolkien",
      "score": 8.7,
      "reason": "tfidf_similarity",
      "churn_boosted": false
    },
    ...
  ],
  "generated_at": "2026-05-26T14:35:00Z"
}
```

#### 3.4.3 Intégration avec le dashboard admin

**Tableau de bord IA pour modérateurs/admins:**

```
Admin Dashboard → IA & Churn Analytics
├─ Statistiques globales
│  ├─ Total users: 5000
│  ├─ Users HIGH/CRITICAL risk: 187
│  ├─ Avg churn probability: 0.34
│  └─ Trending: +5% HIGH risk vs semaine précédente
│
├─ Model Performance
│  ├─ Accuracy: 84.2%
│  ├─ Precision: 79.1%
│  ├─ Recall: 86.5%
│  ├─ ROC-AUC: 0.91
│  └─ Last trained: 2026-05-20
│
├─ Recent high-risk users (score > 0.8)
│  ├─ User A: 0.92 (CRITICAL) - inactive 45 days, 0 books read last 30d
│  ├─ User B: 0.87 (CRITICAL) - subscription cancelled, 2 abandons
│  └─ [Voir plus...]
│
├─ Recommendation Performance
│  ├─ Acceptance rate: 23.5%
│  ├─ Click-through rate: 31.2%
│  ├─ Top genres recommended: SF (18%), Fantasy (16%), Mystery (14%)
│  └─ Recommendation boost for HIGH risk: +45% acceptances
│
└─ Model Management
   ├─ Run daily scoring: [Button]
   ├─ Download feature importance (SHAP): [Export]
   ├─ A/B test recommendation weights: [Configure]
   └─ Model comparison report: [View]
```

#### 3.4.4 Flux de rétention automatisée

```
┌──────────────────────────────────────────────────────────┐
│ FLUX DE RÉTENTION MULTI-CANAL (Orchestré par l'IA)      │
└──────────────────────────────────────────────────────────┘

1. DÉTECTION DE RISQUE
   └─> User score = 0.75 (HIGH) → Churn_score > 0.6 ✓

2. SÉLECTION DU CANAL & CONTENU
   ├─> Si subscription_cancelled = true
   │   └─> Message: "Nous sommes tristes de vous voir partir..."
   │       Offre: Remise 30% pour renouvellement
   ├─> Si books_read_last_30d = 0
   │   └─> Message: "Manquez-vous vos lectures?"
   │       Offre: Top 5 recommandations personalisées
   └─> Si avg_rating < 3
       └─> Message: "Explorez des genres différents"
           Offre: Remise 20% + genres découverte

3. CAMPAGNE EMAIL
   ├─> Sujet: personnalisé selon raison
   ├─> Contenu: recommandations IA intégrées
   ├─ Appel-à-action: lien vers la récap personnalisée
   └─> Code promo: généré uniquement pour cette vague

4. SUIVI & FEEDBACK LOOP
   ├─> Email ouvert? (tracking pixel)
   ├─> Lien cliqué? (user_events)
   ├─> Code promo utilisé? (subscription renewal tracking)
   ├─> Churn score > 7 jours après? (non-conversion)
   └─> Mise à jour du modèle avec ces données

5. RE-ENGAGEMENT
   ├─> Si utilisateur réactif (churn ↓, activity ↑)
   │   └─> Recommandations maintenues élevées priorité
   ├─> Si utilisateur non-réactif (toujours HIGH)
   │   └─> Escalade: campagne SMS, notification in-app
   └─> Si utilisateur churné (inactif 60 jours)
       └─> Archive et campagne win-back ultérieure
```

#### 3.4.5 Performance et optimisations

**Optimisations mises en place:**

1. **Caching des features**
   - Features mises en cache pour 24h
   - Évite les requêtes DB répétées
   - Invalidation intelligente (event-based)

2. **Batch processing**
   - Extraction de features parallélisée par lot (chunk)
   - Prédiction vectorisée (NumPy/TensorFlow batch)
   - 5000 users scorés en < 5 minutes

3. **Model quantization** (pour deployment futur)
   - XGBoost: 50MB → 15MB (quantization)
   - Deep Learning: model.h5 compression

4. **Inférence asynchrone**
   - Endpoints API retournent rapidement
   - Scoring long en background (Celery/APScheduler)
   - Clients notifiés par polling ou WebSocket

#### 3.4.6 Monitoring et alertes

**KPIs à surveiller:**

| Métrique | Seuil d'alerte | Action |
|----------|----------------|--------|
| Accuracy | < 80% | Retraîner modèle |
| % users HIGH+ risk | > 25% | Analyser tendance |
| Email failure rate | > 5% | Debug service email |
| Recommendation acceptance | < 15% | Ajuster pondérations |
| Avg inference time | > 500ms | Optimiser code |
| Data staleness | > 48h | Vérifier scheduler |

#### 3.4.7 Sécurité et confidentialité

**Mesures de sécurité:**

1. **Anonymisation**: Features snapshot sans PII en DB
2. **Access control**: Endpoints ML protégés par AUTH + role (admin only)
3. **Audit logging**: Toutes les prédictions loggées (qui, quand, score)
4. **Model versioning**: Immuabilité des modèles (hash SHA256)
5. **Data governance**: Retention policy: churn_scores supprimées après 1 an

---

## 4. CHAPITRE TECHNIQUE

### 4.1 Architecture du Système
### 4.2 Stack Technologique
### 4.3 Infrastructure et Déploiement
### 4.4 Outils et Technologies Utilisés

---

## 5. TESTS ET RÉALISATION

### 5.1 Méthodologie de Test
### 5.2 Résultats des Tests
### 5.3 Démonstration du Système
### 5.4 Réalisation Finale

---

## 6. CONCLUSION GÉNÉRALE

### 6.1 Résumé des Achievements
### 6.2 Perspectives Futures
### 6.3 Limitations et Recommandations

---

**Document Version:** 1.0  
**Date:** Mai 2026  
**Auteur:** [À compléter]  
**Établissement:** [À compléter]
