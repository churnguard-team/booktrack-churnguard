from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, case, text
from database import get_db
from models import User
from typing import Any

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)) -> dict[str, Any]:
    # ── KPIs de base ──────────────────────────────────────────────
    total_users = db.execute(text("SELECT COUNT(*) FROM users")).scalar() or 0
    active_users = db.execute(text("SELECT COUNT(*) FROM users WHERE is_active = true")).scalar() or 0
    total_books = db.execute(text("SELECT COUNT(*) FROM books")).scalar() or 0

    # Abonnements actifs
    active_subs = db.execute(
        text("SELECT COUNT(*) FROM subscriptions WHERE status = 'ACTIVE'")
    ).scalar() or 0
    premium_subs = db.execute(
        text("SELECT COUNT(*) FROM subscriptions WHERE status = 'ACTIVE' AND type = 'PREMIUM'")
    ).scalar() or 0

    # ── Distribution churn (derniers scores) ──────────────────────
    churn_dist = db.execute(text("""
        SELECT niveau_risque, COUNT(*) as total
        FROM churn_scores
        WHERE is_latest = true
        GROUP BY niveau_risque
    """)).fetchall()

    churn_distribution = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
    for row in churn_dist:
        churn_distribution[row[0]] = row[1]

    total_scored = sum(churn_distribution.values())
    churn_rate = round(
        (churn_distribution["HIGH"] + churn_distribution["CRITICAL"]) / total_scored * 100, 1
    ) if total_scored > 0 else 0.0

    # ── Utilisateurs à risque (HIGH + CRITICAL) ───────────────────
    at_risk_rows = db.execute(text("""
        SELECT u.id, u.email, u.nom, u.prenom,
               cs.score, cs.niveau_risque, cs.date_calcul,
               s.type as abonnement
        FROM users u
        JOIN churn_scores cs ON cs.user_id = u.id AND cs.is_latest = true
        LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status = 'ACTIVE'
        WHERE cs.niveau_risque IN ('HIGH', 'CRITICAL')
        ORDER BY cs.score DESC
        LIMIT 10
    """)).fetchall()

    at_risk_users = [
        {
            "id": str(r[0]),
            "email": r[1],
            "nom": r[2],
            "prenom": r[3],
            "score": float(r[4]),
            "niveau_risque": r[5],
            "date_calcul": r[6].isoformat() if r[6] else None,
            "abonnement": r[7] or "FREE",
        }
        for r in at_risk_rows
    ]

    # ── Stats lecture globales ─────────────────────────────────────
    reading_stats = db.execute(text("""
        SELECT
            COUNT(*) FILTER (WHERE statut = 'READ') as lus,
            COUNT(*) FILTER (WHERE statut = 'READING') as en_cours,
            COUNT(*) FILTER (WHERE statut = 'ABANDONED') as abandonnes,
            ROUND(AVG(note) FILTER (WHERE note IS NOT NULL), 2) as note_moyenne
        FROM user_books
    """)).fetchone()

    # ── Activité récente (7 derniers jours) ───────────────────────
    recent_events = db.execute(text("""
        SELECT event_type, COUNT(*) as total
        FROM user_events
        WHERE occurred_at >= NOW() - INTERVAL '7 days'
        GROUP BY event_type
        ORDER BY total DESC
        LIMIT 6
    """)).fetchall()

    # ── Actions de rétention ──────────────────────────────────────
    retention_stats = db.execute(text("""
        SELECT statut, COUNT(*) as total
        FROM retention_actions
        GROUP BY statut
    """)).fetchall()

    retention_distribution = {r[0]: r[1] for r in retention_stats}

    # ── Nouveaux utilisateurs (30 derniers jours) ─────────────────
    new_users_30d = db.execute(text("""
        SELECT COUNT(*) FROM users
        WHERE created_at >= NOW() - INTERVAL '30 days'
    """)).scalar() or 0

    return {
        "kpis": {
            "total_users": total_users,
            "active_users": active_users,
            "total_books": total_books,
            "active_subscriptions": active_subs,
            "premium_subscriptions": premium_subs,
            "churn_rate_percent": churn_rate,
            "at_risk_count": churn_distribution["HIGH"] + churn_distribution["CRITICAL"],
            "new_users_30d": new_users_30d,
        },
        "churn_distribution": churn_distribution,
        "at_risk_users": at_risk_users,
        "reading_stats": {
            "lus": reading_stats[0] or 0,
            "en_cours": reading_stats[1] or 0,
            "abandonnes": reading_stats[2] or 0,
            "note_moyenne": float(reading_stats[3]) if reading_stats[3] else None,
        },
        "recent_events": [{"type": r[0], "total": r[1]} for r in recent_events],
        "retention_distribution": retention_distribution,
    }
