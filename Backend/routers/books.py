from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
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
    books = db.query(Book).all()
    return books

@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_book(book_id: UUID, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Livre non trouve")

    db.delete(book)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)