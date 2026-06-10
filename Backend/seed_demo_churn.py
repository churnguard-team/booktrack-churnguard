"""
Script de démonstration churn pour le jury.
Génère :
  - 30 users PREMIUM actifs (score churn LOW/MEDIUM)
  - 20 users PREMIUM churners (score HIGH/CRITICAL → reçoivent email discount)
  - 40 users FREE actifs
  - 20 users FREE churners
  + des churn_scores, user_events, user_books, retention_actions pour remplir tous les tableaux.

Usage (dans le conteneur ou avec DATABASE_URL local) :
  docker compose exec backend python seed_demo_churn.py
"""

import json
import os
import random
from datetime import datetime, timedelta
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import text

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

from database import SessionLocal
from models import User, Subscription
from services.email_service import send_retention_email

# ── Paramètres ──────────────────────────────────────────────────────────────
PREMIUM_ACTIVE  = 30   # faible risque churn
PREMIUM_CHURN   = 20   # score > 0.6 → email envoyé
FREE_ACTIVE     = 40
FREE_CHURN      = 20

FIRST_NAMES = ["Samir","Amina","Kenza","Youssef","Salma","Hasan","Nadia","Rachid","Lina","Karim",
               "Imane","Omar","Sara","Mourad","Amine","Hanae","Zakaria","Meryem","Zineb","Nabil"]
LAST_NAMES  = ["Bennani","El Idrissi","Chakiri","Rami","Souiri","Benali","Khalfi","Aziz","Mansouri",
               "El Hachimi","Jilali","Fassi","Rahimi","Azzouz","Naciri","Benjelloun","Boukili","Hamdani"]
GENRES      = ["Fiction","Science","Business","Développement personnel","Histoire",
               "Fantasy","Romance","Biographie","Voyage","Technologie"]

BOOK_STATUSES  = ["READ","READING","ABANDONED","TO_READ"]
EVENT_TYPES    = ["book_view","search","login","bookmark"]
RECO_ALGOS     = ["collaborative","content_based","popular","hybrid"]


def rdt(days_min=0, days_max=90):
    return datetime.utcnow() - timedelta(
        days=random.randint(days_min, days_max),
        seconds=random.randint(0, 86399)
    )

def rdt_event():
    """Date garantie dans 2025-Q4 (partition existante : oct-dec 2025)."""
    start = datetime(2025, 10, 1)
    end   = datetime(2025, 12, 30)
    return start + timedelta(seconds=random.randint(0, int((end - start).total_seconds())))


def add_events(uid, book_ids, db, count_min, count_max, recency_max_days):
    """Ajoute des events dans 2025-Q4 (partition couverte)."""
    for _ in range(random.randint(count_min, count_max)):
        etype = random.choices(EVENT_TYPES, weights=[0.5, 0.3, 0.1, 0.1])[0]
        bid   = random.choice(book_ids) if etype == "book_view" else None
        db.execute(text(
            "INSERT INTO user_events (user_id, event_type, book_id, metadata, occurred_at) "
            "VALUES (:uid, :e, :bid, CAST(:meta AS jsonb), :occ)"
        ), {"uid": uid, "e": etype, "bid": bid,
            "meta": json.dumps({"source": "seed_demo"}),
            "occ": rdt_event()})


def add_books(uid, book_ids, db, count, mostly_abandoned=False):
    chosen = random.sample(book_ids, min(count, len(book_ids)))
    for bid in chosen:
        if mostly_abandoned:
            status = random.choices(BOOK_STATUSES, weights=[0.1, 0.1, 0.6, 0.2])[0]
        else:
            status = random.choices(BOOK_STATUSES, weights=[0.45, 0.3, 0.05, 0.2])[0]
        note   = random.randint(3,5) if status == "READ" else (random.randint(1,2) if status == "ABANDONED" else None)
        db.execute(text(
            "INSERT INTO user_books (user_id, book_id, statut, note, date_debut, pages_lues) "
            "VALUES (:uid, :bid, :s, :n, :dd, :p)"
        ), {"uid": uid, "bid": bid, "s": status, "n": note,
            "dd": rdt(10, 180).date(), "p": random.randint(0, 400)})


def add_recommendations(uid, book_ids, db):
    for _ in range(random.randint(2, 5)):
        shown    = random.random() < 0.8
        accepted = shown and random.random() < 0.35
        db.execute(text(
            "INSERT INTO recommendations (user_id, book_id, score_pertinence, algorithme, model_version, "
            "date_recommandation, est_affichee, est_acceptee, date_affichage, date_feedback) "
            "VALUES (:uid, :bid, :sc, :al, :mv, :rd, :sh, :ac, :sa, :sf)"
        ), {"uid": uid, "bid": random.choice(book_ids),
            "sc": round(random.random()*0.5+0.4, 4), "al": random.choice(RECO_ALGOS),
            "mv": "v1", "rd": rdt(0,30), "sh": shown, "ac": accepted,
            "sa": rdt(0,30) if shown else None, "sf": rdt(0,30) if accepted else None})


def upsert_churn_score(uid, score, db):
    niveau = "LOW" if score < 0.3 else "MEDIUM" if score < 0.6 else "HIGH" if score < 0.8 else "CRITICAL"
    snap = json.dumps({"days_since_login": round(score * 90), "books_read": random.randint(0, 15),
                       "sessions_last_30d": random.randint(0, 30), "demo": True})
    db.execute(text("""
        INSERT INTO churn_scores
            (user_id, score, niveau_risque, model_version, features_snapshot, is_latest, date_calcul)
        VALUES
            (:uid, :score, :niveau, 'xgboost-v1', CAST(:snap AS jsonb), true, NOW())
    """), {"uid": uid, "score": score, "niveau": niveau, "snap": snap})
    return niveau


def create_user(db, idx, kind, sub_type, score_range, last_login_days, event_count_range, event_recency, book_count, mostly_abandoned):
    first  = random.choice(FIRST_NAMES)
    last   = random.choice(LAST_NAMES)
    email  = f"demo-{kind}-{idx}@booktrack-test.com"

    if db.execute(text("SELECT 1 FROM users WHERE email=:e"), {"e": email}).fetchone():
        return None

    created_at    = rdt(30, 400)
    last_login_at = rdt(last_login_days[0], last_login_days[1])

    user = User(
        email=email, password_hash="Password123!",
        nom=last, prenom=first, is_active=True,
        genres_preferes=random.sample(GENRES, random.randint(1, 4)),
        objectif_annuel=random.choice([12,18,24,30]),
        last_login_at=last_login_at, created_at=created_at, updated_at=created_at,
    )
    db.add(user)
    db.flush()

    # Subscription
    status_sub = "ACTIVE"
    date_debut = rdt(0, 90)
    cancelled_at = None
    cancel_reason = None
    if kind.endswith("churn") and random.random() < 0.4:
        status_sub   = "CANCELLED"
        cancelled_at = date_debut + timedelta(days=random.randint(7, 45))
        cancel_reason = random.choice(["Trop cher","Pas le temps","Contenu insuffisant","Je voyage"])

    db.add(Subscription(
        user_id=user.id, type=sub_type, status=status_sub,
        date_debut=date_debut,
        date_fin=date_debut + timedelta(days=30),
        prix_mensuel=99.99 if sub_type == "PREMIUM" else 0.0,
        devise="MAD", auto_renew=(status_sub == "ACTIVE"),
        cancelled_at=cancelled_at, cancel_reason=cancel_reason,
    ))

    return user


def main():
    db = SessionLocal()
    try:
        book_rows = db.execute(text("SELECT id FROM books ORDER BY RANDOM() LIMIT 150")).fetchall()
        book_ids  = [str(r[0]) for r in book_rows]
        if not book_ids:
            print("❌ Aucun livre trouvé. Importez bookdatabase.sql d'abord.")
            return

        total_users   = 0
        emails_sent   = 0
        emails_failed = 0
        scores_added  = 0

        profiles = [
            # (kind, sub_type, nb, score_range, last_login_days, events, event_recency, books, mostly_abandoned)
            ("premium-active", "PREMIUM", PREMIUM_ACTIVE, (0.05, 0.45), (0, 10),  (15,40), 7,  6, False),
            ("premium-churn",  "PREMIUM", PREMIUM_CHURN,  (0.62, 0.95), (20, 80), (1, 6),  45, 3, True),
            ("free-active",    "FREE",    FREE_ACTIVE,    (0.10, 0.50), (0, 15),  (10,30), 10, 5, False),
            ("free-churn",     "FREE",    FREE_CHURN,     (0.63, 0.92), (25, 90), (0, 4),  50, 2, True),
        ]

        churn_users_for_email = []   # (user_id, score) avec score > 0.6

        for kind, sub_type, nb, score_rng, login_days, evt_cnt, evt_rec, bk_cnt, mostly_ab in profiles:
            for idx in range(1, nb + 1):
                user = create_user(db, idx, kind, sub_type, score_rng, login_days, evt_cnt, evt_rec, bk_cnt, mostly_ab)
                if not user:
                    continue

                uid   = str(user.id)
                score = round(random.uniform(*score_rng), 4)

                upsert_churn_score(uid, score, db)
                scores_added += 1

                add_events(uid, book_ids, db, evt_cnt[0], evt_cnt[1], evt_rec)
                add_books(uid, book_ids, db, bk_cnt, mostly_ab)
                add_recommendations(uid, book_ids, db)

                if score > 0.6:
                    churn_users_for_email.append((uid, score))

                total_users += 1

        db.commit()
        print(f"✅ {total_users} utilisateurs créés, {scores_added} scores churn insérés.")
        print(f"📧 {len(churn_users_for_email)} churners détectés → envoi emails discount...")

        # ── Envoi emails de rétention ────────────────────────────────────────
        for uid, score in churn_users_for_email:
            discount = 30 if score > 0.8 else 25 if score > 0.7 else 20
            result = send_retention_email(db, uid, score, discount_percent=discount)
            if result["status"] == "sent":
                emails_sent += 1
                print(f"  ✉️  Email envoyé → {result['email']} (code: {result['discount_code']}, score: {score:.2f})")
            else:
                emails_failed += 1
                detail = result.get("detail", "")
                # Ne pas spammer la console pour les erreurs SendGrid (clé absente, etc.)
                if "SENDGRID" in detail.upper() or "not configured" in detail:
                    if emails_failed == 1:
                        print(f"  ⚠️  SendGrid non configuré — les actions FAILED sont quand même enregistrées en BD.")
                else:
                    print(f"  ❌ Échec pour {uid}: {detail}")

        print(f"\n=== RÉSUMÉ ===")
        print(f"  Users créés       : {total_users}")
        print(f"  Churn scores      : {scores_added}")
        print(f"  Churners détectés : {len(churn_users_for_email)}")
        print(f"  Emails envoyés    : {emails_sent}")
        print(f"  Emails échoués    : {emails_failed}")
        print(f"\nDémo prête → http://localhost:3000/dashboard/moderator")

    except Exception as exc:
        db.rollback()
        print(f"❌ Erreur : {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
