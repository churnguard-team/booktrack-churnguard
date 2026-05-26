import random
from datetime import datetime, timedelta
from pathlib import Path

from dotenv import load_dotenv

from database import SessionLocal, engine
from models import Base, User, Subscription

# Charge les variables d'environnement depuis le .env du projet racine
load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

PREMIUM_COUNT = 10
FREE_COUNT = 20

PREMIUM_PRICE = 99.99
FREE_PRICE = 0.00

FIRST_NAMES = [
    "Samir", "Amina", "Kenza", "Youssef", "Salma",
    "Hasan", "Nadia", "Rachid", "Lina", "Karim",
    "Imane", "Omar", "Sara", "Mourad", "Amine",
    "Hanae", "Zakaria", "Meryem", "Zineb", "Nabil"
]

LAST_NAMES = [
    "Bennani", "El Idrissi", "Chakiri", "Rami", "Souiri",
    "Benali", "Mehdi", "Khalfi", "Aziz", "Mansouri",
    "El Hachimi", "Jilali", "Zouhair", "Fassi", "Rahimi",
    "Azzouz", "Naciri", "Toumi", "Benjelloun", "Idrissi"
]


def make_email(first: str, last: str, idx: int, kind: str) -> str:
    normalized = f"{first}.{last}".lower().replace(" ", "")
    return f"test-{kind}-{normalized}{idx}@example.com"


def create_users():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        added_users = 0
        added_subs = 0

        # Create PREMIUM users
        for idx in range(1, PREMIUM_COUNT + 1):
            first = random.choice(FIRST_NAMES)
            last = random.choice(LAST_NAMES)
            email = make_email(first, last, idx, "premium")
            existing_user = db.query(User).filter(User.email == email).first()
            if existing_user:
                print(f"Skipping existing premium user: {email}")
                continue

            user = User(
                email=email,
                password_hash="Password123!",
                nom=last,
                prenom=first,
                is_active=True,
                genres_preferes=["Fiction", "Science", "Business"],
                objectif_annuel=24,
                last_login_at=datetime.utcnow(),
            )
            db.add(user)
            db.flush()

            sub = Subscription(
                user_id=user.id,
                type="PREMIUM",
                status="ACTIVE",
                date_debut=datetime.utcnow(),
                date_fin=datetime.utcnow() + timedelta(days=30),
                prix_mensuel=PREMIUM_PRICE,
                devise="MAD",
                auto_renew=True,
            )
            db.add(sub)
            added_users += 1
            added_subs += 1

        # Create FREE users
        for idx in range(1, FREE_COUNT + 1):
            first = random.choice(FIRST_NAMES)
            last = random.choice(LAST_NAMES)
            email = make_email(first, last, idx, "free")
            existing_user = db.query(User).filter(User.email == email).first()
            if existing_user:
                print(f"Skipping existing free user: {email}")
                continue

            user = User(
                email=email,
                password_hash="Password123!",
                nom=last,
                prenom=first,
                is_active=True,
                genres_preferes=[],
                objectif_annuel=12,
                last_login_at=datetime.utcnow(),
            )
            db.add(user)
            db.flush()

            sub = Subscription(
                user_id=user.id,
                type="FREE",
                status="ACTIVE",
                date_debut=datetime.utcnow(),
                prix_mensuel=FREE_PRICE,
                devise="MAD",
                auto_renew=False,
            )
            db.add(sub)
            added_users += 1
            added_subs += 1

        db.commit()
        print(f"Created {added_users} test users and {added_subs} subscriptions.")
        print(f"Premium users: {PREMIUM_COUNT}, Free users: {FREE_COUNT}")
        print("Passwords for all test accounts: Password123!")

    except Exception as exc:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    create_users()
