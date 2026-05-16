"""
Churn Service: Handles churn prediction and storage in PostgreSQL

Pipeline:
1. Extract user features from database
2. Call XGBoost model for prediction
3. Save result to churn_scores table
4. Query aggregated stats for dashboard
"""

from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc
from models import ChurnScore, User
from ml_models.churn import predict_churn
from ml_models.feature_mapper import BookTrackToTelecomMapper


def save_prediction(user_id: str, prediction: dict, db: Session) -> ChurnScore:
    """
    Save a churn prediction to the database.
    
    Before saving, marks all previous predictions for this user as not latest.
    
    Args:
        user_id: UUID of the user
        prediction: Dict with keys:
            - churn_probability: float between 0-1
            - churn_prediction: int (0 or 1)
            - risk_level: string ("FAIBLE", "MOYEN", "ÉLEVÉ", "CRITIQUE")
        db: Database session
    
    Returns:
        ChurnScore: The newly created database record
    """
    # Mark previous predictions as not latest
    db.query(ChurnScore).filter(
        ChurnScore.user_id == user_id,
        ChurnScore.is_latest == True
    ).update({"is_latest": False})
    
    # Save new prediction
    score = ChurnScore(
        user_id=user_id,
        churn_probability=prediction["churn_probability"],
        churn_prediction=prediction["churn_prediction"],
        risk_level=prediction["risk_level"],
        predicted_at=datetime.now(),
        is_latest=True
    )
    
    db.add(score)
    db.commit()
    db.refresh(score)
    
    return score


def predict_and_save(user_id: str, db: Session) -> ChurnScore:
    """
    Complete pipeline: extract features → predict → save to database
    
    Flow:
    1. Extract user data from database (books, activity, engagement)
    2. Map to XGBoost features
    3. Get prediction from model
    4. Save to churn_scores table
    
    Args:
        user_id: UUID of the user
        db: Database session
    
    Returns:
        ChurnScore: The saved prediction record
    
    Raises:
        ValueError: If user not found
        Exception: If prediction fails
    """
    # Extract features from database
    mapper = BookTrackToTelecomMapper()
    features = mapper.extract_user_features(user_id, db)
    
    # Get prediction from XGBoost
    prediction = predict_churn(features)
    
    # Save to database
    score = save_prediction(user_id, prediction, db)
    
    return score


def get_latest_prediction(user_id: str, db: Session) -> ChurnScore | None:
    """Get the most recent prediction for a user."""
    return db.query(ChurnScore).filter(
        ChurnScore.user_id == user_id,
        ChurnScore.is_latest == True
    ).first()


def get_churn_stats(db: Session) -> dict:
    """
    Get aggregated churn statistics from database.
    Used for moderator dashboard.
    
    Returns dictionary with:
    - total_users_scored: int
    - churn_distribution: dict with risk level counts
    - high_risk_count: int (ÉLEVÉ + CRITIQUE)
    - high_risk_percentage: float
    - average_churn_probability: float
    """
    # Get latest predictions for all users
    latest_scores = db.query(ChurnScore).filter(
        ChurnScore.is_latest == True
    ).all()
    
    if not latest_scores:
        return {
            "total_users_scored": 0,
            "churn_distribution": {"FAIBLE": 0, "MOYEN": 0, "ÉLEVÉ": 0, "CRITIQUE": 0},
            "high_risk_count": 0,
            "high_risk_percentage": 0.0,
            "average_churn_probability": 0.0,
        }
    
    # Count by risk level
    counts = {}
    total_prob = 0
    
    for score in latest_scores:
        risk = score.risk_level or "FAIBLE"
        counts[risk] = counts.get(risk, 0) + 1
        total_prob += score.churn_probability
    
    total = len(latest_scores)
    high_risk = counts.get("ÉLEVÉ", 0) + counts.get("CRITIQUE", 0)
    
    return {
        "total_users_scored": total,
        "churn_distribution": {
            "FAIBLE": counts.get("FAIBLE", 0),
            "MOYEN": counts.get("MOYEN", 0),
            "ÉLEVÉ": counts.get("ÉLEVÉ", 0),
            "CRITIQUE": counts.get("CRITIQUE", 0),
        },
        "high_risk_count": high_risk,
        "high_risk_percentage": round((high_risk / total * 100), 2) if total > 0 else 0.0,
        "average_churn_probability": round(total_prob / total, 3) if total > 0 else 0.0,
    }


def get_high_risk_users(db: Session, limit: int = 10) -> list[ChurnScore]:
    """
    Get users most likely to churn.
    
    Returns users with risk level ÉLEVÉ or CRITIQUE,
    sorted by churn probability (highest first).
    
    Args:
        db: Database session
        limit: Max number of results
    
    Returns:
        List of ChurnScore records
    """
    return db.query(ChurnScore).filter(
        ChurnScore.is_latest == True,
        ChurnScore.risk_level.in_(["ÉLEVÉ", "CRITIQUE"])
    ).order_by(desc(ChurnScore.churn_probability)).limit(limit).all()


def get_user_prediction_history(user_id: str, db: Session, limit: int = 10) -> list[ChurnScore]:
    """
    Get prediction history for a user.
    
    Returns all predictions for this user, most recent first.
    
    Args:
        user_id: UUID of the user
        db: Database session
        limit: Max number of results
    
    Returns:
        List of ChurnScore records sorted by date descending
    """
    return db.query(ChurnScore).filter(
        ChurnScore.user_id == user_id
    ).order_by(desc(ChurnScore.predicted_at)).limit(limit).all()


def batch_predict_and_save(db: Session, limit: int = None) -> dict:
    """
    Predict churn for all active users and save to database.
    
    Useful for daily/weekly batch jobs.
    
    Args:
        db: Database session
        limit: Max users to predict (for performance/testing)
    
    Returns:
        Dictionary with:
        - total_users: int
        - predictions_saved: int
        - statistics: aggregated stats
        - errors: list of user IDs that failed
    """
    mapper = BookTrackToTelecomMapper()
    
    query = db.query(User).filter(User.is_active == True)
    if limit:
        query = query.limit(limit)
    
    users = query.all()
    errors = []
    success_count = 0
    
    for user in users:
        try:
            predict_and_save(str(user.id), db)
            success_count += 1
        except Exception as e:
            errors.append({
                "user_id": str(user.id),
                "email": user.email,
                "error": str(e)
            })
            continue
    
    # Get updated stats
    stats = get_churn_stats(db)
    
    return {
        "total_users": len(users),
        "predictions_saved": success_count,
        "errors_count": len(errors),
        "statistics": stats,
        "errors": errors if errors else None
    }


def get_churn_trend(db: Session, days: int = 7) -> list[dict]:
    """
    Get churn trend over the past N days.
    Useful for charts showing churn increasing/decreasing.
    
    Args:
        db: Database session
        days: Number of days to look back
    
    Returns:
        List of dicts with date and stats
    """
    from sqlalchemy import func, and_
    from datetime import timedelta
    
    start_date = datetime.now() - timedelta(days=days)
    
    # Group by date and count by risk level
    results = db.query(
        func.DATE(ChurnScore.predicted_at).label("date"),
        ChurnScore.risk_level,
        func.count(ChurnScore.id).label("count")
    ).filter(
        ChurnScore.predicted_at >= start_date,
        ChurnScore.is_latest == True
    ).group_by(
        func.DATE(ChurnScore.predicted_at),
        ChurnScore.risk_level
    ).order_by(
        func.DATE(ChurnScore.predicted_at)
    ).all()
    
    # Format results
    trend = {}
    for date, risk_level, count in results:
        date_str = str(date)
        if date_str not in trend:
            trend[date_str] = {"FAIBLE": 0, "MOYEN": 0, "ÉLEVÉ": 0, "CRITIQUE": 0}
        trend[date_str][risk_level or "FAIBLE"] = count
    
    return [
        {"date": date, **stats}
        for date, stats in sorted(trend.items())
    ]
