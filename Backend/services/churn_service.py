from typing import Any, Dict, List

from sqlalchemy.orm import Session
from sqlalchemy import text

from ml_models.churn import predict_churn


def run_daily_churn_scoring(db: Session) -> Dict[str, Any]:
    """Placeholder churn scoring pipeline.

    The current repository does not yet provide a complete feature extraction
    pipeline for automatic churn scoring. This function is kept so the API
    and scheduler can start cleanly.
    """
    # TODO: implement feature extraction and insert churn scores into churn_scores
    return {
        "status": "not_implemented",
        "detail": (
            "Automatic churn scoring is not configured. "
            "Use /api/churn/predict with user features for one-off predictions."
        ),
    }


def get_churn_history(db: Session, days: int = 30) -> List[Dict[str, Any]]:
    """Retrieve churn scoring history for the last N days."""
    query = text(
        """
        SELECT
            cs.id::text,
            cs.user_id::text,
            cs.score,
            cs.niveau_risque,
            cs.date_calcul,
            cs.model_version,
            cs.features_snapshot
        FROM churn_scores cs
        WHERE cs.date_calcul >= NOW() - INTERVAL :days || ' days'
        ORDER BY cs.date_calcul DESC
        """
    )
    rows = db.execute(query, {"days": days}).fetchall()

    return [
        {
            "id": str(r[0]),
            "user_id": str(r[1]),
            "score": float(r[2]),
            "niveau_risque": r[3],
            "date_calcul": r[4].isoformat() if r[4] else None,
            "model_version": r[5],
            "features_snapshot": r[6],
        }
        for r in rows
    ]


def get_high_risk_users(db: Session, limit: int = 10) -> List[Dict[str, Any]]:
    """Return the top high-risk churn users based on latest churn scores."""
    query = text(
        """
        SELECT
            u.id::text,
            u.nom,
            u.prenom,
            u.email,
            cs.score,
            cs.niveau_risque,
            u.genres_preferes
        FROM users u
        JOIN churn_scores cs ON cs.user_id = u.id AND cs.is_latest = true
        WHERE cs.niveau_risque IN ('HIGH', 'CRITICAL')
        ORDER BY cs.score DESC
        LIMIT :limit
        """
    )
    rows = db.execute(query, {"limit": limit}).fetchall()

    return [
        {
            "user_id": r[0],
            "nom": r[1],
            "prenom": r[2],
            "email": r[3],
            "score": float(r[4]),
            "niveau_risque": r[5],
            "genres_preferes": list(r[6]) if r[6] else [],
        }
        for r in rows
    ]
