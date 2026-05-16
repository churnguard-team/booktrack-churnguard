import sys
sys.path.insert(0, '.')

from database import SessionLocal
from models import User
from services.churn_service import predict_and_save, batch_predict_and_save

db = SessionLocal()
try:
    user = db.query(User).filter(User.is_active == True).first()
    if not user:
        print("No active users found in DB")
    else:
        print(f"Testing with user: {user.email}")
        result = predict_and_save(str(user.id), db)
        print(f"  score (probability): {result.score:.2%}")
        print(f"  niveau_risque       : {result.niveau_risque}")
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
