from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.admin import books as admin_books
from routers.admin import users as admin_users
from routers import auth
from routers.user import library
from routers.user import profile  # Profil utilisateur (onboarding)
from routers.user import comments  # Commentaires sur les livres
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from routers import auth_google    # Authentification Google OAuth
from routers import scraper        # Web scraping — recherche de livres via Open Library / Google Books
from routers import recommendations
from routers import churn
from routers import moderator
from routers import dashboard
from routers import payment
from database import SessionLocal
from services.churn_service import run_daily_churn_scoring


app = FastAPI(title="BookTrack AI", version="1.0.0")

scheduler = BackgroundScheduler()

def _daily_churn_job() -> None:
    db = SessionLocal()
    try:
        result = run_daily_churn_scoring(db)
        print(f"[churn] daily detection executed: {result}")
    except Exception as exc:
        print(f"[churn] daily detection failed: {exc}")
    finally:
        db.close()


@app.on_event("startup")
def startup_event() -> None:
    if not scheduler.running:
        scheduler.add_job(
            _daily_churn_job,
            CronTrigger(hour=2, minute=0),
            id="daily_churn_detection",
            replace_existing=True,
        )
        scheduler.start()


@app.on_event("shutdown")
def shutdown_event() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)

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
app.include_router(scraper.router)       # GET /scraper/search?q=... → web scraping
app.include_router(recommendations.router)
app.include_router(churn.router)
app.include_router(moderator.router)
app.include_router(dashboard.router)
app.include_router(payment.router)


@app.get("/")
def root():
    return {"message": "BookTrack API is running 🚀"}