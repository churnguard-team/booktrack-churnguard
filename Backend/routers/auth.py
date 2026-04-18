from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from auth import hash_password, verify_password, create_access_token, decode_token

router = APIRouter(prefix="/auth", tags=["Auth"])
bearer = HTTPBearer()


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=409, detail="Email déjà utilisé")

    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        nom=body.nom,
        prenom=body.prenom,
        role=body.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": user.role, "email": user.email})
    return TokenResponse(access_token=token, role=user.role, nom=user.nom, prenom=user.prenom, user_id=str(user.id))


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not user.password_hash or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Compte désactivé")

    token = create_access_token({"sub": str(user.id), "role": user.role, "email": user.email})
    return TokenResponse(access_token=token, role=user.role, nom=user.nom, prenom=user.prenom, user_id=str(user.id))


@router.get("/me", response_model=UserResponse)
def me(credentials: HTTPAuthorizationCredentials = Depends(bearer), db: Session = Depends(get_db)):
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Token invalide")
    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    return user
