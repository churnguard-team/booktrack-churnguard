# 🔔 Système de Notifications In-App - BookTrack

## Vue d'ensemble

Le système de notifications in-app informe les utilisateurs en temps réel quand:
- ✨ **Un nouveau livre d'un auteur préféré est ajouté**
- 📚 **Un livre du genre préféré vient de sortir**
- 💌 **Des recommandations personnalisées**
- 🎯 **Des messages promotionnels ou système**

## Architecture

```
Création d'un nouveau livre
        ↓
POST /books
        ↓
notify_new_book_matches()
        ↓
Cherche les utilisateurs avec genres/auteurs correspondants
        ↓
Crée des notifications in-app
        ↓
Table notifications
        ↓
Frontend: GET /api/notifications/user/{user_id}
```

## Données

La table `notifications` stocke:
- `id`: UUID unique
- `user_id`: Utilisateur destinataire
- `type`: RECOMMENDATION | RETENTION | SYSTEM | PROMOTIONAL
- `titre`: Titre court
- `contenu`: Message détaillé
- `is_read`: Statut de lecture
- `lu_at`: Timestamp de lecture
- `metadata`: JSON (book_id, book_title, etc.)
- `created_at`: Date de création

Les utilisateurs ont:
- `genres_preferes`: Array de genres (ex: ["Science-Fiction", "Thriller"])

## API Endpoints

### 1. Récupérer les notifications
```
GET /api/notifications/user/{user_id}?unread_only=false&limit=20
```

**Réponse**:
```json
{
  "status": "success",
  "count": 5,
  "unread_only": false,
  "notifications": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "type": "RECOMMENDATION",
      "titre": "✨ Un nouveau livre de Stephen King",
      "contenu": "'The Stand (2024)' vient d'être ajouté à BookTrack.",
      "is_read": false,
      "lu_at": null,
      "metadata": {
        "book_id": "uuid",
        "book_title": "The Stand",
        "book_auteur": "Stephen King",
        "type": "new_book_match"
      },
      "created_at": "2026-05-25T14:30:00"
    }
  ]
}
```

### 2. Récupérer les notifications non-lues
```
GET /api/notifications/user/{user_id}/unread
```

**Réponse**:
```json
{
  "status": "success",
  "unread_count": 3,
  "notifications": [...]
}
```

### 3. Statistiques des notifications
```
GET /api/notifications/user/{user_id}/stats
```

**Réponse**:
```json
{
  "status": "success",
  "total": 25,
  "unread": 3,
  "recommendations": 15,
  "retention": 5,
  "promotional": 5,
  "last_notification_at": "2026-05-25T14:30:00"
}
```

### 4. Marquer comme lue
```
PATCH /api/notifications/{notification_id}/read
```

**Réponse**:
```json
{
  "status": "success",
  "notification_id": "uuid",
  "is_read": true
}
```

### 5. Marquer toutes comme lues
```
PATCH /api/notifications/user/{user_id}/read-all
```

**Réponse**:
```json
{
  "status": "success",
  "user_id": "uuid",
  "notifications_marked": 3
}
```

### 6. Supprimer une notification
```
DELETE /api/notifications/{notification_id}
```

**Réponse**:
```json
{
  "status": "success",
  "notification_id": "uuid",
  "deleted": true
}
```

### 7. Supprimer toutes les notifications
```
DELETE /api/notifications/user/{user_id}/delete-all
```

**Réponse**:
```json
{
  "status": "success",
  "user_id": "uuid",
  "notifications_deleted": 25
}
```

### 8. Créer une notification (Admin)
```
POST /api/notifications/
?user_id=uuid

{
  "titre": "Bienvenue sur BookTrack!",
  "contenu": "Commencez votre aventure de lecture...",
  "notification_type": "SYSTEM",
  "metadata": {
    "onboarding": true
  }
}
```

## Flux Automatique - Nouveau Livre

Quand un admin crée un nouveau livre:

```
POST /books
{
  "title": "The Stand (2024)",
  "auteur": "Stephen King",
  "genre_ids": [...],
  ...
}
        ↓
↳ Book créé avec ID xxx et genres yyy
        ↓
↳ notify_new_book_matches() appelé
        ↓
SELECT * FROM users WHERE
  - genres_preferes[] contient un des genres du livre
  - OU genres_preferes[] contient l'auteur (si dans l'array)
        ↓
↳ Créer une notification pour chaque match:
   "✨ Un nouveau livre de Stephen King"
   "'The Stand' vient d'être ajouté à BookTrack."
        ↓
Frontend: Récupère les notifications via /api/notifications/user/{user_id}
```

## Exemples d'Intégration Frontend

### React - Récupérer les notifications
```typescript
// Récupérer les notifications non-lues
const response = await fetch(`/api/notifications/user/${userId}/unread`);
const { notifications } = await response.json();

// Afficher le badge avec le nombre
<div>
  Notifications ({notifications.length})
  {notifications.map(n => (
    <div key={n.id} className={n.is_read ? 'read' : 'unread'}>
      <h4>{n.titre}</h4>
      <p>{n.contenu}</p>
      <button onClick={() => markAsRead(n.id)}>✓</button>
    </div>
  ))}
</div>
```

### React - Marquer comme lue
```typescript
async function markAsRead(notificationId: string) {
  const response = await fetch(
    `/api/notifications/${notificationId}/read`,
    { method: 'PATCH' }
  );
  // Recharger les notifications
}
```

### React - Marquer toutes comme lues
```typescript
async function markAllAsRead() {
  const response = await fetch(
    `/api/notifications/user/${userId}/read-all`,
    { method: 'PATCH' }
  );
  // Recharger les notifications
}
```

### Real-time avec WebSocket (optionnel)
```typescript
// Pour les mises à jour en temps réel
const ws = new WebSocket(`ws://localhost:8000/ws/notifications/${userId}`);

ws.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  // Afficher une alerte toast
  showNotification(notification);
};
```

## Configuration des Genres Préférés

### Sauvegarder les genres lors de l'onboarding
```typescript
// Frontend
PATCH /users/{user_id}/profile
{
  "genres_preferes": ["Science-Fiction", "Thriller", "Mystery"]
}
```

### Ou ajouter automatiquement via les actions
Quand l'utilisateur ajoute un livre à sa bibliothèque, on pourrait aussi tracker le genre implicitement.

## Optimisation Performance

### Indices SQL (déjà créés)
```sql
CREATE INDEX idx_notifs_user ON notifications(user_id);
CREATE INDEX idx_notifs_is_read ON notifications(user_id, is_read);
```

### Pagination
```
GET /api/notifications/user/{user_id}?limit=20
-- Les 20 plus récentes notifications
```

### Requête optimisée
```sql
SELECT * FROM notifications
WHERE user_id = 'uuid'
ORDER BY created_at DESC
LIMIT 20;
-- Milliseconds grâce aux indices
```

## Cas d'Usage

| Cas | Déclencheur | Type |
|-----|-----------|------|
| Nouveau livre d'auteur | nouveau livre créé | RECOMMENDATION |
| Genre préféré | nouveau livre créé | RECOMMENDATION |
| Alerte churn | score > 0.6 | RETENTION |
| Promo flash | Admin trigger | PROMOTIONAL |
| Bienvenue | Inscription | SYSTEM |

## Migration des Données (si nécessaire)

Si la table `notifications` n'existe pas, créez-la:

```sql
CREATE TYPE notification_type AS ENUM (
  'RECOMMENDATION',
  'RETENTION',
  'SYSTEM',
  'PROMOTIONAL'
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  titre VARCHAR(255) NOT NULL,
  contenu TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  lu_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_notifs_user ON notifications(user_id);
CREATE INDEX idx_notifs_is_read ON notifications(user_id, is_read);
```

## Prochaines Améliorations

- [ ] **Push Notifications**: Envoyer des push quand une notification est créée
- [ ] **Email Summaries**: Email récapitulatif des notifications (daily digest)
- [ ] **Preferences**: Permettre à l'utilisateur de choisir quels types de notifications recevoir
- [ ] **Real-time WebSocket**: Notifications en temps réel au lieu de sondage
- [ ] **Notification Center UI**: Interface graphique complète
- [ ] **Unsubscribe Links**: Liens pour se désabonner de certains types

---

## Documentation Connexe

- Voir [RETENTION_EMAILS.md](./RETENTION_EMAILS.md) pour les emails de rétention
- Voir [CONFIG_ADVANCED.md](./CONFIG_ADVANCED.md) pour la configuration avancée
