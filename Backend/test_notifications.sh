#!/bin/bash
# Script de test du système de notifications in-app

API_URL="http://localhost:8000/api/notifications"
USER_ID="your-user-uuid-here"

echo "🔔 Testing In-App Notifications System..."
echo ""

# Test 1: Récupérer les notifications
echo "1️⃣ Getting all notifications for user..."
curl -s -X GET "$API_URL/user/$USER_ID?limit=5" | jq .
echo ""

# Test 2: Récupérer les non-lues
echo "2️⃣ Getting unread notifications..."
curl -s -X GET "$API_URL/user/$USER_ID/unread" | jq .
echo ""

# Test 3: Récupérer les stats
echo "3️⃣ Getting notification stats..."
curl -s -X GET "$API_URL/user/$USER_ID/stats" | jq .
echo ""

# Test 4: Marquer tout comme lue
echo "4️⃣ Marking all notifications as read..."
curl -s -X PATCH "$API_URL/user/$USER_ID/read-all" | jq .
echo ""

# Test 5: Créer une notification personnalisée (Admin)
echo "5️⃣ Creating custom notification..."
curl -s -X POST "$API_URL/?user_id=$USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "titre": "Bienvenue sur BookTrack!",
    "contenu": "Explorez nos nouveaux livres...",
    "notification_type": "SYSTEM",
    "metadata": {"onboarding": true}
  }' | jq .
echo ""

# Test 6: Vérifier si une notification a été créée
echo "6️⃣ Checking notifications again..."
curl -s -X GET "$API_URL/user/$USER_ID?limit=3" | jq .
echo ""

echo "✅ All tests completed!"
echo ""
echo "📝 Instructions:"
echo "1. Replace 'your-user-uuid-here' with a real user UUID"
echo "2. Create a new book to see notifications trigger automatically"
echo "3. POST /books endpoint will create notifications for matching users"
