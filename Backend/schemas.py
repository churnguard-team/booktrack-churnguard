from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
import uuid

class BookResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: Optional[str]
    auteur: Optional[str]
    genre: Optional[str]
    cover_url: Optional[str]
    nb_pages: Optional[int]
    date_publication: Optional[date]
    langue: Optional[str]

    class Config:
        from_attributes = True