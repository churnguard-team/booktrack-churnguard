# backend/routers/moderator.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from ml_models.churn import predict_churn, get_stats_for_dashboard
from database import get_db
from services.recommendation_service import (
    get_recommendation_stats,
    recommend_for_user,
    get_popular_books,
)

router = APIRouter(prefix="/api/moderator", tags=["moderator"])


@router.get("/churn/stats")
def get_churn_stats():
    """Stats du modèle ML XGBoost (métriques entraînement)."""
    return get_stats_for_dashboard()


@router.post("/churn/predict")
def predict_user_churn(user_features: dict):
    return predict_churn(user_features)


@router.get("/dashboard-summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    """
    Résumé complet pour le dashboard modérateur.
    Combine : stats recommandations + churn distribution BD + métriques modèle ML.
    """
    rec_stats = get_recommendation_stats(db)

    # Métriques du modèle ML (XGBoost/Random Forest)
    try:
        ml_stats = get_stats_for_dashboard()
    except Exception:
        ml_stats = {}

    return {**rec_stats, "ml_model": ml_stats}


@router.get("/model-status")
def get_model_status():
    """Statut des modèles ML pour le composant ModelStatus."""
    try:
        churn = get_stats_for_dashboard()
        metrics = churn.get("metrics", {})
        model_name = churn.get("model_name", "random_forest")
        trained = bool(metrics)
    except Exception:
        metrics = {}
        model_name = "random_forest"
        trained = False

    return {
        "churn_model": {
            "name": model_name,
            "status": "active" if trained else "unavailable",
            "trained": trained,
            "metrics": metrics,
            "last_update": "Voir saved_models/",
        },
        "recommendation_model": {
            "name": "content_based_hybrid",
            "status": "active",
            "trained": True,
            "description": "Genres + notes + commentaires + churn priority",
            "last_update": "Temps réel",
        },
        # Structure attendue par ModelStatus.tsx
        "churn_models": {
            "random_forest": {
                "trained": trained,
                "last_update": "Voir saved_models/",
                "metrics": metrics,
            },
            "xgboost": {
                "trained": trained,
                "last_update": "Voir saved_models/",
                "metrics": metrics,
            },
        },
        "recommendation": {
            "trained": True,
            "last_update": "Temps réel",
        },
    }


@router.get("/recommendations/user/{user_id}")
def get_user_recs_moderator(user_id: str, n: int = 10, db: Session = Depends(get_db)):
    """Recommandations pour un utilisateur spécifique (vue modérateur)."""
    return {"user_id": user_id, "recommendations": recommend_for_user(db, user_id, n)}


@router.get("/recommendations/popular")
def get_popular_moderator(n: int = 10, db: Session = Depends(get_db)):
    return {"books": get_popular_books(db, n)}


@router.get("/full-stats")
def get_full_stats(db: Session = Depends(get_db)):
    """Toutes les statistiques pour le dashboard modérateur en un seul appel."""

    # ── KPIs utilisateurs ─────────────────────────────────────────
    total_users = db.execute(text("SELECT COUNT(*) FROM users")).scalar() or 0
    active_users = db.execute(text("SELECT COUNT(*) FROM users WHERE is_active = true")).scalar() or 0
    new_users_30d = db.execute(text(
        "SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '30 days'"
    )).scalar() or 0
    new_users_7d = db.execute(text(
        "SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '7 days'"
    )).scalar() or 0

    # ── Abonnements ───────────────────────────────────────────────
    active_subs = db.execute(text(
        "SELECT COUNT(*) FROM subscriptions WHERE status = 'ACTIVE'"
    )).scalar() or 0
    premium_subs = db.execute(text(
        "SELECT COUNT(*) FROM subscriptions WHERE status = 'ACTIVE' AND type = 'PREMIUM'"
    )).scalar() or 0
    free_subs = active_subs - premium_subs

    # ── Livres & lecture ──────────────────────────────────────────
    total_books = db.execute(text("SELECT COUNT(*) FROM books")).scalar() or 0
    reading_row = db.execute(text("""
        SELECT
            COUNT(*) FILTER (WHERE statut = 'READ')      AS lus,
            COUNT(*) FILTER (WHERE statut = 'READING')   AS en_cours,
            COUNT(*) FILTER (WHERE statut = 'ABANDONED') AS abandonnes,
            ROUND(AVG(note) FILTER (WHERE note IS NOT NULL), 2) AS note_moyenne
        FROM user_books
    """)).fetchone()
    reading_stats = {
        "lus": reading_row[0] or 0,
        "en_cours": reading_row[1] or 0,
        "abandonnes": reading_row[2] or 0,
        "note_moyenne": float(reading_row[3]) if reading_row[3] else None,
    }

    # ── Churn distribution (depuis BD) ────────────────────────────
    churn_rows = db.execute(text("""
        SELECT niveau_risque, COUNT(*) FROM churn_scores
        WHERE is_latest = true GROUP BY niveau_risque
    """)).fetchall()
    churn_distribution = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
    for row in churn_rows:
        churn_distribution[row[0]] = row[1]
    total_scored = sum(churn_distribution.values())
    churn_rate = round(
        (churn_distribution["HIGH"] + churn_distribution["CRITICAL"]) / total_scored * 100, 1
    ) if total_scored > 0 else 0.0

    # ── Utilisateurs à risque ─────────────────────────────────────
    at_risk_rows = db.execute(text("""
        SELECT u.nom, u.prenom, u.email, cs.score, cs.niveau_risque
        FROM users u
        JOIN churn_scores cs ON cs.user_id = u.id AND cs.is_latest = true
        WHERE cs.niveau_risque IN ('HIGH', 'CRITICAL')
        ORDER BY cs.score DESC LIMIT 5
    """)).fetchall()
    at_risk_users = [
        {"name": f"{r[1]} {r[0]}", "email": r[2],
         "churn_risk": round(float(r[3]) * 100, 1), "niveau_risque": r[4]}
        for r in at_risk_rows
    ]

    # ── Activité récente (7j) ─────────────────────────────────────
    event_rows = db.execute(text("""
        SELECT event_type, COUNT(*) FROM user_events
        WHERE occurred_at >= NOW() - INTERVAL '7 days'
        GROUP BY event_type ORDER BY COUNT(*) DESC LIMIT 6
    """)).fetchall()
    recent_events = [{"type": r[0], "total": r[1]} for r in event_rows]

    # ── Nouveaux utilisateurs par mois (6 derniers mois) ──────────
    monthly_rows = db.execute(text("""
        SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') AS mois,
               COUNT(*) AS total
        FROM users
        WHERE created_at >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at)
    """)).fetchall()
    monthly_signups = [{"month": r[0], "total": r[1]} for r in monthly_rows]

    # ── Top genres ────────────────────────────────────────────────
    genre_rows = db.execute(text("""
        SELECT b.genre, COUNT(ub.id) AS total
        FROM user_books ub JOIN books b ON b.id = ub.book_id
        WHERE b.genre IS NOT NULL
        GROUP BY b.genre ORDER BY total DESC LIMIT 5
    """)).fetchall()
    top_genres = [{"genre": r[0], "total": r[1]} for r in genre_rows]

    # ── Métriques ML (Random Forest) ──────────────────────────────
    try:
        ml_stats = get_stats_for_dashboard()
    except Exception:
        ml_stats = {}

    return {
        "kpis": {
            "total_users": total_users,
            "active_users": active_users,
            "new_users_30d": new_users_30d,
            "new_users_7d": new_users_7d,
            "total_books": total_books,
            "active_subscriptions": active_subs,
            "premium_subscriptions": premium_subs,
            "free_subscriptions": free_subs,
            "churn_rate_percent": churn_rate,
            "at_risk_count": churn_distribution["HIGH"] + churn_distribution["CRITICAL"],
        },
        "churn": {
            "distribution": churn_distribution,
            "rate_percent": churn_rate,
            "total_scored": total_scored,
            "at_risk_users": at_risk_users,
        },
        "ml_model": ml_stats,
        "reading_stats": reading_stats,
        "top_genres": top_genres,
        "recent_events": recent_events,
        "monthly_signups": monthly_signups,
    }
