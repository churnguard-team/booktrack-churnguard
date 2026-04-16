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
