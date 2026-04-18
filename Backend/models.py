from sqlalchemy import Boolean, Column, String, Integer, Text, Date, TIMESTAMP, Enum
from sqlalchemy.dialects.postgresql import UUID
from database import Base
import uuid
from datetime import datetime
import enum


class RoleEnum(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    ADMIN = "ADMIN"
    MODERATOR = "MODERATOR"
    AUTHOR = "AUTHOR"
    USER = "USER"


class Book(Base):
    __tablename__ = "books"

    id               = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title            = Column(String(500), nullable=False)
    description      = Column(Text)
    auteur           = Column(String(255))
    genre            = Column(String(100))
    isbn             = Column(String(20))
    cover_url        = Column(Text)
    nb_pages         = Column(Integer)
    date_publication = Column(Date)
    langue           = Column(String(50))
    created_at       = Column(TIMESTAMP(timezone=True), default=datetime.now)


class User(Base):
    __tablename__ = "users"

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email          = Column(String(255), nullable=False, unique=True)
    password_hash  = Column(Text, nullable=True)
    nom            = Column(String(100), nullable=False)
    prenom         = Column(String(100), nullable=False)
    role           = Column(String(50), nullable=False, default="USER")
    is_active      = Column(Boolean, nullable=False, default=True)
    created_at     = Column(TIMESTAMP(timezone=True), default=datetime.now)
