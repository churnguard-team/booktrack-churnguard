"""
API endpoints pour gerer les campagnes de retention par email.
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any

from database import get_db
from services.retention_service import get_high_churn_users, trigger_retention_campaign
from services.email_service import send_retention_email, mark_email_opened, mark_email_clicked
from services.churn_service import run_daily_churn_scoring

router = APIRouter(prefix="/api/retention", tags=["retention"])


class RetentionCampaignRequest(BaseModel):
    """Request pour déclencher une campagne de retention."""
    discount_percent: int = 20
    message: str = None


class ManualEmailRequest(BaseModel):
    """Request pour envoyer un email manuel."""
    user_id: str
    discount_percent: int = 20


class EmailTrackingRequest(BaseModel):
    """Request pour tracker les events email."""
    action_id: str
    event_type: str  # "opened" ou "clicked"


@router.get("/high-risk-users")
def get_high_risk_churn_users(
    threshold: float = 0.6,
    limit: int = 50,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Retourne les utilisateurs avec churn_score >= seuil.
    Ces utilisateurs sont candidates pour les emails de rétention.
    """
    users = get_high_churn_users(db, threshold=threshold)
    return {
        "status": "success",
        "count": len(users),
        "threshold": threshold,
        "users": users[:limit],
    }


@router.post("/trigger-campaign")
def trigger_retention_campaign_endpoint(
    request: RetentionCampaignRequest,
    threshold: float = 0.6,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Déclenche une campagne de rétention par email pour tous les users avec score > seuil.
    
    Args:
        request: Configuration de la campagne
        threshold: Seuil de churn_score pour envoyer un email (défaut 0.6)
        
    Returns:
        Résumé de la campagne
    """
    high_risk_users = get_high_churn_users(db, threshold=threshold)
    
    if not high_risk_users:
        return {
            "status": "no_users",
            "detail": f"No users found with churn_score >= {threshold}",
        }
    
    sent = 0
    failed = 0
    results = []
    
    for user in high_risk_users:
        try:
            result = send_retention_email(
                db,
                user["user_id"],
                user["churn_score"],
                discount_percent=request.discount_percent,
            )
            
            if result["status"] == "sent":
                sent += 1
                results.append({
                    "user_id": user["user_id"],
                    "email": result["email"],
                    "status": "sent",
                    "discount_code": result["discount_code"],
                })
            else:
                failed += 1
                results.append({
                    "user_id": user["user_id"],
                    "status": "failed",
                    "detail": result.get("detail", "Unknown error"),
                })
        except Exception as e:
            failed += 1
            results.append({
                "user_id": user["user_id"],
                "status": "failed",
                "detail": str(e),
            })
    
    return {
        "status": "campaign_executed",
        "campaign_type": "retention_emails",
        "discount_percent": request.discount_percent,
        "total_users": len(high_risk_users),
        "emails_sent": sent,
        "emails_failed": failed,
        "threshold": threshold,
        "results": results,
    }


@router.post("/send-email")
def send_retention_email_manual(
    request: ManualEmailRequest,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Envoie un email de rétention manuellement à un utilisateur spécifique.
    """
    result = send_retention_email(
        db,
        request.user_id,
        churn_score=0.65,  # Score par défaut pour email manuel
        discount_percent=request.discount_percent,
    )
    
    if result["status"] == "sent":
        return {
            "status": "success",
            **result,
        }
    else:
        raise HTTPException(
            status_code=400,
            detail=result.get("detail", "Failed to send email"),
        )


@router.post("/track-event")
def track_email_event(
    request: EmailTrackingRequest,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Track les événements des emails (ouverture, clic).
    Appelé par webhook SendGrid ou pixel tracking.
    """
    if request.event_type == "opened":
        result = mark_email_opened(db, request.action_id)
    elif request.event_type == "clicked":
        result = mark_email_clicked(db, request.action_id)
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown event_type: {request.event_type}",
        )
    
    return result


@router.post("/run-daily")
def run_daily_churn_and_retention(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Lance la détection churn + emails en arrière-plan.
    Répond immédiatement avec status=queued.
    """
    from database import SessionLocal

    def _run():
        bg_db = SessionLocal()
        try:
            result = run_daily_churn_scoring(bg_db, send_emails=True)
            print(f"[retention] run-daily completed: {result}")
        except Exception as e:
            print(f"[retention] run-daily failed: {e}")
        finally:
            bg_db.close()

    background_tasks.add_task(_run)
    return {"status": "queued", "message": "Détection churn lancée en arrière-plan."}


@router.get("/stats")
def get_retention_stats(
    days: int = 30,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Retourne les statistiques des campagnes de rétention par email.
    """
    from sqlalchemy import text
    
    stats = db.execute(text("""
        SELECT
            statut,
            type_action,
            COUNT(*) as count,
            COUNT(CASE WHEN date_ouverture IS NOT NULL THEN 1 END) as opened,
            COUNT(CASE WHEN date_clic IS NOT NULL THEN 1 END) as clicked
        FROM retention_actions
        WHERE type_action = 'EMAIL_RETENTION'
        AND created_at >= NOW() - INTERVAL :days || ' days'
        GROUP BY statut, type_action
    """), {"days": days}).fetchall()
    
    total_sent = sum(s[2] for s in stats if s[0] == "SENT")
    total_opened = sum(s[3] for s in stats)
    total_clicked = sum(s[4] for s in stats)
    
    open_rate = (total_opened / total_sent * 100) if total_sent > 0 else 0
    ctr = (total_clicked / total_sent * 100) if total_sent > 0 else 0
    
    return {
        "period_days": days,
        "total_sent": total_sent,
        "total_opened": total_opened,
        "total_clicked": total_clicked,
        "open_rate_percent": round(open_rate, 2),
        "ctr_percent": round(ctr, 2),
        "breakdown": [
            {
                "status": s[0],
                "action_type": s[1],
                "total": s[2],
                "opened": s[3],
                "clicked": s[4],
            }
            for s in stats
        ],
    }
