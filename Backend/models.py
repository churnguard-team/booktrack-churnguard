from sqlalchemy import Boolean, Column, String, Integer, Text, Date, TIMESTAMP, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from database import Base
import uuid
from datetime import datetime

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
    langue           = Column(String(50), default="fr")
    # Colonnes temporelles
    created_at       = Column(TIMESTAMP(timezone=True), default=datetime.now)
    updated_at       = Column(TIMESTAMP(timezone=True), default=datetime.now, onupdate=datetime.now)


class User(Base):
    __tablename__ = "users"

    id               = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email            = Column(String(255), nullable=False, unique=True)
    password_hash    = Column(Text) # <- Voici le fameux hash de mot de passe !
    nom              = Column(String(100), nullable=False)
    prenom           = Column(String(100), nullable=False)
    numero_tele      = Column(String(20))
    photo_url        = Column(Text)
    bio              = Column(Text)
    genres_preferes  = Column(ARRAY(String)) # <- Configuration spéciale pour les tableaux PostgreSQL
    objectif_annuel  = Column(Integer, default=12)
    oauth_provider   = Column(String(50))
    oauth_id         = Column(String(255))
    is_active        = Column(Boolean, nullable=False, default=True)
    
    # Colonnes temporelles
    created_at       = Column(TIMESTAMP(timezone=True), default=datetime.now)
    updated_at       = Column(TIMESTAMP(timezone=True), default=datetime.now, onupdate=datetime.now)
    last_login_at    = Column(TIMESTAMP(timezone=True))


class Admin(Base):
    __tablename__ = "admins"

    id               = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email            = Column(String(255), nullable=False, unique=True)
    password_hash    = Column(Text, nullable=False)
    nom              = Column(String(100), nullable=False)
    prenom           = Column(String(100), nullable=False)
    role             = Column(String) # Dans ta BD, c'est l'ENUM "admin_role". SQLAlchemy gère ça très bien en lisant un String.
    is_active        = Column(Boolean, nullable=False, default=True)
    
    # Colonnes temporelles
    created_at       = Column(TIMESTAMP(timezone=True), default=datetime.now)
    updated_at       = Column(TIMESTAMP(timezone=True), default=datetime.now, onupdate=datetime.now)




class UserBook(Base):
    __tablename__ = "user_books"

    # La véritable clé primaire que tu avais créée dans SQL
    id               = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Les clés de liaison
    user_id          = Column(UUID(as_uuid=True), nullable=False)
    book_id          = Column(UUID(as_uuid=True), nullable=False)
    
    # TRADUCTION AUTOMATIQUE (Python -> PostgreSQL)
    status           = Column("statut", String, default="TO_READ") 
    rating           = Column("note", Integer)
    review           = Column("avis", Text)
    date_started     = Column("date_debut", Date)
    date_finished    = Column("date_fin", Date)
    
    is_favourite     = Column(Boolean, default=False)
    pages_lues       = Column(Integer, default=0)
    
    created_at       = Column(TIMESTAMP(timezone=True), default=datetime.now)
    updated_at       = Column(TIMESTAMP(timezone=True), default=datetime.now, onupdate=datetime.now)


class BookComment(Base):
    """Modèle pour les commentaires publics laissés par les utilisateurs sur les livres."""
    __tablename__ = "book_comments"

    # Identifiant unique du commentaire (UUID généré automatiquement)
    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Référence vers le livre commenté (suppression en cascade si le livre est supprimé)
    book_id    = Column(UUID(as_uuid=True), ForeignKey("books.id", ondelete="CASCADE"), nullable=False)

    # Référence vers l'utilisateur qui a écrit le commentaire
    user_id    = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Le texte du commentaire
    contenu    = Column(Text, nullable=False)

    # Date de création du commentaire (remplie automatiquement)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.now)
