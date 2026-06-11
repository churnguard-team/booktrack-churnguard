-- User: marouaidomar1@gmail.com — FREE, churn CRITICAL
INSERT INTO public.users (id, email, password_hash, nom, prenom, genres_preferes, objectif_annuel, is_active, created_at, updated_at, last_login_at)
VALUES (
  'cccc0003-0000-0000-0000-000000000001',
  'marouaidomar1@gmail.com',
  'password123',
  'Idomar',
  'Maroua',
  '{Roman,Thriller}',
  12,
  true,
  NOW() - INTERVAL '120 days',
  NOW() - INTERVAL '40 days',
  NOW() - INTERVAL '40 days'
) ON CONFLICT (email) DO NOTHING;

INSERT INTO public.subscriptions (id, user_id, type, status, date_debut, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'cccc0003-0000-0000-0000-000000000001',
  'FREE', 'ACTIVE',
  NOW() - INTERVAL '120 days',
  NOW() - INTERVAL '120 days',
  NOW()
) ON CONFLICT DO NOTHING;

INSERT INTO public.churn_scores (id, user_id, score, niveau_risque, date_calcul, model_version, is_latest)
VALUES (
  gen_random_uuid(),
  'cccc0003-0000-0000-0000-000000000001',
  0.93, 'CRITICAL',
  NOW() - INTERVAL '1 day',
  'v1.0',
  true
) ON CONFLICT DO NOTHING;
