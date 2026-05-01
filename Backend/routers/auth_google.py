from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import User
import uuid

# Préfixe /auth/google → appelé par NextAuth après la connexion Google
router = APIRouter(prefix="/auth", tags=["OAuth Google"])


@router.post("/google")
def google_login(payload: dict, db: Session = Depends(get_db)):
    """
    Reçoit les informations de l'utilisateur Google depuis NextAuth.
    Crée le compte si c'est la première connexion, ou retrouve l'existant.
    Retourne les données de session au même format que le login classique.
    """
    email = payload.get("email")
    oauth_id = payload.get("oauth_id")
    prenom = payload.get("prenom", "")
    nom = payload.get("nom", "")
    photo_url = payload.get("photo_url")

    # 1. Cherche d'abord par oauth_id (l'identifiant unique Google)
    user = db.query(User).filter(User.oauth_id == oauth_id).first()

    # 2. Si pas trouvé par oauth_id, cherche par email (utilisateur existant)
    if not user:
        user = db.query(User).filter(User.email == email).first()

        if user:
            # L'utilisateur existe déjà → on lie son compte Google
            user.oauth_provider = "google"
            user.oauth_id = oauth_id
            if photo_url and not user.photo_url:
                user.photo_url = photo_url  # Ajoute l'avatar Google si pas de photo
            db.commit()

    # 3. Si l'utilisateur n'existe pas du tout → on crée un nouveau compte
    if not user:
        user = User(
            email=email,
            nom=nom if nom else "Utilisateur",
            prenom=prenom if prenom else "Nouveau",
            oauth_provider="google",    # Indique que ce compte vient de Google
            oauth_id=oauth_id,
            photo_url=photo_url,
            is_active=True,
            # Pas de password_hash pour les comptes OAuth
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # 4. Retourne les données de session au même format que /auth/login
    has_onboarded = bool(user.genres_preferes and len(user.genres_preferes) > 0)

    return {
        "message": "Connexion Google réussie",
        "role": "user",
        "user_id": str(user.id),
        "email": user.email,
        "prenom": user.prenom,
        "nom": user.nom,
        "has_onboarded": has_onboarded,
    }
