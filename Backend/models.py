from sqlalchemy import Column, String, Integer, Text, Date, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID
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
    langue           = Column(String(50))
    created_at       = Column(TIMESTAMP(timezone=True), default=datetime.now)