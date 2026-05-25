# 🔔 Guide Rapide - Notifications In-App

## ⚡ Mise en Place (2 minutes)

1. **La table existe déjà** ✅ (vérifiée dans bookdatabase.sql)
2. **Service créé** ✅ (services/notification_service.py)
3. **API endpoints** ✅ (routers/notifications.py)
4. **Intégration livres** ✅ (POST /books déclenche automatiquement)

C'est prêt! Aucune installation supplémentaire requise.

## 📱 Utilisation Frontend

### Récupérer les notifications
```javascript
// React Hook
const [notifications, setNotifications] = useState([]);

useEffect(() => {
  fetch(`/api/notifications/user/${userId}`)
    .then(r => r.json())
    .then(data => setNotifications(data.notifications));
}, [userId]);

// Affichage simple
<div className="notifications">
  {notifications.map(n => (
    <NotificationItem 
      key={n.id} 
      notification={n}
      onRead={() => markAsRead(n.id)}
    />
  ))}
</div>
```

### Marquer comme lue
```javascript
async function markAsRead(notificationId) {
  await fetch(`/api/notifications/${notificationId}/read`, {
    method: 'PATCH'
  });
  // Recharger
}
```

### Badge avec nombre de non-lues
```javascript
const [unreadCount, setUnreadCount] = useState(0);

useEffect(() => {
  fetch(`/api/notifications/user/${userId}/stats`)
    .then(r => r.json())
    .then(data => setUnreadCount(data.unread));
}, []);

<Badge count={unreadCount} />
```

## 🎯 Démo

### 1. Créer un nouveau livre
```bash
curl -X POST http://localhost:8000/books \
  -H "Content-Type: application/json" \
  -d '{
    "title": "The Stand",
    "auteur": "Stephen King",
    "type": "Novel",
    "genre_ids": ["thriller-id"],
    ...
  }'
```

### 2. Les notifications sont créées automatiquement! ✨

Pour tous les utilisateurs ayant:
- Genre "thriller" dans leurs préférences
- OU "Stephen King" dans leurs préférences

### 3. Vérifier les notifications créées
```bash
curl http://localhost:8000/api/notifications/user/{user_id}
```

### 4. Voir le nombre non-lues
```bash
curl http://localhost:8000/api/notifications/user/{user_id}/stats
```

## 📊 Exemple de Réponse

```json
{
  "status": "success",
  "count": 2,
  "notifications": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "type": "RECOMMENDATION",
      "titre": "✨ Un nouveau livre de Stephen King",
      "contenu": "'The Stand' vient d'être ajouté à BookTrack.",
      "is_read": false,
      "created_at": "2026-05-25T14:30:00",
      "metadata": {
        "book_id": "uuid",
        "book_title": "The Stand",
        "book_auteur": "Stephen King"
      }
    }
  ]
}
```

## 🔗 Endpoints Clés

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/notifications/user/{id}` | GET | Toutes les notifications |
| `/api/notifications/user/{id}/unread` | GET | Seulement les non-lues |
| `/api/notifications/user/{id}/stats` | GET | Stats (count, open rate) |
| `/api/notifications/{id}/read` | PATCH | Marquer comme lue |
| `/api/notifications/user/{id}/read-all` | PATCH | Marquer toutes lues |
| `/api/notifications/{id}` | DELETE | Supprimer une |
| `/api/notifications/user/{id}/delete-all` | DELETE | Supprimer toutes |

## 💡 Cas d'Utilisation

### Quand une notification est créée

**Scénario 1: Nouveau livre d'auteur préféré**
```
Admin crée: "The Stand" de Stephen King, Genre: Thriller
↓
notify_new_book_matches() cherche les users
WHERE genres_preferes LIKE '%Stephen King%'
   OR genres_preferes LIKE '%Thriller%'
↓
Crée: "✨ Un nouveau livre de Stephen King"
↓
Frontend montre: Bell icon + badge count=1
```

**Scénario 2: Genre préféré du user**
```
User A a genres_preferes: ["Science-Fiction", "Mystery"]
↓
Admin crée un livre avec genre "Science-Fiction"
↓
Notification créée automatiquement pour User A
```

## 🚀 Frontend React Example

```jsx
import { useEffect, useState } from 'react';

export function NotificationBell({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  // Charger les stats
  useEffect(() => {
    fetch(`/api/notifications/user/${userId}/stats`)
      .then(r => r.json())
      .then(d => setUnread(d.unread));
  }, [userId]);

  // Charger les notifications
  const loadNotifications = () => {
    fetch(`/api/notifications/user/${userId}?limit=10`)
      .then(r => r.json())
      .then(d => setNotifications(d.notifications));
  };

  // Poll toutes les 30 secondes
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const markAsRead = async (notifId) => {
    await fetch(`/api/notifications/${notifId}/read`, {
      method: 'PATCH'
    });
    loadNotifications(); // Reload
  };

  return (
    <div className="notification-bell">
      <button 
        onClick={() => setOpen(!open)}
        className="bell-icon"
      >
        🔔 {unread > 0 && <span className="badge">{unread}</span>}
      </button>

      {open && (
        <div className="notification-panel">
          <h3>Notifications ({unread} non-lues)</h3>
          
          {notifications.length === 0 ? (
            <p>Aucune notification</p>
          ) : (
            notifications.map(n => (
              <div 
                key={n.id} 
                className={`notif-item ${n.is_read ? 'read' : 'unread'}`}
              >
                <div className="notif-content">
                  <h4>{n.titre}</h4>
                  <p>{n.contenu}</p>
                  <small>{new Date(n.created_at).toLocaleString()}</small>
                </div>
                
                {!n.is_read && (
                  <button 
                    className="mark-read"
                    onClick={() => markAsRead(n.id)}
                  >
                    ✓
                  </button>
                )}
              </div>
            ))
          )}

          <button 
            className="mark-all-read"
            onClick={async () => {
              await fetch(
                `/api/notifications/user/${userId}/read-all`,
                { method: 'PATCH' }
              );
              loadNotifications();
            }}
          >
            Marquer tout comme lue
          </button>
        </div>
      )}
    </div>
  );
}
```

## CSS Minimal

```css
.notification-bell {
  position: relative;
}

.bell-icon {
  font-size: 24px;
  background: none;
  border: none;
  cursor: pointer;
  position: relative;
}

.badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ef4444;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.notification-panel {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  width: 350px;
  max-height: 500px;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  padding: 16px;
  z-index: 1000;
}

.notif-item {
  border-bottom: 1px solid #f3f4f6;
  padding: 12px 0;
  margin-bottom: 8px;
}

.notif-item.unread {
  background-color: #eff6ff;
  padding: 12px 8px;
  margin: 0 -8px 8px -8px;
  border-radius: 4px;
}

.notif-item h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #1f2937;
}

.notif-item p {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
}

.notif-item small {
  color: #9ca3af;
  font-size: 11px;
}
```

## Débogage

### Vérifier si les notifications sont créées
```sql
-- PostgreSQL
SELECT * FROM notifications
WHERE user_id = 'your-uuid'
ORDER BY created_at DESC
LIMIT 10;

-- Voir les genres préférés d'un user
SELECT id, email, genres_preferes FROM users WHERE id = 'your-uuid';
```

### Test API
```bash
# Voir les notifications
curl http://localhost:8000/api/notifications/user/your-uuid

# Marquer comme lue
curl -X PATCH http://localhost:8000/api/notifications/notif-uuid/read

# Voir les stats
curl http://localhost:8000/api/notifications/user/your-uuid/stats
```

---

**Status**: ✅ Prêt pour production
**Pas de configuration requise**
**Fonctionne avec la table `notifications` existante**
