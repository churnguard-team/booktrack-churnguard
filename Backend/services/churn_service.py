from typing import Any, Dict, List

from sqlalchemy.orm import Session
from sqlalchemy import text

from ml_models.churn import predict_churn
from ml_models.churn.feature_extractor import extract_features_for_all_users


def _risk_level_pg(score: float) -> str:
    """Map probability → DB enum value (risk_level)."""
    if score < 0.3:
        return "LOW"
    if score < 0.6:
        return "MEDIUM"
    if score < 0.8:
        return "HIGH"
    return "CRITICAL"


def run_daily_churn_scoring(db: Session) -> Dict[str, Any]:
    """Extract features for every active user, run the churn model, upsert churn_scores."""
    all_features = extract_features_for_all_users(db)

    scored = 0
    errors = 0

    for user_id_str, features in all_features.items():
        if features is None:
            errors += 1
            continue
        try:
            result = predict_churn(features)
            score = result["churn_probability"]
            niveau = _risk_level_pg(score)

            db.execute(
                text("""
                    INSERT INTO churn_scores
                        (user_id, score, niveau_risque, model_version, features_snapshot, is_latest)
                    VALUES
                        (:uid, :score, :niveau, 'xgboost-v1', :snap::jsonb, true)
                """),
                {
                    "uid": user_id_str,
                    "score": score,
                    "niveau": niveau,
                    "snap": str(features).replace("'", '"'),
                },
            )
            scored += 1
        except Exception:
            errors += 1

    db.commit()
    return {"status": "ok", "scored": scored, "errors": errors}


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
