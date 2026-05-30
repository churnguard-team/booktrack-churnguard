"""
Service de notifications in-app.
Gère les notifications pour les utilisateurs (nouveaux livres, etc.)
"""

from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import text
import uuid
from datetime import datetime


def notify_new_book_matches(
    db: Session,
    book_id: str,
    book_title: str,
    book_auteur: str,
    book_genre_ids: list = None,
) -> Dict[str, Any]:
    """
    Crée des notifications pour les utilisateurs dont les préférences correspondent au nouveau livre.
    
    Déclenche une notification si:
    - L'utilisateur a marqué cet auteur comme préféré
    - L'utilisateur a un genre préféré qui correspond au livre
    
    Args:
        db: Session SQLAlchemy
        book_id: UUID du livre
        book_title: Titre du livre
        book_auteur: Nom de l'auteur
        book_genre_ids: Liste des IDs de genres (optionnel)
        
    Returns:
        Dict avec nombre de notifications créées
    """
    
    matching_users = db.execute(text("""
        SELECT DISTINCT u.id::text, u.prenom, u.email
        FROM users u
        LEFT JOIN book_genres bg ON TRUE
        LEFT JOIN genres g ON g.id = bg.genre_id
        WHERE
            -- Match par auteur (si dans genres_preferes)
            (u.genres_preferes::text LIKE :auteur_pattern)
            OR
            -- Match par genre (s'il y a des genres fournis)
            (:has_genres::boolean AND g.id = ANY(:genre_ids::uuid[]))
        AND u.is_active = true
    """), {
        "auteur_pattern": f"%{book_auteur}%",
        "genre_ids": book_genre_ids or [],
        "has_genres": bool(book_genre_ids),
    }).fetchall()
    
    notifications_created = 0
    failed = 0
    
    for user_id, user_prenom, user_email in matching_users:
        try:
            # Créer la notification
            notif_id = str(uuid.uuid4())
            
            # Déterminer le type de message
            titre = f"✨ Un nouveau livre de {book_auteur}"
            contenu = f"'{book_title}' vient d'être ajouté à BookTrack. Découvrez-le maintenant!"
            
            db.execute(text("""
                INSERT INTO notifications
                    (id, user_id, type, titre, contenu, is_read, metadata, created_at)
                VALUES
                    (:id, :uid, 'RECOMMENDATION'::notification_type, :titre, :contenu, false, :metadata::jsonb, NOW())
            """), {
                "id": notif_id,
                "uid": user_id,
                "titre": titre,
                "contenu": contenu,
                "metadata": str({
                    "book_id": book_id,
                    "book_title": book_title,
                    "book_auteur": book_auteur,
                    "type": "new_book_match",
                }).replace("'", '"'),
            })
            notifications_created += 1
            
        except Exception as e:
            print(f"[notification] Error creating notification for user {user_id}: {e}")
            failed += 1
    
    if notifications_created > 0 or failed > 0:
        db.commit()
    
    return {
        "status": "created",
        "notifications_created": notifications_created,
        "failed": failed,
        "book_id": book_id,
        "book_title": book_title,
    }


def get_user_notifications(
    db: Session,
    user_id: str,
    unread_only: bool = False,
    limit: int = 20,
) -> List[Dict[str, Any]]:
    """
    Récupère les notifications d'un utilisateur.
    
    Args:
        db: Session SQLAlchemy
        user_id: UUID de l'utilisateur
        unread_only: Si True, retourner seulement les non-lues
        limit: Nombre max de notifications
        
    Returns:
        Liste des notifications
    """
    query = """
        SELECT
            id::text,
            user_id::text,
            type,
            titre,
            contenu,
            is_read,
            lu_at,
            metadata,
            created_at
        FROM notifications
        WHERE user_id = :uid
    """
    
    if unread_only:
        query += " AND is_read = false"
    
    query += " ORDER BY created_at DESC LIMIT :limit"
    
    rows = db.execute(text(query), {
        "uid": user_id,
        "limit": limit,
    }).fetchall()
    
    return [
        {
            "id": r[0],
            "user_id": r[1],
            "type": r[2],
            "titre": r[3],
            "contenu": r[4],
            "is_read": r[5],
            "lu_at": r[6].isoformat() if r[6] else None,
            "metadata": r[7] or {},
            "created_at": r[8].isoformat() if r[8] else None,
        }
        for r in rows
    ]


def mark_notification_read(db: Session, notification_id: str) -> Dict[str, Any]:
    """Marquer une notification comme lue."""
    try:
        db.execute(text("""
            UPDATE notifications
            SET is_read = true, lu_at = NOW()
            WHERE id = :nid
        """), {"nid": notification_id})
        db.commit()
        return {"status": "marked"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}


def mark_all_notifications_read(db: Session, user_id: str) -> Dict[str, Any]:
    """Marquer toutes les notifications d'un utilisateur comme lues."""
    try:
        result = db.execute(text("""
            UPDATE notifications
            SET is_read = true, lu_at = NOW()
            WHERE user_id = :uid AND is_read = false
            RETURNING id
        """), {"uid": user_id})
        
        count = result.rowcount
        db.commit()
        
        return {
            "status": "marked",
            "notifications_marked": count,
        }
    except Exception as e:
        return {"status": "error", "detail": str(e)}


def delete_notification(db: Session, notification_id: str) -> Dict[str, Any]:
    """Supprimer une notification."""
    try:
        db.execute(text("""
            DELETE FROM notifications
            WHERE id = :nid
        """), {"nid": notification_id})
        db.commit()
        return {"status": "deleted"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}


def delete_all_notifications(db: Session, user_id: str) -> Dict[str, Any]:
    """Supprimer toutes les notifications d'un utilisateur."""
    try:
        result = db.execute(text("""
            DELETE FROM notifications
            WHERE user_id = :uid
            RETURNING id
        """), {"uid": user_id})
        
        count = result.rowcount
        db.commit()
        
        return {
            "status": "deleted",
            "notifications_deleted": count,
        }
    except Exception as e:
        return {"status": "error", "detail": str(e)}


def get_notification_stats(db: Session, user_id: str) -> Dict[str, Any]:
    """Retourne les statistiques des notifications d'un utilisateur."""
    stats = db.execute(text("""
        SELECT
            COUNT(*) as total,
            COUNT(CASE WHEN is_read = false THEN 1 END) as unread,
            COUNT(CASE WHEN type = 'RECOMMENDATION' THEN 1 END) as recommendations,
            COUNT(CASE WHEN type = 'RETENTION' THEN 1 END) as retention,
            COUNT(CASE WHEN type = 'PROMOTIONAL' THEN 1 END) as promotional,
            MAX(created_at) as last_notification_at
        FROM notifications
        WHERE user_id = :uid
    """), {"uid": user_id}).fetchone()
    
    if not stats[0]:  # No notifications
        return {
            "total": 0,
            "unread": 0,
            "recommendations": 0,
            "retention": 0,
            "promotional": 0,
            "last_notification_at": None,
        }
    
    return {
        "total": stats[0],
        "unread": stats[1],
        "recommendations": stats[2],
        "retention": stats[3],
        "promotional": stats[4],
        "last_notification_at": stats[5].isoformat() if stats[5] else None,
    }


def create_custom_notification(
    db: Session,
    user_id: str,
    titre: str,
    contenu: str,
    notification_type: str = "SYSTEM",
    metadata: dict = None,
) -> Dict[str, Any]:
    """
    Créer une notification personnalisée.
    
    Args:
        db: Session SQLAlchemy
        user_id: UUID de l'utilisateur
        titre: Titre de la notification
        contenu: Contenu de la notification
        notification_type: Type (SYSTEM, PROMOTIONAL, RECOMMENDATION, RETENTION)
        metadata: Métadonnées optionnelles
        
    Returns:
        ID de la notification créée
    """
    try:
        notif_id = str(uuid.uuid4())
        
        db.execute(text("""
            INSERT INTO notifications
                (id, user_id, type, titre, contenu, is_read, metadata, created_at)
            VALUES
                (:id, :uid, :type::notification_type, :titre, :contenu, false, :metadata::jsonb, NOW())
        """), {
            "id": notif_id,
            "uid": user_id,
            "type": notification_type,
            "titre": titre,
            "contenu": contenu,
            "metadata": str(metadata or {}).replace("'", '"'),
        })
        db.commit()
        
        return {
            "status": "created",
            "notification_id": notif_id,
        }
    except Exception as e:
        return {"status": "error", "detail": str(e)}
