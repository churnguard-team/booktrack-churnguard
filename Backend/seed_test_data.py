import json
import os
import random
from datetime import datetime, timedelta
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import text

from database import SessionLocal, engine
from models import Base, User, Subscription

# Charge les variables d'environnement depuis le .env du projet racine
load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

PREMIUM_COUNT = 40
FREE_COUNT = 90

PREMIUM_PRICE = 99.99
FREE_PRICE = 0.00

FIRST_NAMES = [
    "Samir", "Amina", "Kenza", "Youssef", "Salma",
    "Hasan", "Nadia", "Rachid", "Lina", "Karim",
    "Imane", "Omar", "Sara", "Mourad", "Amine",
    "Hanae", "Zakaria", "Meryem", "Zineb", "Nabil",
    "Rania", "Youssef", "Dina", "Faouzi", "Malak",
    "Mehdi", "Laila", "Yassine", "Nour", "Rachida"
]

LAST_NAMES = [
    "Bennani", "El Idrissi", "Chakiri", "Rami", "Souiri",
    "Benali", "Mehdi", "Khalfi", "Aziz", "Mansouri",
    "El Hachimi", "Jilali", "Zouhair", "Fassi", "Rahimi",
    "Azzouz", "Naciri", "Toumi", "Benjelloun", "Idrissi",
    "Boukili", "Mansour", "Zahra", "Hamdani", "El Alaoui"
]

GENRES = [
    "Fiction", "Science", "Business", "Développement personnel", "Histoire",
    "Fantasy", "Romance", "Biographie", "Voyage", "Technologie",
]

BOOK_STATUSES = ["READ", "READING", "ABANDONED", "TO_READ"]
EVENT_TYPES = ["book_view", "search", "login", "bookmark"]
RECO_ALGOS = ["collaborative", "content_based", "popular", "hybrid"]


def make_email(first: str, last: str, idx: int, kind: str) -> str:
    normalized = f"{first}.{last}".lower().replace(" ", "")
    return f"test-{kind}-{normalized}{idx}@example.com"


def random_datetime(days_ago_min: int = 0, days_ago_max: int = 90) -> datetime:
    delta_days = random.randint(days_ago_min, days_ago_max)
    delta_seconds = random.randint(0, 86399)
    return datetime.utcnow() - timedelta(days=delta_days, seconds=delta_seconds)


def random_book_interaction(user_id: str, book_ids: list[str], db) -> None:
    count = random.randint(3, 8)
    chosen = random.sample(book_ids, min(count, len(book_ids)))
    for book_id in chosen:
        status = random.choices(BOOK_STATUSES, weights=[0.4, 0.25, 0.15, 0.2])[0]
        date_debut = random_datetime(30, 180).date()
        date_fin = None
        note = None
        review = None
        pages_lues = random.randint(0, 450)
        is_favourite = random.random() < 0.25

        if status == "READ":
            read_days = random.randint(2, 30)
            date_fin = date_debut + timedelta(days=read_days)
            note = random.randint(3, 5)
            review = random.choice([
                "Super lecture!", "J'ai beaucoup appris.", "Histoire prenante.",
                "Très pertinent.", "Je recommande."
            ])
            pages_lues = random.randint(100, 450)
        elif status == "ABANDONED":
            read_days = random.randint(1, 14)
            date_fin = date_debut + timedelta(days=read_days)
            note = random.randint(1, 3)
            review = random.choice([
                "Je n'ai pas accroché.", "Trop lent.", "Je passe à autre chose."
            ])
            pages_lues = random.randint(0, 120)
        elif status == "READING":
            pages_lues = random.randint(20, 200)

        db.execute(
            text(
                "INSERT INTO user_books (user_id, book_id, statut, note, avis, date_debut, date_fin, is_favourite, pages_lues) "
                "VALUES (:uid, :bid, :status, :note, :review, :debut, :fin, :fav, :pages)"
            ),
            {
                "uid": user_id,
                "bid": book_id,
                "status": status,
                "note": note,
                "review": review,
                "debut": date_debut,
                "fin": date_fin,
                "fav": is_favourite,
                "pages": pages_lues,
            },
        )


def random_user_events(user_id: str, book_ids: list[str], db) -> None:
    event_count = random.randint(5, 25)
    for _ in range(event_count):
        event_type = random.choices(EVENT_TYPES, weights=[0.5, 0.3, 0.1, 0.1])[0]
        book_id = random.choice(book_ids) if event_type == "book_view" else None
        occurred_at = random_datetime(0, 30)
        metadata = json.dumps({"source": random.choice(["homepage", "search", "recommendation"])})

        db.execute(
            text(
                "INSERT INTO user_events (user_id, event_type, book_id, metadata, occurred_at) "
                "VALUES (:uid, :event, :bid, :meta::jsonb, :occurred)"
            ),
            {
                "uid": user_id,
                "event": event_type,
                "bid": book_id,
                "meta": metadata,
                "occurred": occurred_at,
            },
        )


def random_recommendations(user_id: str, book_ids: list[str], db) -> None:
    count = random.randint(2, 6)
    for _ in range(count):
        book_id = random.choice(book_ids)
        shown = random.random() < 0.8
        accepted = shown and random.random() < 0.35
        db.execute(
            text(
                "INSERT INTO recommendations (user_id, book_id, score_pertinence, algorithme, model_version, date_recommandation, est_affichee, est_acceptee, date_affichage, date_feedback) "
                "VALUES (:uid, :bid, :score, :algo, :model, :recommend_at, :shown, :accepted, :shown_at, :feedback_at)"
            ),
            {
                "uid": user_id,
                "bid": book_id,
                "score": round(random.random() * 0.5 + 0.4, 4),
                "algo": random.choice(RECO_ALGOS),
                "model": "v1",
                "recommend_at": random_datetime(0, 30),
                "shown": shown,
                "accepted": accepted,
                "shown_at": random_datetime(0, 30) if shown else None,
                "feedback_at": random_datetime(0, 30) if accepted else None,
            },
        )


def random_comments(user_id: str, book_ids: list[str], db) -> None:
    count = random.randint(0, 4)
    for _ in range(count):
        db.execute(
            text(
                "INSERT INTO book_comments (user_id, book_id, contenu, created_at) "
                "VALUES (:uid, :bid, :content, :created)"
            ),
            {
                "uid": user_id,
                "bid": random.choice(book_ids),
                "content": random.choice([
                    "Très bon livre.", "Lecture enrichissante.", "Je recommande.", "Pas convaincu.", "A relire plus tard."
                ]),
                "created": random_datetime(0, 45),
            },
        )


def create_users():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        book_rows = db.execute(text("SELECT id FROM books ORDER BY RANDOM() LIMIT 150")).fetchall()
        book_ids = [str(row[0]) for row in book_rows]
        if not book_ids:
            print("Aucun livre trouvé dans la base. Ajoutez des livres avant de générer des utilisateurs de test.")
            return

        added_users = 0
        added_subs = 0
        added_books = 0
        added_events = 0
        added_recos = 0
        added_comments = 0

        def create_account(idx: int, kind: str, type_: str, status: str, auto_renew: bool, price: float):
            first = random.choice(FIRST_NAMES)
            last = random.choice(LAST_NAMES)
            email = make_email(first, last, idx, kind)
            if db.query(User).filter(User.email == email).first():
                return False

            created_at = random_datetime(30, 720)
            last_login_at = random_datetime(0, 90)
            is_active = random.random() > 0.08
            genres_preferes = random.sample(GENRES, random.randint(0, 4))
            objectif_annuel = random.choice([12, 18, 24, 30, 36])

            user = User(
                email=email,
                password_hash="Password123!",
                nom=last,
                prenom=first,
                is_active=is_active,
                genres_preferes=genres_preferes,
                objectif_annuel=objectif_annuel,
                last_login_at=last_login_at,
                created_at=created_at,
                updated_at=created_at,
            )
            db.add(user)
            db.flush()

            date_debut = random_datetime(0, 120)
            date_fin = None
            cancelled_at = None
            cancel_reason = None
            if status in ["ACTIVE", "TRIAL"]:
                date_fin = date_debut + timedelta(days=30)
            elif status == "CANCELLED":
                cancelled_at = date_debut + timedelta(days=random.randint(7, 45))
                date_fin = cancelled_at
                cancel_reason = random.choice([
                    "Trop cher", "Je n'ai pas le temps", "Contenu non pertinent", "Je voyage"
                ])
            elif status == "EXPIRED":
                date_fin = date_debut + timedelta(days=30)

            db.add(Subscription(
                user_id=user.id,
                type=type_,
                status=status,
                date_debut=date_debut,
                date_fin=date_fin,
                prix_mensuel=price,
                devise="MAD",
                auto_renew=auto_renew,
                cancelled_at=cancelled_at,
                cancel_reason=cancel_reason,
            ))

            return user

        for idx in range(1, PREMIUM_COUNT + 1):
            status = random.choices(["ACTIVE", "CANCELLED", "EXPIRED", "TRIAL"], weights=[0.65, 0.18, 0.12, 0.05])[0]
            user = create_account(idx, "premium", "PREMIUM", status, status == "ACTIVE", PREMIUM_PRICE)
            if not user:
                continue
            added_users += 1
            added_subs += 1
            random_book_interaction(str(user.id), book_ids, db)
            random_user_events(str(user.id), book_ids, db)
            random_recommendations(str(user.id), book_ids, db)
            random_comments(str(user.id), book_ids, db)
            added_books += 1
            added_events += 1
            added_recos += 1
            added_comments += 1

        for idx in range(1, FREE_COUNT + 1):
            status = random.choices(["ACTIVE", "CANCELLED", "EXPIRED", "TRIAL"], weights=[0.72, 0.12, 0.12, 0.04])[0]
            user = create_account(idx + PREMIUM_COUNT, "free", "FREE", status, False, FREE_PRICE)
            if not user:
                continue
            added_users += 1
            added_subs += 1
            random_book_interaction(str(user.id), book_ids, db)
            random_user_events(str(user.id), book_ids, db)
            random_recommendations(str(user.id), book_ids, db)
            random_comments(str(user.id), book_ids, db)
            added_books += 1
            added_events += 1
            added_recos += 1
            added_comments += 1

        db.commit()
        print(f"Created {added_users} users and {added_subs} subscriptions.")
        print(f"Premium users: {PREMIUM_COUNT}, Free users: {FREE_COUNT}")
        print("Passwords for all generated accounts: Password123!")

    except Exception as exc:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    create_users()
