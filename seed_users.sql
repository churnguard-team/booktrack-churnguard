-- ============================================================
-- SEED: Vrais utilisateurs FREE & PREMIUM pour le dashboard
-- Mot de passe pour tous : password123 (stocké en clair, fallback auth)
-- ============================================================

-- USERS FREE
INSERT INTO public.users (id, email, password_hash, nom, prenom, genres_preferes, objectif_annuel, is_active, created_at, updated_at, last_login_at) VALUES
('aaaa0001-0000-0000-0000-000000000001', 'alice.martin@gmail.com',   'password123', 'Martin',   'Alice',   '{Roman,Thriller}',              12, true,  NOW() - INTERVAL '90 days',  NOW() - INTERVAL '2 days',  NOW() - INTERVAL '2 days'),
('aaaa0001-0000-0000-0000-000000000002', 'bob.dupont@gmail.com',     'password123', 'Dupont',   'Bob',     '{Science-Fiction,Fantastique}', 20, true,  NOW() - INTERVAL '60 days',  NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
('aaaa0001-0000-0000-0000-000000000003', 'chloe.bernard@gmail.com',  'password123', 'Bernard',  'Chloé',   '{Romance,Historique}',          8,  true,  NOW() - INTERVAL '120 days', NOW() - INTERVAL '1 day',   NOW() - INTERVAL '1 day'),
('aaaa0001-0000-0000-0000-000000000004', 'david.leroy@gmail.com',    'password123', 'Leroy',    'David',   '{Policier,Thriller}',           15, true,  NOW() - INTERVAL '30 days',  NOW() - INTERVAL '5 days',  NOW() - INTERVAL '5 days'),
('aaaa0001-0000-0000-0000-000000000005', 'emma.petit@gmail.com',     'password123', 'Petit',    'Emma',    '{Philosophie,Essai}',           10, true,  NOW() - INTERVAL '200 days', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
('aaaa0001-0000-0000-0000-000000000006', 'felix.moreau@gmail.com',   'password123', 'Moreau',   'Félix',   '{Science-Fiction}',             25, true,  NOW() - INTERVAL '45 days',  NOW() - INTERVAL '3 days',  NOW() - INTERVAL '3 days'),
('aaaa0001-0000-0000-0000-000000000007', 'grace.simon@gmail.com',    'password123', 'Simon',    'Grace',   '{Biographie,Historique}',       6,  true,  NOW() - INTERVAL '150 days', NOW() - INTERVAL '45 days', NOW() - INTERVAL '45 days'),
('aaaa0001-0000-0000-0000-000000000008', 'hugo.laurent@gmail.com',   'password123', 'Laurent',  'Hugo',    '{Fantastique,Roman}',           18, true,  NOW() - INTERVAL '20 days',  NOW() - INTERVAL '1 day',   NOW() - INTERVAL '1 day'),
('aaaa0001-0000-0000-0000-000000000009', 'inès.thomas@gmail.com',    'password123', 'Thomas',   'Inès',    '{Romance}',                     12, false, NOW() - INTERVAL '300 days', NOW() - INTERVAL '90 days', NOW() - INTERVAL '90 days'),
('aaaa0001-0000-0000-0000-000000000010', 'julien.robert@gmail.com',  'password123', 'Robert',   'Julien',  '{Policier,Thriller,Roman}',     20, true,  NOW() - INTERVAL '10 days',  NOW() - INTERVAL '1 day',   NOW() - INTERVAL '1 day')
ON CONFLICT (email) DO NOTHING;

-- USERS PREMIUM
INSERT INTO public.users (id, email, password_hash, nom, prenom, genres_preferes, objectif_annuel, is_active, created_at, updated_at, last_login_at) VALUES
('bbbb0002-0000-0000-0000-000000000001', 'karim.benali@gmail.com',   'password123', 'Benali',   'Karim',   '{Science-Fiction,Fantastique,Thriller}', 30, true, NOW() - INTERVAL '180 days', NOW() - INTERVAL '1 day',  NOW() - INTERVAL '1 day'),
('bbbb0002-0000-0000-0000-000000000002', 'laura.garcia@gmail.com',   'password123', 'Garcia',   'Laura',   '{Romance,Roman,Historique}',            24, true, NOW() - INTERVAL '240 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
('bbbb0002-0000-0000-0000-000000000003', 'marc.lefebvre@gmail.com',  'password123', 'Lefebvre', 'Marc',    '{Policier,Thriller}',                   15, true, NOW() - INTERVAL '365 days', NOW() - INTERVAL '1 day',  NOW() - INTERVAL '1 day'),
('bbbb0002-0000-0000-0000-000000000004', 'nadia.rousseau@gmail.com', 'password123', 'Rousseau', 'Nadia',   '{Philosophie,Biographie,Essai}',        20, true, NOW() - INTERVAL '90 days',  NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
('bbbb0002-0000-0000-0000-000000000005', 'omar.fontaine@gmail.com',  'password123', 'Fontaine', 'Omar',    '{Fantastique,Science-Fiction}',          36, true, NOW() - INTERVAL '120 days', NOW() - INTERVAL '1 day',  NOW() - INTERVAL '1 day')
ON CONFLICT (email) DO NOTHING;

-- SUBSCRIPTIONS FREE
INSERT INTO public.subscriptions (id, user_id, type, status, date_debut, created_at, updated_at) VALUES
(gen_random_uuid(), 'aaaa0001-0000-0000-0000-000000000001', 'FREE', 'ACTIVE', NOW() - INTERVAL '90 days',  NOW() - INTERVAL '90 days',  NOW()),
(gen_random_uuid(), 'aaaa0001-0000-0000-0000-000000000002', 'FREE', 'ACTIVE', NOW() - INTERVAL '60 days',  NOW() - INTERVAL '60 days',  NOW()),
(gen_random_uuid(), 'aaaa0001-0000-0000-0000-000000000003', 'FREE', 'ACTIVE', NOW() - INTERVAL '120 days', NOW() - INTERVAL '120 days', NOW()),
(gen_random_uuid(), 'aaaa0001-0000-0000-0000-000000000004', 'FREE', 'ACTIVE', NOW() - INTERVAL '30 days',  NOW() - INTERVAL '30 days',  NOW()),
(gen_random_uuid(), 'aaaa0001-0000-0000-0000-000000000005', 'FREE', 'ACTIVE', NOW() - INTERVAL '200 days', NOW() - INTERVAL '200 days', NOW()),
(gen_random_uuid(), 'aaaa0001-0000-0000-0000-000000000006', 'FREE', 'ACTIVE', NOW() - INTERVAL '45 days',  NOW() - INTERVAL '45 days',  NOW()),
(gen_random_uuid(), 'aaaa0001-0000-0000-0000-000000000007', 'FREE', 'ACTIVE', NOW() - INTERVAL '150 days', NOW() - INTERVAL '150 days', NOW()),
(gen_random_uuid(), 'aaaa0001-0000-0000-0000-000000000008', 'FREE', 'ACTIVE', NOW() - INTERVAL '20 days',  NOW() - INTERVAL '20 days',  NOW()),
(gen_random_uuid(), 'aaaa0001-0000-0000-0000-000000000009', 'FREE', 'CANCELLED', NOW() - INTERVAL '300 days', NOW() - INTERVAL '300 days', NOW()),
(gen_random_uuid(), 'aaaa0001-0000-0000-0000-000000000010', 'FREE', 'ACTIVE', NOW() - INTERVAL '10 days',  NOW() - INTERVAL '10 days',  NOW())
ON CONFLICT DO NOTHING;

-- SUBSCRIPTIONS PREMIUM
INSERT INTO public.subscriptions (id, user_id, type, status, date_debut, date_fin, prix_mensuel, devise, created_at, updated_at) VALUES
(gen_random_uuid(), 'bbbb0002-0000-0000-0000-000000000001', 'PREMIUM', 'ACTIVE', NOW() - INTERVAL '180 days', NOW() + INTERVAL '15 days', 99.00, 'MAD', NOW() - INTERVAL '180 days', NOW()),
(gen_random_uuid(), 'bbbb0002-0000-0000-0000-000000000002', 'PREMIUM', 'ACTIVE', NOW() - INTERVAL '240 days', NOW() + INTERVAL '5 days',  99.00, 'MAD', NOW() - INTERVAL '240 days', NOW()),
(gen_random_uuid(), 'bbbb0002-0000-0000-0000-000000000003', 'PREMIUM', 'ACTIVE', NOW() - INTERVAL '365 days', NOW() + INTERVAL '30 days', 99.00, 'MAD', NOW() - INTERVAL '365 days', NOW()),
(gen_random_uuid(), 'bbbb0002-0000-0000-0000-000000000004', 'PREMIUM', 'ACTIVE', NOW() - INTERVAL '90 days',  NOW() + INTERVAL '20 days', 99.00, 'MAD', NOW() - INTERVAL '90 days',  NOW()),
(gen_random_uuid(), 'bbbb0002-0000-0000-0000-000000000005', 'PREMIUM', 'ACTIVE', NOW() - INTERVAL '120 days', NOW() + INTERVAL '10 days', 99.00, 'MAD', NOW() - INTERVAL '120 days', NOW())
ON CONFLICT DO NOTHING;

-- USER_BOOKS (activité de lecture)
INSERT INTO public.user_books (id, user_id, book_id, statut, note, pages_lues, is_favourite, created_at, updated_at) 
SELECT gen_random_uuid(), u.user_id, b.book_id, b.statut, b.note, b.pages_lues, b.fav, NOW() - (random() * INTERVAL '60 days'), NOW()
FROM (VALUES
  ('aaaa0001-0000-0000-0000-000000000001'::uuid, 'f2d4d94f-b688-4218-ab7e-4d8cb903bf8a'::uuid, 'READ',    5, 368, true),
  ('aaaa0001-0000-0000-0000-000000000001'::uuid, '7ee70f51-e7c6-49cd-b782-c2c875711589'::uuid, 'READING', NULL, 150, false),
  ('aaaa0001-0000-0000-0000-000000000002'::uuid, '732b6b9e-4c52-4703-8b5b-2077c7d7e479'::uuid, 'READ',    4, 296, true),
  ('aaaa0001-0000-0000-0000-000000000002'::uuid, '1cd1d31e-63a7-460b-99c5-79b1727f3c3d'::uuid, 'READ',    5, 310, false),
  ('aaaa0001-0000-0000-0000-000000000003'::uuid, '869d4e32-9007-4e2a-a511-75418f511886'::uuid, 'READ',    4, 320, true),
  ('aaaa0001-0000-0000-0000-000000000004'::uuid, '7addf711-fe13-444b-9f99-0057ffb794ce'::uuid, 'READ',    3, 334, false),
  ('aaaa0001-0000-0000-0000-000000000006'::uuid, '93108596-cc65-4147-9ac9-0de8a6c0d04d'::uuid, 'READING', NULL, 100, false),
  ('aaaa0001-0000-0000-0000-000000000008'::uuid, '65fff8d2-50b6-4083-a573-a7079f64b24a'::uuid, 'READ',    5, 284, true),
  ('aaaa0001-0000-0000-0000-000000000010'::uuid, '798cb706-40c8-4c04-b36e-1ac3829fb13d'::uuid, 'TO_READ', NULL, 0,   false),
  ('bbbb0002-0000-0000-0000-000000000001'::uuid, 'f2d4d94f-b688-4218-ab7e-4d8cb903bf8a'::uuid, 'READ',    5, 368, true),
  ('bbbb0002-0000-0000-0000-000000000001'::uuid, '732b6b9e-4c52-4703-8b5b-2077c7d7e479'::uuid, 'READ',    4, 296, false),
  ('bbbb0002-0000-0000-0000-000000000001'::uuid, '1cd1d31e-63a7-460b-99c5-79b1727f3c3d'::uuid, 'READ',    5, 310, true),
  ('bbbb0002-0000-0000-0000-000000000001'::uuid, '44cc1d89-5abe-4d08-a070-b98cfb3c3b75'::uuid, 'READING', NULL, 200, false),
  ('bbbb0002-0000-0000-0000-000000000002'::uuid, '869d4e32-9007-4e2a-a511-75418f511886'::uuid, 'READ',    5, 320, true),
  ('bbbb0002-0000-0000-0000-000000000002'::uuid, '52581119-7e85-43b0-9db0-93e658d1cc04'::uuid, 'READ',    4, 288, false),
  ('bbbb0002-0000-0000-0000-000000000003'::uuid, '7addf711-fe13-444b-9f99-0057ffb794ce'::uuid, 'READ',    5, 334, true),
  ('bbbb0002-0000-0000-0000-000000000003'::uuid, 'e03ca950-09cf-44e6-b886-74d91081db16'::uuid, 'READ',    4, 376, false),
  ('bbbb0002-0000-0000-0000-000000000003'::uuid, '1f02c589-7c12-4dc2-afdf-baddb2714ef7'::uuid, 'READ',    5, 368, true),
  ('bbbb0002-0000-0000-0000-000000000004'::uuid, 'cf209f17-c27b-483e-b238-c7da52808846'::uuid, 'READ',    4, 198, false),
  ('bbbb0002-0000-0000-0000-000000000005'::uuid, '65fff8d2-50b6-4083-a573-a7079f64b24a'::uuid, 'READ',    5, 284, true),
  ('bbbb0002-0000-0000-0000-000000000005'::uuid, '67fa4cf2-fbe5-4882-98ad-eaab30c43e4b'::uuid, 'READ',    4, 301, false)
) AS b(user_id, book_id, statut, note, pages_lues, fav)
JOIN (SELECT 1) u ON true
ON CONFLICT (user_id, book_id) DO NOTHING;

-- CHURN SCORES
INSERT INTO public.churn_scores (id, user_id, score, niveau_risque, date_calcul, model_version, is_latest) VALUES
(gen_random_uuid(), 'aaaa0001-0000-0000-0000-000000000005', 0.82, 'CRITICAL', NOW() - INTERVAL '1 day', 'v1.0', true),
(gen_random_uuid(), 'aaaa0001-0000-0000-0000-000000000007', 0.74, 'HIGH',     NOW() - INTERVAL '1 day', 'v1.0', true),
(gen_random_uuid(), 'aaaa0001-0000-0000-0000-000000000009', 0.91, 'CRITICAL', NOW() - INTERVAL '1 day', 'v1.0', true),
(gen_random_uuid(), 'aaaa0001-0000-0000-0000-000000000002', 0.45, 'MEDIUM',   NOW() - INTERVAL '1 day', 'v1.0', true),
(gen_random_uuid(), 'aaaa0001-0000-0000-0000-000000000001', 0.15, 'LOW',      NOW() - INTERVAL '1 day', 'v1.0', true),
(gen_random_uuid(), 'bbbb0002-0000-0000-0000-000000000002', 0.68, 'HIGH',     NOW() - INTERVAL '1 day', 'v1.0', true),
(gen_random_uuid(), 'bbbb0002-0000-0000-0000-000000000001', 0.12, 'LOW',      NOW() - INTERVAL '1 day', 'v1.0', true),
(gen_random_uuid(), 'bbbb0002-0000-0000-0000-000000000003', 0.08, 'LOW',      NOW() - INTERVAL '1 day', 'v1.0', true)
ON CONFLICT DO NOTHING;
