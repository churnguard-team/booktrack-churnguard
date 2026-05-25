# 📧 Système d'Emails de Rétention - BookTrack

## Vue d'ensemble

Le système d'emails de rétention ciblés détecte automatiquement les utilisateurs à risque de churn et leur envoie des emails personnalisés avec des offres de réduction pour les encourager à rester engagés.

### Architecture

```
Detection Quotidienne (2h du matin)
        ↓
run_daily_churn_scoring() [churn_service.py]
        ↓
Utilisateurs avec score > 0.6
        ↓
send_retention_email() [email_service.py]
        ↓
SendGrid API
        ↓
Email personnalisé + suivi
```

## Configuration

### 1. Installation des dépendances

```bash
pip install sendgrid
```

Ou mettez à jour `requirements.txt` (déjà fait):
```
sendgrid
```

### 2. Configuration SendGrid

#### A. Créer un compte SendGrid
1. Allez sur https://sendgrid.com
2. Créez un compte gratuit ou payant
3. Vérifiez votre domaine d'envoi
4. Générez une API Key

#### B. Configurer le .env
```bash
# SendGrid Configuration for Retention Emails
SENDGRID_API_KEY=your-sendgrid-api-key-here
EMAIL_FROM=noreply@booktrack.io
EMAIL_FROM_NAME=BookTrack Team

# Frontend URL for email links
FRONTEND_URL=http://localhost:3000

# Logo and branding
LOGO_URL=https://booktrack.io/logo.png
```

## Flux de Travail

### Daily Churn Detection + Email (Automatique)

**Quand**: Chaque jour à 2h00 du matin (configurable dans `main.py`)

**Processus**:
1. ✅ Calcul du churn_score pour TOUS les utilisateurs
2. ✅ Stockage dans la table `churn_scores`
3. ✅ Détection des utilisateurs avec score > 0.6
4. ✅ Génération des emails personnalisés
5. ✅ Envoi via SendGrid
6. ✅ Enregistrement dans `retention_actions`

**Code** (dans `main.py`):
```python
def _daily_churn_job() -> None:
    db = SessionLocal()
    try:
        # send_emails=True active les emails automatiques
        result = run_daily_churn_scoring(db, send_emails=True)
        print(f"[churn] daily detection executed: {result}")
    finally:
        db.close()
```

### Résultat du Job

```json
{
  "status": "ok",
  "scored": 150,           // Utilisateurs traités
  "errors": 2,             // Erreurs de prédiction
  "emails_sent": 12,       // Emails envoyés avec succès
  "emails_failed": 1,      // Emails échoués
  "high_risk_users_detected": 13
}
```

## API Endpoints

### 1. Utilisateurs à risque
```
GET /api/retention/high-risk-users?threshold=0.6&limit=50
```

Retourne les utilisateurs avec churn_score >= seuil.

**Réponse**:
```json
{
  "status": "success",
  "count": 13,
  "threshold": 0.6,
  "users": [
    {
      "user_id": "uuid",
      "nom": "Dupont",
      "prenom": "Jean",
      "email": "jean@example.com",
      "churn_score": 0.75,
      "niveau_risque": "HIGH",
      "genres_preferes": ["Science-Fiction", "Thriller"],
      "abonnement": "PREMIUM"
    }
  ]
}
```

### 2. Déclencher une campagne manuelle
```
POST /api/retention/trigger-campaign
Content-Type: application/json

{
  "discount_percent": 20,
  "message": null  // Optionnel
}
```

**Résultat**:
```json
{
  "status": "campaign_executed",
  "campaign_type": "retention_emails",
  "discount_percent": 20,
  "total_users": 13,
  "emails_sent": 12,
  "emails_failed": 1,
  "threshold": 0.6,
  "results": [
    {
      "user_id": "uuid",
      "email": "user@example.com",
      "status": "sent",
      "discount_code": "STAY20"
    }
  ]
}
```

### 3. Envoyer un email manuel
```
POST /api/retention/send-email
Content-Type: application/json

{
  "user_id": "uuid",
  "discount_percent": 25
}
```

### 4. Exécuter la détection quotidienne manuellement
```
POST /api/retention/run-daily
```

Lance le job de détection et d'envoi d'emails immédiatement (au lieu d'attendre 2h du matin).

### 5. Statistiques des campagnes
```
GET /api/retention/stats?days=30
```

**Réponse**:
```json
{
  "period_days": 30,
  "total_sent": 250,
  "total_opened": 125,
  "total_clicked": 45,
  "open_rate_percent": 50.0,
  "ctr_percent": 18.0,
  "breakdown": [
    {
      "status": "SENT",
      "action_type": "EMAIL_RETENTION",
      "total": 250,
      "opened": 125,
      "clicked": 45
    }
  ]
}
```

## Contenu de l'Email

### Personnalisation

L'email inclut automatiquement:
- ✅ Prénom de l'utilisateur
- ✅ Score de churn et niveau de risque
- ✅ Code de réduction unique (ex: STAY20)
- ✅ Recommandations de livres personnalisées (top 3 basés sur genres préférés)
- ✅ Appel à l'action personnalisé
- ✅ Design professionnel responsive

### Exemple visuel

```
┌─────────────────────────────────────┐
│  Nous vous manquez ! 💙             │
├─────────────────────────────────────┤
│ Bonjour Jean,                       │
│                                     │
│ Nous avons remarqué que votre       │
│ engagement avec BookTrack a         │
│ diminué récemment.                  │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Offre exclusive pour vous  │   │
│  │                             │   │
│  │        20% de réduction     │   │
│  │                             │   │
│  │   Code: STAY20              │   │
│  │   Valable 7 jours          │   │
│  └─────────────────────────────┘   │
│                                     │
│ 📚 Recommandations personnalisées   │
│ • Les Misérables                    │
│ • Le Seigneur des Anneaux           │
│ • 1984                              │
│                                     │
│  [Découvrir les recommandations]    │
└─────────────────────────────────────┘
```

## Base de Données

### Table: retention_actions

```sql
CREATE TABLE retention_actions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  churn_score_id UUID,
  type_action action_type NOT NULL,     -- 'EMAIL_RETENTION'
  statut action_status DEFAULT 'PENDING', -- 'SENT', 'FAILED', 'OPENED', 'CLICKED'
  contenu TEXT,                          -- Contenu HTML de l'email
  sujet VARCHAR(255),                    -- Sujet de l'email
  date_envoi TIMESTAMP,                  -- Quand l'email a été envoyé
  date_ouverture TIMESTAMP,              -- Quand l'email a été ouvert
  date_clic TIMESTAMP,                   -- Quand un lien a été cliqué
  metadata JSONB,                        -- Extra data (discount_code, etc.)
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indices pour performance
CREATE INDEX idx_retention_user ON retention_actions(user_id);
CREATE INDEX idx_retention_statut ON retention_actions(statut);
CREATE INDEX idx_retention_type ON retention_actions(type_action);
```

## Suivi des Emails (Tracking)

### Webhook SendGrid

Pour tracker les opens et les clics:

1. Allez dans SendGrid Dashboard → Settings → Mail Send Settings
2. Activez "Event Webhook"
3. Configurez l'URL: `https://your-api.com/api/retention/track-event`
4. Cochez "Open" et "Click" events

### Réponse Webhook

```python
POST /api/retention/track-event
Content-Type: application/json

{
  "action_id": "uuid",
  "event_type": "opened"  // ou "clicked"
}
```

Cela met à jour `date_ouverture` ou `date_clic` dans la base de données.

## Configuration Avancée

### Personnaliser le seuil et la fréquence

**Modifier le seuil de churn** (actuellement 0.6):

Dans `services/email_service.py`, ligne ~15:
```python
if score > 0.6 and send_emails:  # Modifier 0.6 à votre seuil
    high_risk_users.append((user_id, score))
```

**Modifier l'heure du job quotidien** (actuellement 2h du matin):

Dans `backend/main.py`, ligne ~48:
```python
scheduler.add_job(
    _daily_churn_job,
    CronTrigger(hour=2, minute=0),  # Modifier à votre heure préférée
    id="daily_churn_detection",
    replace_existing=True,
)
```

### Désactiver les emails automatiques

Si vous voulez contrôler manuellement:

**Option 1**: Désactiver dans le job
```python
result = run_daily_churn_scoring(db, send_emails=False)
```

**Option 2**: Déclencher manuellement via API
```bash
curl -X POST http://localhost:8000/api/retention/trigger-campaign \
  -H "Content-Type: application/json" \
  -d '{"discount_percent": 20}'
```

### Personnaliser le template d'email

Le template se trouve dans `services/email_service.py`, fonction `_get_retention_email_content()`.

Vous pouvez modifier:
- Couleurs (variable `BRAND_COLOR`)
- Logo (variable `LOGO_URL`)
- Texte et message
- Layout HTML

## Troubleshooting

### ❌ Les emails ne s'envoient pas

1. **Vérifier la clé API**:
   ```python
   import os
   print(os.getenv("SENDGRID_API_KEY"))
   ```

2. **Vérifier le domaine SendGrid**:
   - Assurez-vous que le domaine dans `EMAIL_FROM` est vérifié dans SendGrid

3. **Vérifier les logs**:
   ```bash
   docker logs booktrack-backend
   ```

4. **Test manual**:
   ```bash
   curl -X POST http://localhost:8000/api/retention/send-email \
     -H "Content-Type: application/json" \
     -d '{"user_id": "your-uuid", "discount_percent": 20}'
   ```

### ❌ Les utilisateurs ne reçoivent pas les emails

1. Vérifier les adresses email dans la base de données
2. Vérifier que `churn_scores.is_latest = true` pour les utilisateurs
3. Vérifier le score de churn: `SELECT * FROM churn_scores WHERE user_id = 'uuid' ORDER BY created_at DESC LIMIT 1`

### ✅ Les emails vont au spam

1. Vérifier l'authentification de domaine (SPF, DKIM)
2. Utiliser un domaine de confiance (ex: notifications@booktrack.io au lieu de noreply@)
3. Tester avec https://mail-tester.com

## Exemple d'intégration

### Python - Déclencher une campagne
```python
import requests

response = requests.post(
    "http://localhost:8000/api/retention/trigger-campaign",
    json={"discount_percent": 25}
)
print(response.json())
```

### Frontend - Afficher les stats
```typescript
const response = await fetch('/api/retention/stats?days=7');
const stats = await response.json();

console.log(`Open Rate: ${stats.open_rate_percent}%`);
console.log(`Click Rate: ${stats.ctr_percent}%`);
```

## KPIs à suivre

| Métrique | Valeur Cible | Formule |
|----------|-------------|---------|
| **Open Rate** | > 30% | opened / sent × 100 |
| **Click-Through Rate** | > 10% | clicked / sent × 100 |
| **Conversion Rate** | > 2% | purchases / clicked × 100 |
| **Unsubscribe Rate** | < 1% | unsubscribes / sent × 100 |

## Coûts SendGrid

- **Plan gratuit**: 100 emails/jour
- **Plan payant**: À partir de $14.95/mois
- **Volume**: ~$0.10 pour 1000 emails

Pour 100 utilisateurs à risque/jour → ~$30/mois

---

## Prochaines améliorations

- [ ] A/B testing des sujets/réductions
- [ ] Segmentation par genre préféré
- [ ] Machine learning pour optimiser le taux de réduction
- [ ] Multi-channel: SMS, push notifications
- [ ] Win-back campaigns pour utilisateurs churned
