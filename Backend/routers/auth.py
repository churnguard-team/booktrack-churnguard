from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User, Admin
from schemas import LoginRequest

router = APIRouter(prefix="/auth", tags=["Authentification"])

@router.post("/login")
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    # 1. On cherche d'abord si l'email correspond à un ADMIN
    admin = db.query(Admin).filter(Admin.email == credentials.email).first()
    
    if admin:
        # On vérifie le mot de passe
        if admin.password_hash == credentials.password:
            return {
                "message": "Connexion réussie",
                "role": "admin",
                "user_id": admin.id,
                "email": admin.email
            }
        else:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Mot de passe incorrect")

    # 2. S'il n'est pas Admin, on cherche si c'est un simple USER
    user = db.query(User).filter(User.email == credentials.email).first()
    
    if user:
        if user.password_hash == credentials.password:
            return {
                "message": "Connexion réussie",
                "role": "user",
                "user_id": user.id,
                "email": user.email
            }
        else:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Mot de passe incorrect")

    # 3. Si on arrive ici, c'est que l'email n'existe nulle part
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur inconnu")
