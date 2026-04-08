from fastapi import FastAPI

app = FastAPI(title="BookTrack AI", version="1.0.0")

@app.get("/")
def root():
    return {"message": "BookTrack API is running 🚀"}