#!/bin/bash
# Script de test du système d'emails de rétention

API_URL="http://localhost:8000/api/retention"

echo "🚀 Testing Retention Email System..."
echo ""

# Test 1: Récupérer les utilisateurs à risque
echo "1️⃣ Getting high-risk users..."
curl -s -X GET "$API_URL/high-risk-users?threshold=0.6&limit=5" | jq .
echo ""

# Test 2: Récupérer les statistiques
echo "2️⃣ Getting retention stats..."
curl -s -X GET "$API_URL/stats?days=30" | jq .
echo ""

# Test 3: Déclencher la détection quotidienne (manuellement)
echo "3️⃣ Running daily churn detection with emails..."
curl -s -X POST "$API_URL/run-daily" | jq .
echo ""

# Test 4: Déclencher une campagne complète
echo "4️⃣ Triggering retention campaign (20% discount)..."
curl -s -X POST "$API_URL/trigger-campaign" \
  -H "Content-Type: application/json" \
  -d '{"discount_percent": 20}' | jq .
echo ""

# Test 5: Envoyer un email manuel (changez l'UUID)
echo "5️⃣ Sending manual retention email..."
# Remplacez 'uuid' par un vrai UUID utilisateur
# curl -s -X POST "$API_URL/send-email" \
#   -H "Content-Type: application/json" \
#   -d '{"user_id": "your-user-uuid", "discount_percent": 25}' | jq .

echo "✅ Tests completed!"
