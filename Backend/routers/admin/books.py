from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.sql import func
from database import get_db
from models import Book, Genre, UserBook
from schemas import BookResponse, BookCreate
from services.notification_service import notify_new_book_matches
from typing import List
from uuid import UUID

router = APIRouter(prefix="/books", tags=["Books"])

BOOK_FIELDS = {
    "title",
    "description",
    "auteur",
    "type",
    "cover_url",
    "nb_pages",
    "date_publication",
    "langue",
}


def resolve_book_genres(book: BookCreate, db: Session) -> list[Genre]:
    if book.genre_ids:
        genres = db.query(Genre).filter(Genre.id.in_(book.genre_ids)).all()
        found_ids = {genre.id for genre in genres}
        missing_ids = [str(genre_id) for genre_id in book.genre_ids if genre_id not in found_ids]
        if missing_ids:
            raise HTTPException(
                status_code=400,
                detail=f"Genre introuvable: {', '.join(missing_ids)}",
            )
        return genres

    if book.genre:
        genre_name = book.genre.strip()
        genre_type = book.type
        query = db.query(Genre).filter(Genre.name.ilike(genre_name))
        if genre_type:
            query = query.filter(Genre.type.ilike(genre_type))
        genre = query.first()
        if not genre:
            genre = Genre(name=genre_name, type=genre_type)
            db.add(genre)
            db.flush()
        return [genre]

    return []


@router.post("/", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
def create_book(book: BookCreate, db: Session = Depends(get_db)):
    new_book = Book(**book.model_dump(include=BOOK_FIELDS))
    new_book.genres = resolve_book_genres(book, db)
    db.add(new_book)
    db.commit()
    db.refresh(new_book)
    
    # Déclencher les notifications pour les utilisateurs correspondants
    try:
        genre_ids = [str(g.id) for g in new_book.genres] if new_book.genres else None
        notify_result = notify_new_book_matches(
            db,
            str(new_book.id),
            new_book.title,
            new_book.auteur or "Auteur inconnu",
            genre_ids,
        )
        print(f"[notifications] New book notifications: {notify_result}")
    except Exception as e:
        print(f"[notifications] Error creating notifications for new book: {e}")
    
    return new_book


@router.get("/", response_model=List[BookResponse])
def get_books(skip: int = 0, limit: int = 25, db: Session = Depends(get_db)):
    return db.query(Book).options(joinedload(Book.genres)).offset(skip).limit(limit).all()


@router.get("/trending", response_model=List[BookResponse])
def get_trending_books(db: Session = Depends(get_db)):
    return db.query(Book).options(joinedload(Book.genres)).order_by(func.random()).limit(10).all()


@router.get("/count")
def count_books(db: Session = Depends(get_db)):
    return {"total": db.query(Book).count()}


@router.get("/{book_id}")
def get_book(book_id: UUID, db: Session = Depends(get_db)):
    book = db.query(Book).options(joinedload(Book.genres)).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Livre non trouve")
    stats = db.query(
        func.round(func.avg(UserBook.rating), 1).label("avg_rating"),
        func.count(UserBook.rating).label("rating_count"),
    ).filter(UserBook.book_id == book_id, UserBook.rating.isnot(None)).one()
    result = BookResponse.model_validate(book).model_dump()
    result["avg_rating"] = float(stats.avg_rating) if stats.avg_rating else None
    result["rating_count"] = stats.rating_count
    return result


@router.put("/{book_id}", response_model=BookResponse)
def update_book(book_id: UUID, book: BookCreate, db: Session = Depends(get_db)):
    db_book = db.query(Book).filter(Book.id == book_id).first()
    if not db_book:
        raise HTTPException(status_code=404, detail="Livre non trouve")
    db_book.title            = book.title
    db_book.description      = book.description
    db_book.auteur           = book.auteur
    db_book.type             = book.type
    db_book.cover_url        = book.cover_url
    db_book.nb_pages         = book.nb_pages
    db_book.date_publication = book.date_publication
    db_book.langue           = book.langue
    db_book.genres           = resolve_book_genres(book, db)
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