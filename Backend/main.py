from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.admin import books as admin_books
from routers.admin import users as admin_users
from routers import auth
from routers.user import library
from routers.user import profile  # Profil utilisateur (onboarding)
from routers.user import comments  # Commentaires sur les livres
from routers import auth_google    # Authentification Google OAuth


app = FastAPI(title="BookTrack AI", version="1.0.0")

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


@app.get("/")
def root():
    return {"message": "BookTrack API is running 🚀"}