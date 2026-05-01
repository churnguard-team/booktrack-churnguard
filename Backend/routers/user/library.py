from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import UserBook, Book, User
from schemas import UserBookCreate, UserBookUpdate
import uuid

# Le préfixe permet d'avoir des URL propres : /users/MON_ID/library
router = APIRouter(prefix="/users/{user_id}/library", tags=["Bibliothèque Utilisateur"])

@router.post("/", status_code=status.HTTP_201_CREATED)
def add_book_to_library(user_id: uuid.UUID, user_book: UserBookCreate, db: Session = Depends(get_db)):
    # 1. Vérifier si le livre existe dans la base globale
    book = db.query(Book).filter(Book.id == user_book.book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Livre introuvable dans BookTrack")
        
    # 2. Vérifier si l'utilisateur a DÉJÀ ce livre
    existing = db.query(UserBook).filter(UserBook.user_id == user_id, UserBook.book_id == user_book.book_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ce livre est déjà dans votre étagère")
        
    # 3. Ajouter le livre !
    new_entry = UserBook(
        user_id=user_id,
        book_id=user_book.book_id,
        status=user_book.status,
        is_favourite=user_book.is_favourite
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return {
    "message": "Livre ajouté avec succès",
    "data": {
        "id": str(new_entry.id),
        "book_id": str(new_entry.book_id),
        "status": new_entry.status,
        "is_favourite": new_entry.is_favourite
    }
}


@router.get("/")
def get_user_library(user_id: uuid.UUID, db: Session = Depends(get_db)):
    # MAGIE SQLALCHEMY : On fait une JOINTURE entre la table 'user_books' et 'books' en une seule ligne !
    library = db.query(UserBook, Book).join(Book, UserBook.book_id == Book.id).filter(UserBook.user_id == user_id).all()
    
    results = []
    # On renvoie à la fois les stats de l'utilisateur (favori, statut) ET les infos du livre (titre, cover)
    for ubook, book in library:
        results.append({
            "book_id": book.id,
            "title": book.title,
            "auteur": book.auteur,
            "genre": book.genre,
            "cover_url": book.cover_url,
            "status": ubook.status,
            "is_favourite": ubook.is_favourite,
            "rating": ubook.rating,
            "review": ubook.review
        })
    return results


@router.put("/{book_id}")
def update_user_book(user_id: uuid.UUID, book_id: uuid.UUID, update_data: UserBookUpdate, db: Session = Depends(get_db)):
    # Cette route servira quand le visiteur cliquera sur le cœur (❤️) pour le passer en favori
    user_book = db.query(UserBook).filter(UserBook.user_id == user_id, UserBook.book_id == book_id).first()
    if not user_book:
        raise HTTPException(status_code=404, detail="Livre non trouvé dans votre bibliothèque")
        
    if update_data.status is not None:
        user_book.status = update_data.status
    if update_data.is_favourite is not None:
        user_book.is_favourite = update_data.is_favourite
        
    db.commit()
    db.refresh(user_book)
    return {
    "message": "Mise à jour réussie",
    "data": {
        "id": str(user_book.id),
        "status": user_book.status,
        "is_favourite": user_book.is_favourite
    }
}
