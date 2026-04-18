from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User, Admin
from schemas import LoginRequest
from passlib.context import CryptContext

router = APIRouter(prefix="/auth", tags=["Authentification"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Vérifie si le mot de passe correspond au hash bcrypt."""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        # Fallback : comparaison en clair (pour les comptes de test sans hash)
        return plain_password == hashed_password

@router.post("/login")
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    # 1. On cherche d'abord si l'email correspond à un ADMIN
    admin = db.query(Admin).filter(Admin.email == credentials.email).first()
    
    if admin:
        if verify_password(credentials.password, admin.password_hash):
            return {
                "message": "Connexion réussie",
                "role": "admin",
                "user_id": str(admin.id),
                "email": admin.email
            }
        else:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Mot de passe incorrect")

    # 2. S'il n'est pas Admin, on cherche si c'est un simple USER
    user = db.query(User).filter(User.email == credentials.email).first()
    
    if user:
        if verify_password(credentials.password, user.password_hash):
            return {
                "message": "Connexion réussie",
                "role": "user",
                "user_id": str(user.id),
                "email": user.email
            }
        else:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Mot de passe incorrect")

    # 3. Si on arrive ici, c'est que l'email n'existe nulle part
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur inconnu")
