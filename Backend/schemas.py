from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
import uuid

class BookBase(BaseModel):
    title: str
    description: Optional[str] = None
    auteur: Optional[str] = None
    genre: Optional[str] = None
    cover_url: Optional[str] = None
    nb_pages: Optional[int] = None
    date_publication: Optional[date] = None
    langue: Optional[str] = None

class BookCreate(BookBase):
    pass

class BookResponse(BookBase):
    id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    nom: str
    prenom: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    email: str
    nom: str
    prenom: str
    password_hash: str
    is_active: bool = True

class LoginRequest(BaseModel):
    email: str
    password: str

# Schéma pour ajouter un livre dans l'étagère de l'utilisateur
class UserBookCreate(BaseModel):
    book_id: uuid.UUID
    status: str = "TO_READ"
    is_favourite: bool = False

# Schéma pour mettre à jour un livre (ex: modifier la note, ou changer le statut à "Lu")
class UserBookUpdate(BaseModel):
    status: Optional[str] = None
    rating: Optional[int] = None
    review: Optional[str] = None
    is_favourite: Optional[bool] = None
    date_started: Optional[date] = None
    date_finished: Optional[date] = None


# ─── Schémas pour les commentaires de livres ───────────────────────────────

# Schéma reçu du frontend lors de la création d'un commentaire
class CommentCreate(BaseModel):
    user_id: uuid.UUID   # L'identifiant de l'utilisateur qui commente
    contenu: str         # Le texte du commentaire

# Schéma renvoyé par l'API après création ou lecture d'un commentaire
class CommentResponse(BaseModel):
    id: uuid.UUID
    book_id: uuid.UUID
    user_id: uuid.UUID
    auteur: str          # Prénom + Nom de l'utilisateur (joint depuis la table users)
    contenu: str
    created_at: datetime

    class Config:
        from_attributes = True  # Permet la conversion depuis un objet SQLAlchemy
