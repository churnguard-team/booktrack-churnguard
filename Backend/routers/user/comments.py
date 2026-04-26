from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import BookComment, User, Book
from schemas import CommentCreate, CommentResponse
import uuid

# Préfixe de l'URL : toutes les routes ici commencent par /books/{book_id}/comments
router = APIRouter(prefix="/books/{book_id}/comments", tags=["Commentaires"])


@router.get("/", response_model=list[CommentResponse])
def get_comments(book_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Récupère tous les commentaires d'un livre donné.
    On fait une JOINTURE avec la table 'users' pour afficher le prénom de l'auteur.
    """
    # Récupère tous les commentaires du livre + le prénom de l'utilisateur associé
    results = (
        db.query(BookComment, User.prenom, User.nom)
        .join(User, BookComment.user_id == User.id)
        .filter(BookComment.book_id == book_id)
        .order_by(BookComment.created_at.desc())  # Du plus récent au plus ancien
        .all()
    )

    # Construit la liste de réponses enrichies avec le nom de l'auteur
    comments = []
    for comment, prenom, nom in results:
        comments.append(CommentResponse(
            id=comment.id,
            book_id=comment.book_id,
            user_id=comment.user_id,
            auteur=f"{prenom} {nom}",  # Nom affiché dans l'interface
            contenu=comment.contenu,
            created_at=comment.created_at,
        ))
    return comments


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=CommentResponse)
def add_comment(book_id: uuid.UUID, payload: CommentCreate, db: Session = Depends(get_db)):
    """
    Ajoute un commentaire sur un livre.
    Vérifie que le livre et l'utilisateur existent avant d'insérer.
    """
    # Vérifie que le livre existe dans la base
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Livre introuvable")

    # Vérifie que l'utilisateur existe
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    # Crée le nouveau commentaire en base de données
    new_comment = BookComment(
        book_id=book_id,
        user_id=payload.user_id,
        contenu=payload.contenu,
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)  # Recharge le commentaire pour avoir l'id et created_at générés

    # Retourne le commentaire avec le nom de l'auteur
    return CommentResponse(
        id=new_comment.id,
        book_id=new_comment.book_id,
        user_id=new_comment.user_id,
        auteur=f"{user.prenom} {user.nom}",
        contenu=new_comment.contenu,
        created_at=new_comment.created_at,
    )


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(book_id: uuid.UUID, comment_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Supprime un commentaire — réservé à l'administrateur.
    Vérifie que le commentaire appartient bien au livre avant de supprimer.
    """
    # Cherche le commentaire qui correspond à cet id ET ce livre
    comment = db.query(BookComment).filter(
        BookComment.id == comment_id,
        BookComment.book_id == book_id
    ).first()

    # Si le commentaire n'existe pas, on retourne une erreur 404
    if not comment:
        raise HTTPException(status_code=404, detail="Commentaire introuvable")

    # Supprime le commentaire de la base de données
    db.delete(comment)
    db.commit()

    # 204 No Content = suppression réussie, pas de corps dans la réponse
    return None
