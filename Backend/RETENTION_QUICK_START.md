# 📧 Système de Rétention - Résumé d'Implémentation

## ✅ Ce qui a été implémenté

### 1. **Service d'Emails** (`email_service.py`)
- Intégration SendGrid pour l'envoi fiable
- Génération de templates HTML personnalisés
- Recommandations de livres basées sur les genres préférés
- Codes de réduction uniques (STAY20, STAY25, etc.)
- Suivi des opens et des clics

### 2. **API Endpoints** (`routers/retention.py`)
```
GET    /api/retention/high-risk-users    → Liste des users à risque
POST   /api/retention/trigger-campaign    → Lancer une campagne
POST   /api/retention/send-email          → Envoyer un email manuel
POST   /api/retention/run-daily           → Exécuter la détection quotidienne
GET    /api/retention/stats               → Voir les statistiques
POST   /api/retention/track-event         → Webhook pour le suivi
```

### 3. **Intégration au Daily Job**
```
Chaque jour à 2h du matin:
1. Calcule le churn_score pour tous les users
2. Détecte les users avec score > 0.6
3. Génère des emails personnalisés
4. Envoie via SendGrid
5. Enregistre dans retention_actions
```

### 4. **Email Personnalisé**
```
✨ Bonjour [Prénom],

Nous avons remarqué que votre engagement diminue.

🎁 OFFRE EXCLUSIVE: [20-25]% de réduction
   Code: STAY[%]
   Valable 7 jours

📚 Nos recommandations pour vous:
   • Titre 1 (Genre préféré)
   • Titre 2 (Genre préféré)
   • Titre 3 (Genre préféré)

[Bouton CTA]
```

## 🔧 Configuration Requise

### 1. SendGrid
```bash
# 1. Créer un compte sur https://sendgrid.com
# 2. Vérifier votre domaine
# 3. Générer une API Key
# 4. Ajouter au .env
SENDGRID_API_KEY=SG.xxxxx...
EMAIL_FROM=noreply@booktrack.io
FRONTEND_URL=http://localhost:3000
```

### 2. Installation
```bash
cd backend
pip install sendgrid
# Ou
pip install -r requirements.txt  # sendgrid inclus
```

## 📊 Flux de Données

```
┌─────────────────────────────────────────────────────┐
│         Daily Churn Detection (2h00)                │
│         run_daily_churn_scoring()                   │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │ Users: score > 0.6?    │
        │ (HIGH/CRITICAL risk)   │
        └───────────┬────────────┘
                    │
         ┌──────────▼──────────┐
         │ get_high_churn_users │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────────────┐
         │ send_retention_email()      │
         │ • HTML template            │
         │ • Recommended books        │
         │ • Discount code            │
         └──────────┬──────────────────┘
                    │
         ┌──────────▼──────────────────┐
         │  SendGrid API               │
         │  (Envoi fiable + suivi)     │
         └──────────┬──────────────────┘
                    │
         ┌──────────▼──────────────────┐
         │ retention_actions table      │
         │ • SENT / FAILED            │
         │ • date_envoi               │
         │ • date_ouverture           │
         │ • date_clic                │
         └─────────────────────────────┘
```

## 🚀 Utilisation

### Mode Automatique (Par défaut)
```python
# Dans main.py - Daily job à 2h du matin
run_daily_churn_scoring(db, send_emails=True)
# Automatiquement: détection + emails
```

### Mode Manuel - via API

**1. Voir les utilisateurs à risque**
```bash
curl http://localhost:8000/api/retention/high-risk-users
```

**2. Déclencher une campagne**
```bash
curl -X POST http://localhost:8000/api/retention/trigger-campaign \
  -H "Content-Type: application/json" \
  -d '{"discount_percent": 20}'
```

**3. Envoyer un email à un user spécifique**
```bash
curl -X POST http://localhost:8000/api/retention/send-email \
  -H "Content-Type: application/json" \
  -d '{"user_id": "uuid-here", "discount_percent": 25}'
```

**4. Voir les statistiques**
```bash
curl http://localhost:8000/api/retention/stats?days=30
```

## 📈 Métriques Suivies

| Métrique | Description |
|----------|-------------|
| **Emails Sent** | Nombre d'emails envoyés avec succès |
| **Open Rate** | % d'emails ouverts |
| **Click Rate** | % de clics sur les liens |
| **Conversions** | Utilisateurs qui ont utilisé le code |

## 📚 Documentation

Voir [RETENTION_EMAILS.md](./RETENTION_EMAILS.md) pour:
- Configuration complète
- Tous les endpoints API détaillés
- Troubleshooting
- Personnalisation avancée
- Exemple d'intégration frontend

## 🛠️ Fichiers Modifiés

| Fichier | Changement |
|---------|-----------|
| `services/churn_service.py` | +Email trigger |
| `services/email_service.py` | ✨ NOUVEAU |
| `routers/retention.py` | ✨ NOUVEAU |
| `main.py` | +retention router |
| `requirements.txt` | +sendgrid |
| `.env` | +SendGrid config |

## ⚡ Test Rapide

```bash
# 1. Vérifier la configuration
grep SENDGRID .env

# 2. Vérifier les users à risque
curl http://localhost:8000/api/retention/high-risk-users

# 3. Lancer une détection manuelle
curl -X POST http://localhost:8000/api/retention/run-daily

# 4. Voir les résultats
curl http://localhost:8000/api/retention/stats
```

## 🔐 Sécurité

- ✅ API keys en .env (jamais hardcodées)
- ✅ Validation des UUIDs utilisateurs
- ✅ Gestion des erreurs gracieuse
- ✅ Logs des envois/erreurs
- ✅ Rate limiting via SendGrid

## 📞 Webhook SendGrid

Pour activer le suivi des opens/clics:

1. Aller dans SendGrid Dashboard
2. Settings → Mail Send → Event Webhook
3. URL: `https://your-api.com/api/retention/track-event`
4. Cocher "Open" et "Click"

## 🎯 Cas d'Usage

| Cas | Solution |
|-----|----------|
| User a abandonné après 1 mois | Détection auto → Email |
| User lit moins que d'habitude | Détection auto → Email |
| Campagne d'été | Trigger manuel → Tous |
| User spécifique à risque | send-email endpoint |
| Vérifier efficacité | stats endpoint |

---

**Status**: ✅ Prêt à utiliser
**Configuration requise**: SendGrid API Key
**Documentation**: [RETENTION_EMAILS.md](./RETENTION_EMAILS.md)
