from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from sqlalchemy.sql import func  # func.random() pour l'ordre aléatoire
from database import get_db
from models import Book
from schemas import BookResponse, BookCreate
from typing import List
from uuid import UUID

router = APIRouter(prefix="/books", tags=["Books"])

@router.post("/", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
def create_book(book: BookCreate, db: Session = Depends(get_db)):
    new_book = Book(**book.model_dump())
    db.add(new_book)
    db.commit()
    db.refresh(new_book)
    return new_book

@router.get("/", response_model=List[BookResponse])
def get_books(db: Session = Depends(get_db)):
    books = db.query(Book).limit(1000).all()
    return books


# ⚠️  Cette route DOIT être AVANT /{book_id}, sinon FastAPI pourrait
#  confondre "trending" avec un UUID et renvoyer une erreur 422
@router.get("/trending", response_model=List[BookResponse])
def get_trending_books(db: Session = Depends(get_db)):
    """
    Retourne 10 livres dans un ordre ALÉATOIRE.
    (Simulation des tendances - plus tard on pourra utiliser
     la table user_events pour les vrais clics de la semaine)
    """
    books = db.query(Book).order_by(func.random()).limit(10).all()
    return books

@router.get("/{book_id}", response_model=BookResponse)
def get_book(book_id: UUID, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Livre non trouvé")
    return book


@router.put("/{book_id}", response_model=BookResponse)
def update_book(book_id: UUID, book: BookCreate, db: Session = Depends(get_db)):
    db_book = db.query(Book).filter(Book.id == book_id).first()
    if not db_book:
        raise HTTPException(status_code=404, detail="Livre non trouve")
    db_book.title = book.title
    db_book.description = book.description
    db_book.auteur = book.auteur
    db_book.genre = book.genre
    # ⚠️ isbn n'est PAS dans BookCreate, on ne le modifie pas ici
    db_book.cover_url = book.cover_url
    db_book.nb_pages = book.nb_pages
    db_book.date_publication = book.date_publication
    db_book.langue = book.langue
    db.commit()
    db.refresh(db_book)
    return db_book

@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_book(book_id: UUID, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Livre non trouve")

    db.delete(book)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)