"""
API endpoints pour gérer les notifications in-app.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any
import json

from database import get_db
from services.notification_service import (
    get_user_notifications,
    mark_notification_read,
    mark_all_notifications_read,
    delete_notification,
    delete_all_notifications,
    get_notification_stats,
    create_custom_notification,
)

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


class NotificationCreate(BaseModel):
    """Request pour créer une notification personnalisée."""
    titre: str
    contenu: str
    notification_type: str = "SYSTEM"
    metadata: dict = None


@router.post("/generate-recommendation-notifs")
def generate_recommendation_notifications(
    limit: int = 50,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Genere des notifications de recommandation pour les users actifs.
    Chaque user recoit 1 notif avec le top livre recommande pour lui.
    """
    from services.recommendation_service import recommend_for_user
    from sqlalchemy import text
    import uuid

    users = db.execute(text(
        "SELECT id::text FROM users WHERE is_active = true LIMIT :l"
    ), {"l": limit}).fetchall()

    created = 0
    for (uid,) in users:
        try:
            recs = recommend_for_user(db, uid, n=1)
            if not recs:
                continue
            book = recs[0]
            reason_map = {
                "genre_preference": "correspond a vos genres preferes",
                "based_on_comments": "similaire a vos lectures commentees",
                "recently_viewed": "que vous avez consulte recemment",
                "popular": "tres populaire en ce moment",
            }
            reason_text = reason_map.get(book.get("reason", ""), "selectionne pour vous")
            db.execute(text("""
                INSERT INTO notifications (id, user_id, type, titre, contenu, is_read, metadata, created_at)
                VALUES (:id, :uid, 'RECOMMENDATION', :titre, :contenu, false, CAST(:meta AS jsonb), NOW())
            """), {
                "id": str(uuid.uuid4()),
                "uid": uid,
                "titre": f"\U0001f4da Recommande pour vous : {book['title']}",
                "contenu": f"'{book['title']}' de {book['auteur']} — {reason_text}.",
                "meta": json.dumps({"book_id": book["book_id"], "reason": book.get("reason"), "score": book.get("score")}),
            })
            created += 1
        except Exception:
            continue

    db.commit()
    return {"status": "ok", "notifications_created": created}


@router.get("/user/{user_id}")
def get_notifications(
    user_id: str,
    unread_only: bool = False,
    limit: int = 20,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Récupère les notifications d'un utilisateur."""
    notifications = get_user_notifications(
        db,
        user_id,
        unread_only=unread_only,
        limit=limit,
    )
    return {
        "status": "success",
        "count": len(notifications),
        "unread_only": unread_only,
        "notifications": notifications,
    }


@router.get("/user/{user_id}/unread")
def get_unread_notifications(
    user_id: str,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Alias pour récupérer seulement les notifications non-lues."""
    notifications = get_user_notifications(
        db,
        user_id,
        unread_only=True,
        limit=100,
    )
    
    return {
        "status": "success",
        "unread_count": len(notifications),
        "notifications": notifications,
    }


@router.get("/user/{user_id}/stats")
def get_stats(
    user_id: str,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Retourne les statistiques des notifications d'un utilisateur."""
    stats = get_notification_stats(db, user_id)
    return {
        "status": "success",
        **stats,
    }


@router.patch("/{notification_id}/read")
def mark_as_read(
    notification_id: str,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Marquer une notification comme lue."""
    result = mark_notification_read(db, notification_id)
    
    if result["status"] == "marked":
        return {
            "status": "success",
            "notification_id": notification_id,
            "is_read": True,
        }
    else:
        raise HTTPException(status_code=400, detail=result.get("detail"))


@router.patch("/user/{user_id}/read-all")
def mark_all_as_read(
    user_id: str,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Marquer toutes les notifications d'un utilisateur comme lues."""
    result = mark_all_notifications_read(db, user_id)
    
    if result["status"] == "marked":
        return {
            "status": "success",
            "user_id": user_id,
            "notifications_marked": result["notifications_marked"],
        }
    else:
        raise HTTPException(status_code=400, detail=result.get("detail"))


@router.delete("/{notification_id}")
def delete_notif(
    notification_id: str,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Supprimer une notification."""
    result = delete_notification(db, notification_id)
    
    if result["status"] == "deleted":
        return {
            "status": "success",
            "notification_id": notification_id,
            "deleted": True,
        }
    else:
        raise HTTPException(status_code=400, detail=result.get("detail"))


@router.delete("/user/{user_id}/delete-all")
def delete_all_notifs(
    user_id: str,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Supprimer toutes les notifications d'un utilisateur."""
    result = delete_all_notifications(db, user_id)
    
    if result["status"] == "deleted":
        return {
            "status": "success",
            "user_id": user_id,
            "notifications_deleted": result["notifications_deleted"],
        }
    else:
        raise HTTPException(status_code=400, detail=result.get("detail"))


@router.post("/")
def create_notification(
    request: NotificationCreate,
    user_id: str,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Créer une notification personnalisée pour un utilisateur.
    
    Endpoint administrateur pour créer des notifications custom.
    """
    result = create_custom_notification(
        db,
        user_id,
        request.titre,
        request.contenu,
        request.notification_type,
        request.metadata,
    )
    
    if result["status"] == "created":
        return {
            "status": "success",
            **result,
        }
    else:
        raise HTTPException(status_code=400, detail=result.get("detail"))
