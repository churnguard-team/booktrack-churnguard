from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User
from pydantic import BaseModel
from typing import List
import uuid

router = APIRouter(prefix="/users", tags=["User Profile"])

# Schéma Pydantic pour la mise à jour du profil pendant l'onboarding
class ProfileUpdate(BaseModel):
    # Liste des genres préférés sélectionnés pendant le quiz
    # Ex: ["Roman", "Science-Fiction", "Thriller"]
    genres_preferes: List[str]


@router.patch("/{user_id}/profile")
def update_profile(user_id: uuid.UUID, data: ProfileUpdate, db: Session = Depends(get_db)):
    """
    Sauvegarde les genres préférés de l'utilisateur.
    Appelé à la fin du quiz d'onboarding (étape 3 → bouton "Terminer").
    Une fois sauvegardé, has_onboarded sera True au prochain login.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    # On écrase la liste des genres préférés avec les nouveaux
    user.genres_preferes = data.genres_preferes
    db.commit()
    db.refresh(user)

    return {
        "message": "Profil mis à jour avec succès",
        "genres_preferes": user.genres_preferes
    }
