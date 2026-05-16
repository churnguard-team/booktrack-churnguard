"""
Feature Mapper: Converts BookTrack user data to IBM Telco features
that XGBoost model expects for churn prediction.

This is a TRANSLATION LAYER that maps:
- BookTrack user behavior → Telecom-like features
- So XGBoost can make predictions
"""

from typing import Dict, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func


class BookTrackToTelecomMapper:
    """
    Converts BookTrack user data to IBM Telco features.
    
    Mapping logic:
    - tenure (months) = days_since_signup / 30
    - MonthlyCharges = books_per_month * 10 ($/book)
    - TotalCharges = total_books_read * 10
    - PhoneService = "Yes" if active, "No" if inactive
    - OnlineSecurity = "Yes" if has written comments
    - TechSupport = "Yes" if member > 90 days
    - etc.
    """
    
    def __init__(self):
        # These features MUST match what XGBoost was trained on
        self.required_features = [
            "gender", "Partner", "Dependents", "PhoneService", "MultipleLines",
            "InternetService", "OnlineSecurity", "OnlineBackup", "DeviceProtection",
            "TechSupport", "StreamingTV", "StreamingMovies", "Contract",
            "PaperlessBilling", "PaymentMethod", "tenure", "MonthlyCharges", "TotalCharges"
        ]
    
    def extract_user_features(self, user_id: str, db: Session) -> Dict[str, Any]:
        """
        Extract BookTrack user data and convert to Telco features.
        
        Args:
            user_id: UUID of the user
            db: Database session
            
        Returns:
            Dictionary with feature_name -> value pairs
            
        Raises:
            ValueError: If user not found
        """
        from models import User, UserBook
        
        # Get user
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"User {user_id} not found")
        
        # Calculate user statistics
        books_data = db.query(UserBook).filter(
            UserBook.user_id == user_id
        ).all()
        
        total_books = len(books_data)
        now = datetime.now(timezone.utc)
        days_member = (now - user.created_at).days + 1  # Avoid division by zero
        
        # Activity metrics
        commented_books = db.query(func.count(UserBook.id)).filter(
            UserBook.user_id == user_id,
            UserBook.review != None
        ).scalar() or 0
        
        rated_books = db.query(func.count(UserBook.id)).filter(
            UserBook.user_id == user_id,
            UserBook.rating != None
        ).scalar() or 0
        
        favorite_books = db.query(func.count(UserBook.id)).filter(
            UserBook.user_id == user_id,
            UserBook.is_favourite == True
        ).scalar() or 0
        
        # Last activity
        last_activity = user.last_login_at or user.created_at
        days_since_last_activity = (now - last_activity).days
        
        # Calculate monthly rate (books per month)
        months_member = max(days_member / 30, 1)  # At least 1 month
        books_per_month = total_books / months_member
        
        # Determine activity level (is user still active?)
        # Active = logged in within last 30 days
        is_active = days_since_last_activity <= 30
        
        # === BUILD FEATURE DICTIONARY ===
        # Following IBM Telco encoding: categorical features as Yes/No strings
        
        phone_service = is_active
        multiple_lines = books_per_month > 1
        internet_service = "Fiber optic"  # all BookTrack users are digital
        online_security = commented_books > 0
        online_backup = rated_books > 0
        device_protection = favorite_books > 0
        tech_support = days_member > 90
        streaming_tv = books_per_month > 2
        streaming_movies = favorite_books > 5
        contract = "Month-to-month"
        payment_method = "Bank transfer (automatic)"

        features = {
            # Continuous
            "SeniorCitizen": 0,
            "tenure": int(days_member / 30),
            "MonthlyCharges": round(books_per_month * 10, 2),
            "TotalCharges": round(total_books * 10, 2),
            # One-hot encoded
            "gender_Male": 1,
            "Partner_Yes": 0,
            "Dependents_Yes": 0,
            "PhoneService_Yes": int(phone_service),
            "MultipleLines_No phone service": int(not phone_service),
            "MultipleLines_Yes": int(phone_service and multiple_lines),
            "InternetService_Fiber optic": 1,
            "InternetService_No": 0,
            "OnlineSecurity_No internet service": 0,
            "OnlineSecurity_Yes": int(online_security),
            "OnlineBackup_No internet service": 0,
            "OnlineBackup_Yes": int(online_backup),
            "DeviceProtection_No internet service": 0,
            "DeviceProtection_Yes": int(device_protection),
            "TechSupport_No internet service": 0,
            "TechSupport_Yes": int(tech_support),
            "StreamingTV_No internet service": 0,
            "StreamingTV_Yes": int(streaming_tv),
            "StreamingMovies_No internet service": 0,
            "StreamingMovies_Yes": int(streaming_movies),
            "Contract_One year": 0,
            "Contract_Two year": 0,
            "PaperlessBilling_Yes": 1,
            "PaymentMethod_Credit card (automatic)": 0,
            "PaymentMethod_Electronic check": 0,
            "PaymentMethod_Mailed check": 0,
        }

        return features
    
    def extract_features_from_dict(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Alternative: Extract features from a pre-computed dictionary.
        Useful when user data is already calculated elsewhere.
        """
        total_books = user_data.get("total_books_read", 0)
        days_member = max(user_data.get("days_member", 0), 1)
        commented_books = user_data.get("comments_written", 0)
        rated_books = user_data.get("ratings_given", 0)
        favorite_books = user_data.get("favorite_books", 0)
        days_since_activity = user_data.get("days_since_last_activity", 0)
        
        months_member = max(days_member / 30, 1)
        books_per_month = total_books / months_member
        is_active = days_since_activity <= 30
        
        return {
            "gender": "Male",
            "Partner": "No",
            "Dependents": "No",
            "PhoneService": "Yes" if is_active else "No",
            "MultipleLines": "Yes" if books_per_month > 1 else "No",
            "InternetService": "Fiber optic",
            "OnlineSecurity": "Yes" if commented_books > 0 else "No",
            "OnlineBackup": "Yes" if rated_books > 0 else "No",
            "DeviceProtection": "Yes" if favorite_books > 0 else "No",
            "TechSupport": "Yes" if days_member > 90 else "No",
            "StreamingTV": "Yes" if books_per_month > 2 else "No",
            "StreamingMovies": "Yes" if favorite_books > 5 else "No",
            "Contract": "Month-to-month",
            "PaperlessBilling": "Yes",
            "PaymentMethod": "Bank transfer",
            "tenure": int(days_member / 30),
            "MonthlyCharges": round(books_per_month * 10, 2),
            "TotalCharges": round(total_books * 10, 2),
        }


def get_all_users_features(db: Session, limit: int = None) -> Dict[str, Dict[str, Any]]:
    """
    Get mapped features for all active users.
    Useful for batch prediction and dashboard stats.
    """
    from models import User
    
    mapper = BookTrackToTelecomMapper()
    
    query = db.query(User).filter(User.is_active == True)
    if limit:
        query = query.limit(limit)
    
    users = query.all()
    
    features_dict = {}
    for user in users:
        try:
            features = mapper.extract_user_features(str(user.id), db)
            features_dict[str(user.id)] = features
        except Exception as e:
            print(f"Error extracting features for user {user.id}: {e}")
            continue
    
    return features_dict
