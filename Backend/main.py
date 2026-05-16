from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from routers.admin import books as admin_books
from routers.admin import users as admin_users
from routers import auth
from routers.user import library
from routers.user import profile
from routers.user import comments
from routers import auth_google
from routers import recommendations
from routers import moderator
from routers import dashboard
from routers import n8n
from database import SessionLocal
from services.churn_service import batch_predict_and_save


def run_daily_churn():
    db = SessionLocal()
    try:
        result = batch_predict_and_save(db)
        print(f"[Scheduler] Churn batch done: {result['predictions_saved']}/{result['total_users']} users scored")
    except Exception as e:
        print(f"[Scheduler] Churn batch failed: {e}")
    finally:
        db.close()


app = FastAPI(title="BookTrack AI", version="1.0.0")

scheduler = BackgroundScheduler()
scheduler.add_job(run_daily_churn, "cron", hour=2, minute=0)  # runs every day at 02:00
scheduler.start()


@app.on_event("shutdown")
def shutdown_scheduler():
    scheduler.shutdown()

# CORS → permet au frontend Next.js d'appeler l'API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(admin_books.router)
app.include_router(admin_users.router)
app.include_router(auth.router)
app.include_router(library.router)
app.include_router(profile.router)   # PATCH /users/{id}/profile → sauvegarde genres
app.include_router(comments.router)  # GET/POST /books/{id}/comments → commentaires
app.include_router(auth_google.router)  # POST /auth/google → connexion OAuth Google
app.include_router(recommendations.router)
app.include_router(moderator.router)
app.include_router(dashboard.router)
app.include_router(n8n.router)


@app.get("/")
def root():
    return {"message": "BookTrack API is running 🚀"}