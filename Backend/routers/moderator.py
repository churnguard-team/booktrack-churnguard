# backend/routers/moderator.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text, desc
from ml_models.churn import predict_churn, get_stats_for_dashboard
from ml_models.feature_mapper import BookTrackToTelecomMapper, get_all_users_features
from services.churn_service import (
    predict_and_save,
    get_latest_prediction,
    get_churn_stats,
    get_high_risk_users,
    get_user_prediction_history,
    batch_predict_and_save,
    get_churn_trend
)
from database import get_db
from models import ChurnScore
from services.recommendation_service import (
    get_recommendation_stats,
    recommend_for_user,
    get_popular_books,
)

router = APIRouter(prefix="/api/moderator", tags=["moderator"])


@router.get("/churn/stats")
def get_churn_statistics_endpoint(db: Session = Depends(get_db)):
    """
    Get dashboard churn statistics from database.
    
    Returns:
    - total_users_scored: how many users have predictions
    - churn_distribution: count by risk level
    - high_risk_count: users in ÉLEVÉ or CRITIQUE
    - high_risk_percentage: % of users at risk
    - average_churn_probability: mean churn score
    - high_risk_users: top 5 users by churn probability
    """
    try:
        stats = get_churn_stats(db)
        high_risk = get_high_risk_users(db, limit=5)
        
        return {
            **stats,
            "high_risk_users": [
                {
                    "user_id": str(u.user_id),
                    "churn_probability": round(u.churn_probability, 3),
                    "risk_level": u.risk_level,
                    "predicted_at": u.predicted_at
                }
                for u in high_risk
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting churn stats: {str(e)}")


@router.post("/churn/predict")
def predict_user_churn(user_features: dict):
    """
    Direct prediction: pass features manually.
    Useful for testing. For production, use POST /churn/predict-user
    """
    return predict_churn(user_features)


@router.post("/churn/predict-user/{user_id}")
def predict_user_churn_from_db(user_id: str, db: Session = Depends(get_db)):
    """
    Predict churn for a user by their ID.
    
    Flow:
    1. Extract user data from database
    2. Map to XGBoost features
    3. Get prediction
    4. Save to churn_scores table
    5. Return prediction with mapped features for debugging
    
    Returns:
    - user_id: UUID
    - churn_probability: 0-1
    - churn_prediction: 0 or 1
    - risk_level: FAIBLE/MOYEN/ÉLEVÉ/CRITIQUE
    - predicted_at: timestamp
    - mapped_features: the translated features (for debugging)
    """
    try:
        # Predict and save in one step
        score = predict_and_save(user_id, db)
        
        # Also get mapped features for transparency
        mapper = BookTrackToTelecomMapper()
        features = mapper.extract_user_features(user_id, db)
        
        return {
            "user_id": user_id,
            "churn_probability": round(score.churn_probability, 3),
            "churn_prediction": score.churn_prediction,
            "risk_level": score.risk_level,
            "predicted_at": score.predicted_at,
            "mapped_features": features,  # For debugging/transparency
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@router.get("/churn/user/{user_id}/latest")
def get_user_latest_churn(user_id: str, db: Session = Depends(get_db)):
    """Get the latest churn prediction for a user."""
    try:
        score = get_latest_prediction(user_id, db)
        if not score:
            raise HTTPException(status_code=404, detail="No predictions found for this user")
        
        return {
            "user_id": user_id,
            "churn_probability": score.churn_probability,
            "risk_level": score.risk_level,
            "predicted_at": score.predicted_at
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/churn/user/{user_id}/history")
def get_user_churn_history(user_id: str, limit: int = 10, db: Session = Depends(get_db)):
    """Get churn prediction history for a user (most recent first)."""
    try:
        history = get_user_prediction_history(user_id, db, limit)
        
        return {
            "user_id": user_id,
            "history": [
                {
                    "churn_probability": h.churn_probability,
                    "risk_level": h.risk_level,
                    "predicted_at": h.predicted_at
                }
                for h in history
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/churn/trend")
def get_churn_trend_endpoint(days: int = 7, db: Session = Depends(get_db)):
    """Get churn trend over N days for charts."""
    try:
        trend = get_churn_trend(db, days)
        return {"days": days, "trend": trend}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/churn/batch-predict")
def batch_predict_all_users(limit: int = None, db: Session = Depends(get_db)):
    """
    Predict churn for all active users and save to database.
    
    Query params:
    - limit: Max users to process (for testing)
    
    Returns:
    - total_users: how many were processed
    - predictions_saved: successful predictions
    - errors_count: failed predictions
    - statistics: aggregated stats
    - errors: list of failures (if any)
    """
    try:
        result = batch_predict_and_save(db, limit)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch prediction error: {str(e)}")


@router.get("/dashboard-summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    """
    Résumé complet pour le dashboard modérateur.
    Combine : stats recommandations + churn stats BD + métriques modèle ML.
    """
    rec_stats = get_recommendation_stats(db)
    churn_stats = get_churn_stats(db)

    return {
        **rec_stats,
        "churn": churn_stats,
        "ml_model": get_stats_for_dashboard()
    }


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
