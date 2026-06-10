# Rapport de projet

## BookTrack ChurnGuard

### 1. Présentation générale

BookTrack ChurnGuard est une plateforme web de gestion de bibliothèque et de rétention des lecteurs. Le projet combine un catalogue de livres, un espace utilisateur, un back-office d’administration et une couche d’intelligence artificielle dédiée à la détection du churn.

L’objectif principal est d’identifier les utilisateurs à risque d’abandon, puis de déclencher des actions de fidélisation adaptées comme des recommandations, des notifications ou des campagnes email.

### 2. Objectifs du projet

- Centraliser la consultation et la gestion d’une bibliothèque de livres.
- Permettre aux utilisateurs de constituer leur bibliothèque personnelle.
- Proposer des recommandations personnalisées.
- Détecter les signaux de désengagement des utilisateurs.
- Automatiser des actions de rétention.
- Offrir un espace d’administration pour gérer livres et utilisateurs.

### 3. Architecture technique

Le projet suit une architecture full-stack séparée en trois blocs principaux :

- **Frontend** : application Next.js avec React 19, TypeScript et NextAuth.
- **Backend** : API REST développée avec FastAPI et SQLAlchemy.
- **Base de données** : PostgreSQL.

Le déploiement local est orchestré par `docker-compose.yml`, qui lance :

- PostgreSQL
- le backend FastAPI
- le frontend Next.js

### 4. Fonctionnalités principales

#### 4.1 Côté utilisateur

- Consultation du catalogue de livres.
- Filtrage par auteur, genre, type, année et recherche textuelle.
- Ajout de livres à sa bibliothèque personnelle.
- Marquage en favori.
- Gestion du statut de lecture.
- Consultation des recommandations personnalisées.
- Inscription, connexion et onboarding.
- Profil utilisateur avec genres préférés.

#### 4.2 Côté administration

- Gestion des livres.
- Gestion des utilisateurs.
- Consultation de statistiques.
- Espace modérateur.
- Suppression et ajout de données selon les permissions.

#### 4.3 Monétisation

- Système d’abonnement via Stripe.
- Passage du plan FREE au plan PREMIUM.
- Gestion des webhooks Stripe.
- Endpoint de test pour activer un statut premium en environnement de développement.

#### 4.4 Rétention et engagement

- Détection quotidienne du churn via un scheduler.
- Envoi automatique d’emails de rétention pour les profils à risque.
- Notifications in-app déclenchées par certains événements métier.
- Recommandations basées sur les préférences et l’historique.

### 5. Intelligence artificielle

Le projet s’appuie sur une logique de prédiction du churn et de recommandation de contenu.

Les documents du projet indiquent une comparaison de plusieurs approches de machine learning :

- régression logistique
- random forest
- XGBoost
- deep learning

Le modèle retenu pour la production est présenté comme XGBoost dans la documentation d’architecture.

Le système de churn s’appuie sur :

- l’âge du compte
- l’activité récente
- les livres lus
- les favoris
- les avis et commentaires
- les préférences de genres
- le statut d’abonnement

Les scores sont stockés en base et utilisés pour déclencher des actions de fidélisation.

### 6. Modèle de données

Les principales entités observées dans le code sont :

- `users`
- `admins`
- `books`
- `genres`
- `user_books`
- `subscriptions`
- `book_comments`

Les documents d’architecture mentionnent aussi les concepts suivants :

- scores de churn
- actions de rétention
- notifications

### 7. Frontend

Le frontend est construit avec le dossier `app/` de Next.js et contient :

- une page d’accueil redirigeant vers `/books`
- un catalogue de livres
- des pages de connexion et d’inscription
- un onboarding
- un espace utilisateur
- un espace admin
- un dashboard modérateur
- des pages paiement `success` et `cancel`
- une logique d’internationalisation `fr`, `en`, `ar`

Le projet utilise aussi :

- `NextAuth` pour la gestion de session
- un provider d’internationalisation
- des composants de navigation, carrousel, commentaires et tableaux de bord

### 8. Backend

Le backend est structuré autour de plusieurs routeurs :

- authentification
- authentification Google
- livres / bibliothèque utilisateur
- profil utilisateur
- commentaires
- recommandations
- churn
- rétention email
- notifications
- modération
- dashboard
- paiement Stripe
- scraping

Le fichier `main.py` montre aussi :

- l’enregistrement des routes API
- la configuration CORS
- un scheduler planifié à 2h du matin pour lancer le scoring churn quotidien

### 9. Points forts du projet

- Architecture claire et modulaire.
- Séparation frontend / backend / base de données.
- Présence de fonctionnalités métier avancées.
- Intégration d’un vrai workflow de rétention.
- Gestion d’abonnement Stripe.
- Support multilingue.
- Base documentaire assez riche.

### 10. Limites observées

- Le projet repose sur beaucoup de fonctionnalités, ce qui augmente la complexité de maintenance.
- Plusieurs composants avancés dépendent de variables d’environnement et de services externes.
- La documentation est plus riche que certaines parties du code, donc une vérification fonctionnelle complète reste utile.
- Les performances et les métriques IA semblent surtout décrites dans les documents d’architecture, et doivent idéalement être validées par des tests d’exécution.

### 11. Conclusion

BookTrack ChurnGuard est un projet full-stack ambitieux qui combine gestion de bibliothèque, personnalisation, abonnement payant, notifications et intelligence artificielle.

Son point fort est la cohérence entre les besoins métier et les mécanismes techniques mis en place pour retenir les utilisateurs et enrichir leur expérience.

Si tu veux, je peux aussi te préparer :

- un **rapport plus académique** avec introduction, problématique, méthodologie et conclusion
- un **résumé d’une page**
- un **rapport de soutenance oral**
- une **version en français formel prête à imprimer**
