# Configuration Exemple - Système de Rétention

## .env Configuration Complète

```env
# === DATABASE ===
POSTGRES_PASSWORD=1234
POSTGRES_USER=postgres
POSTGRES_DB=bookdatabase
DATABASE_URL=postgresql://postgres:1234@localhost:5432/bookdatabase

# === SENDGRID EMAIL SERVICE ===
# 1. Créer un compte: https://sendgrid.com
# 2. Générer API Key: https://app.sendgrid.com/settings/api_keys
SENDGRID_API_KEY=SG.1234567890abcdefghijk_lmno_pqrst_uvwxyz

# Email sender configuration
EMAIL_FROM=noreply@booktrack.io
EMAIL_FROM_NAME=BookTrack Team

# Frontend URL for email links
FRONTEND_URL=http://localhost:3000

# Logo and branding
LOGO_URL=https://booktrack.io/logo.png
BRAND_COLOR=#2563eb

# === OPTIONAL: SMS RETENTION (FUTURE) ===
# TWILIO_ACCOUNT_SID=your-sid
# TWILIO_AUTH_TOKEN=your-token
# SMS_FROM=+1234567890

# === OPTIONAL: SENDGRID WEBHOOK ===
# For email event tracking (opens, clicks)
# Configure in SendGrid Dashboard → Settings → Mail Send → Event Webhook
# SENDGRID_WEBHOOK_URL=https://your-api.com/api/retention/track-event
```

## Configuration Python pour SendGrid

### Basic Setup
```python
# services/email_service.py - Top of file

import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To

# Load configuration
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
FROM_EMAIL = os.getenv("EMAIL_FROM", "noreply@booktrack.io")
BRAND_COLOR = os.getenv("BRAND_COLOR", "#2563eb")

# Initialize client
sg = SendGridAPIClient(SENDGRID_API_KEY)
```

## Configuration du Job Quotidien

### Modifier l'heure d'exécution

Dans `backend/main.py`:

```python
# Actuellement: 2:00 AM tous les jours
scheduler.add_job(
    _daily_churn_job,
    CronTrigger(hour=2, minute=0),  # ← Modifier ici
    id="daily_churn_detection",
    replace_existing=True,
)
```

**Exemples**:
```python
# 6:00 AM
CronTrigger(hour=6, minute=0)

# 3:30 PM (15h30)
CronTrigger(hour=15, minute=30)

# Tous les lundis à 8:00 AM
CronTrigger(day_of_week=0, hour=8, minute=0)

# Chaque 6 heures
CronTrigger(hour='*/6')

# Chaque jour à minuit
CronTrigger(hour=0, minute=0)
```

## Configuration du Seuil de Churn

### Modifier le seuil pour les emails

Dans `services/churn_service.py`:

```python
# Ligne ~50
if score > 0.6 and send_emails:  # ← Modifier le seuil
    high_risk_users.append((user_id, score))
```

**Seuils recommandés**:
- `0.5`: Plus agressif - engager les users modérément à risque
- `0.6`: Équilibré (défaut) - users clairement à risque
- `0.7`: Conservateur - seulement users très à risque

## Configuration des Remises Discount

### Personnaliser par niveau de risque

Dans `services/churn_service.py`:

```python
def run_daily_churn_scoring(db: Session, send_emails: bool = True) -> Dict[str, Any]:
    # ... code existant ...
    
    # Au lieu de discount_percent=20 statique
    # Utiliser différents discounts par niveau de risque
    
    for user_id, churn_score in high_risk_users:
        # Determine discount based on risk level
        if churn_score > 0.8:
            discount = 30  # CRITICAL risk
        elif churn_score > 0.7:
            discount = 25  # HIGH risk
        elif churn_score > 0.6:
            discount = 20  # MEDIUM risk
        else:
            discount = 15  # LOW risk
        
        result = send_retention_email(db, user_id, churn_score, discount_percent=discount)
```

## Configuration SendGrid Avancée

### 1. Vérifier le domaine

```bash
# CLI: Vérifier que noreply@booktrack.io est approuvé
# Dans SendGrid Dashboard:
# 1. Settings → Sender Authentication
# 2. Vérifier SPF et DKIM
# 3. Ajouter votre domaine
```

### 2. Configurer les Webhooks

```python
# Dans SendGrid Dashboard:
# Settings → Mail Send → Event Webhook

# Configuration JSON:
{
  "url": "https://your-api.com/api/retention/track-event",
  "enabled": true,
  "events": [
    "open",      # Utilisateur ouvre l'email
    "click",     # Utilisateur clique un lien
    "processed", # Email traité
    "dropped",   # Email rejeté
    "bounce",    # Email rejeté par serveur
    "unsubscribe" # Utilisateur se désabonne
  ]
}
```

### 3. Suivi Avancé avec Metadata

```python
# Dans send_retention_email(), avant l'envoi:

message = Mail(...)
message.metadata = {
    "user_id": user_id,
    "churn_score": str(churn_score),
    "discount_code": f"STAY{discount_percent}",
    "campaign": "retention_weekly",
    "timestamp": datetime.now().isoformat(),
}
```

## Template Email Personnalisé

### Modifier les couleurs

Dans `services/email_service.py`:

```python
def _get_retention_email_content(...):
    BRAND_COLOR = "#2563eb"  # Bleu - MODIFIER ICI
    # ou charger depuis .env
    BRAND_COLOR = os.getenv("BRAND_COLOR", "#2563eb")
```

**Couleurs suggérées**:
- Professionnel: `#2563eb` (bleu)
- Énergique: `#dc2626` (rouge)
- Calmant: `#059669` (vert)
- Modern: `#9333ea` (violet)

### Modifier le Logo

```python
LOGO_URL = os.getenv("LOGO_URL", "https://booktrack.io/logo.png")

# Dans le HTML:
<img src="{LOGO_URL}" alt="BookTrack Logo" />
```

### Modifier le Message Principal

Dans `_get_retention_email_content()`, cherchez:

```python
# Texte simple
text_content = f"""
Bonjour {user_name},

Nous avons remarqué que votre engagement avec BookTrack a diminué récemment.
← MODIFIER CETTE PARTIE
"""

# HTML content
<h1 style="...">Nous vous manquez ! 💙</h1>
← MODIFIER ÉGALEMENT ICI
```

## Configuration de Base de Données

### Vérifier la table retention_actions

```sql
-- Vérifier que la table existe
SELECT * FROM retention_actions LIMIT 1;

-- Voir les colonnes
\d retention_actions;

-- Vérifier les indices
SELECT * FROM pg_indexes WHERE tablename = 'retention_actions';
```

### Créer des vues pour les rapports

```sql
-- Emails envoyés aujourd'hui
CREATE VIEW retention_today AS
SELECT 
    user_id,
    statut,
    COUNT(*) as count
FROM retention_actions
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY user_id, statut;

-- Taux d'ouverture par jour
CREATE VIEW retention_daily_stats AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as sent,
    COUNT(CASE WHEN date_ouverture IS NOT NULL THEN 1 END) as opened,
    ROUND(COUNT(CASE WHEN date_ouverture IS NOT NULL THEN 1 END)::numeric / COUNT(*) * 100, 2) as open_rate_pct
FROM retention_actions
WHERE type_action = 'EMAIL_RETENTION'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

## Monitoring et Alertes

### Logs à surveiller

```python
# Dans main.py - Daily job
def _daily_churn_job() -> None:
    print(f"[{datetime.now()}] Starting daily churn job...")
    result = run_daily_churn_scoring(db, send_emails=True)
    print(f"[RESULT] {result}")
    # Log important metrics
    if result['emails_failed'] > 0:
        logger.warning(f"Email failures: {result['emails_failed']}")
```

### Metrics à tracker

```python
# Ajouter à vos logs/metrics:
- emails_sent (chaque jour)
- emails_failed (erreurs)
- open_rate (quotidien)
- click_rate (quotidien)
- avg_discount (par campagne)
- conversion_rate (utilisateurs qui utilisent le code)
```

## Testez votre Configuration

```bash
# 1. Vérifier les imports
python -c "from sendgrid import SendGridAPIClient; print('OK')"

# 2. Vérifier la configuration
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print(os.getenv('SENDGRID_API_KEY')[:10] + '...')"

# 3. Tester l'API SendGrid
curl -X GET https://api.sendgrid.com/v3/mail/send \
  -H "Authorization: Bearer $SENDGRID_API_KEY" \
  -H "Content-Type: application/json"

# 4. Tester l'endpoint local
curl http://localhost:8000/api/retention/high-risk-users

# 5. Tester un envoi d'email manuel
curl -X POST http://localhost:8000/api/retention/send-email \
  -H "Content-Type: application/json" \
  -d '{"user_id": "your-uuid", "discount_percent": 20}'
```

## Optimisation Performance

### Batch Processing (pour beaucoup d'utilisateurs)

```python
# Actuellement: envoi séquentiel
# Pour >100 users, considérer le traitement par batch

BATCH_SIZE = 10

for i in range(0, len(high_risk_users), BATCH_SIZE):
    batch = high_risk_users[i:i+BATCH_SIZE]
    
    # Traiter le batch en parallèle (async)
    # ou juste envoyer les emails par batch
    for user_id, score in batch:
        send_retention_email(db, user_id, score)
```

### Caching (pour les recommandations)

```python
# Cache les recommandations 24 heures
from functools import lru_cache
from datetime import datetime, timedelta

@lru_cache(maxsize=1000)
def get_recommended_books_cached(user_id: str, cache_time: int = 3600):
    # Implémenter avec Redis pour plus grand cache
    return get_recommended_books(user_id)
```

---

Voir la documentation complète dans [RETENTION_EMAILS.md](./RETENTION_EMAILS.md)
