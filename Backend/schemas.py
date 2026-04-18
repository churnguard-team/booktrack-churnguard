from pydantic import BaseModel, EmailStr
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
    role: str
    is_active: bool
    created_at: datetime
    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    email: str
    nom: str
    prenom: str
    is_active: bool = True


class RegisterRequest(BaseModel):
    email: str
    password: str
    nom: str
    prenom: str
    role: str = "USER"


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    nom: str
    prenom: str
    user_id: str

