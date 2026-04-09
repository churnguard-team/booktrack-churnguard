from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Book
from schemas import BookResponse
from typing import List

router = APIRouter(prefix="/books", tags=["Books"])

@router.get("/", response_model=List[BookResponse])
def get_books(db: Session = Depends(get_db)):
    books = db.query(Book).all()
    return books