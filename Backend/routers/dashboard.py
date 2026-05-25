from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from typing import Any

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)) -> dict[str, Any]:
    total_users = db.execute(text("SELECT COUNT(*) FROM users")).scalar() or 0
    active_users = db.execute(text("SELECT COUNT(*) FROM users WHERE is_active = true")).scalar() or 0
    total_books = db.execute(text("SELECT COUNT(*) FROM books")).scalar() or 0

    active_subs = db.execute(
        text("SELECT COUNT(*) FROM subscriptions WHERE status = 'ACTIVE'")
    ).scalar() or 0
    premium_subs = db.execute(
        text("SELECT COUNT(*) FROM subscriptions WHERE status = 'ACTIVE' AND type = 'PREMIUM'")
    ).scalar() or 0

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

    reading_stats = db.execute(text("""
        SELECT
            COUNT(*) FILTER (WHERE statut = 'READ') as lus,
            COUNT(*) FILTER (WHERE statut = 'READING') as en_cours,
            COUNT(*) FILTER (WHERE statut = 'ABANDONED') as abandonnes,
            ROUND(AVG(note) FILTER (WHERE note IS NOT NULL), 2) as note_moyenne
        FROM user_books
    """)).fetchone()

    recent_events = db.execute(text("""
        SELECT event_type, COUNT(*) as total
        FROM user_events
        WHERE occurred_at >= NOW() - INTERVAL '7 days'
        GROUP BY event_type
        ORDER BY total DESC
        LIMIT 6
    """)).fetchall()

    retention_stats = db.execute(text("""
        SELECT statut, COUNT(*) as total
        FROM retention_actions
        GROUP BY statut
    """)).fetchall()

    retention_distribution = {r[0]: r[1] for r in retention_stats}

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


@router.get("/churn-chart")
def get_churn_chart(db: Session = Depends(get_db)) -> dict[str, Any]:
    """
    Data for two churn charts:
    1. Current risk distribution (pie/donut) — LOW / MEDIUM / HIGH / CRITICAL
    2. Churn score evolution over the last 12 months (line) — avg score per month
    """
    # Chart 1 — current distribution
    dist_rows = db.execute(text("""
        SELECT niveau_risque, COUNT(*) AS total
        FROM churn_scores
        WHERE is_latest = true
        GROUP BY niveau_risque
    """)).fetchall()
    distribution = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
    for row in dist_rows:
        distribution[row[0]] = int(row[1])

    # Chart 2 — monthly avg churn score (last 12 months)
    trend_rows = db.execute(text("""
        SELECT
            TO_CHAR(DATE_TRUNC('month', date_calcul), 'YYYY-MM') AS month,
            ROUND(AVG(score)::numeric, 4)                        AS avg_score,
            COUNT(*)                                             AS nb_users
        FROM churn_scores
        WHERE date_calcul >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', date_calcul)
        ORDER BY DATE_TRUNC('month', date_calcul)
    """)).fetchall()
    trend = [
        {"month": r[0], "avg_score": float(r[1]), "nb_users": int(r[2])}
        for r in trend_rows
    ]

    # Chart 3 — HIGH+CRITICAL count per month (bar)
    at_risk_trend_rows = db.execute(text("""
        SELECT
            TO_CHAR(DATE_TRUNC('month', date_calcul), 'YYYY-MM') AS month,
            COUNT(*) FILTER (WHERE niveau_risque IN ('HIGH','CRITICAL')) AS at_risk,
            COUNT(*) AS total
        FROM churn_scores
        WHERE date_calcul >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', date_calcul)
        ORDER BY DATE_TRUNC('month', date_calcul)
    """)).fetchall()
    at_risk_trend = [
        {"month": r[0], "at_risk": int(r[1]), "total": int(r[2])}
        for r in at_risk_trend_rows
    ]

    total = sum(distribution.values())
    return {
        "distribution": distribution,
        "trend": trend,
        "at_risk_trend": at_risk_trend,
        "total_scored": total,
        "churn_rate_percent": round(
            (distribution["HIGH"] + distribution["CRITICAL"]) / total * 100, 1
        ) if total > 0 else 0.0,
    }


@router.get("/subscriptions-chart")
def get_subscriptions_chart(db: Session = Depends(get_db)) -> dict[str, Any]:
    """
    Data for subscription charts:
    1. Plan breakdown — FREE vs PREMIUM (active users only)
    2. New subscriptions per month (last 12 months)
    3. Cancellations per month (last 12 months)
    """
    # Chart 1 — plan breakdown
    plan_rows = db.execute(text("""
        SELECT type, COUNT(*) AS total
        FROM subscriptions
        WHERE status = 'ACTIVE'
        GROUP BY type
    """)).fetchall()
    plans = {"FREE": 0, "PREMIUM": 0}
    for row in plan_rows:
        plans[row[0]] = int(row[1])

    # Users with NO subscription row at all → they are implicitly FREE
    users_without_sub = db.execute(text("""
        SELECT COUNT(*) FROM users u
        WHERE NOT EXISTS (
            SELECT 1 FROM subscriptions s WHERE s.user_id = u.id
        ) AND u.is_active = true
    """)).scalar() or 0
    plans["FREE"] += int(users_without_sub)

    # Chart 2 — new subscriptions per month
    new_subs_rows = db.execute(text("""
        SELECT
            TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
            COUNT(*) FILTER (WHERE type = 'FREE')    AS free_new,
            COUNT(*) FILTER (WHERE type = 'PREMIUM') AS premium_new
        FROM subscriptions
        WHERE created_at >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at)
    """)).fetchall()
    new_subs = [
        {"month": r[0], "free": int(r[1]), "premium": int(r[2])}
        for r in new_subs_rows
    ]

    # Chart 3 — cancellations per month
    cancel_rows = db.execute(text("""
        SELECT
            TO_CHAR(DATE_TRUNC('month', cancelled_at), 'YYYY-MM') AS month,
            COUNT(*) AS cancellations
        FROM subscriptions
        WHERE cancelled_at IS NOT NULL
          AND cancelled_at >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', cancelled_at)
        ORDER BY DATE_TRUNC('month', cancelled_at)
    """)).fetchall()
    cancellations = [
        {"month": r[0], "cancellations": int(r[1])}
        for r in cancel_rows
    ]

    total_active = plans["FREE"] + plans["PREMIUM"]
    return {
        "plans": plans,
        "new_subs_trend": new_subs,
        "cancellations_trend": cancellations,
        "total_active_users": total_active,
        "premium_rate_percent": round(
            plans["PREMIUM"] / total_active * 100, 1
        ) if total_active > 0 else 0.0,
    }
