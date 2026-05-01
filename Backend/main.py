from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import books, users, dashboard, auth, moderator
from routers import churn


app = FastAPI(title="BookTrack AI", version="1.0.0")

# CORS → permet au frontend Next.js d'appeler l'API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(churn.router)

app.include_router(auth.router)
app.include_router(books.router)
app.include_router(users.router)
app.include_router(dashboard.router)
app.include_router(moderator.router)

@app.get("/")
def root():
    return {"message": "BookTrack API is running 🚀"}