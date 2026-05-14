"""
=============================================================
routers/scraper.py — Web Scraping via Google Books API
=============================================================

Ce module remplace l'ancien scraper d'Open Library par Google Books.
Google Books est beaucoup plus stable (évite les erreurs 503) 
et offre des résultats de recherche plus riches et rapides.

Endpoint : GET /scraper/search?q=...
=============================================================
"""

import httpx
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter(prefix="/scraper", tags=["Web Scraping"])

class ScrapedBook(BaseModel):
    """Modèle de données pour un livre trouvé sur le web"""
    title: str
    auteur: Optional[str] = None
    cover_url: Optional[str] = None
    source: str = "Google Books"
    link: Optional[str] = None # Lien vers la page externe du livre

@router.get("/search", response_model=List[ScrapedBook])
async def scrape_books(
    q: str = Query(..., min_length=2, description="Terme de recherche"),
    limit: int = Query(default=6, ge=1, le=20)
):
    """
    Recherche des livres avec un système de secours (Fallback).
    1. Essaie Open Library en premier (gratuit, pas de quota IP strict).
    2. Si Open Library échoue (ex: 503), essaie Google Books en secours.
    3. Si les deux échouent (ex: quota 429 Google), retourne une liste vide pour ne pas faire planter le frontend.
    """
    results: List[ScrapedBook] = []

    # === TENTATIVE 1 : OPEN LIBRARY ===
    try:
        ol_url = "https://openlibrary.org/search.json"
        ol_params = {"q": q, "limit": limit, "fields": "key,title,author_name,cover_i"}
        headers = {"User-Agent": "BookTrack-App/1.0 (educational project)"}

        async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
            ol_res = await client.get(ol_url, params=ol_params, headers=headers)

        if ol_res.status_code == 200:
            data = ol_res.json()
            for item in data.get("docs", []):
                title = item.get("title", "Sans titre")
                authors = item.get("author_name")
                auteur_str = ", ".join(authors) if authors else "Auteur inconnu"
                
                cover_id = item.get("cover_i")
                cover = f"https://covers.openlibrary.org/b/id/{cover_id}-M.jpg" if cover_id else None

                key = item.get("key")
                link = f"https://openlibrary.org{key}" if key else None

                results.append(ScrapedBook(title=title, auteur=auteur_str, cover_url=cover, source="Open Library", link=link))
            
            if results:
                return results # Si Open Library a marché et trouvé des résultats, on s'arrête ici.

    except Exception as e:
        print(f"[Scraper] Open Library a échoué: {e}")
        # On continue vers la tentative 2

    # === TENTATIVE 2 : GOOGLE BOOKS (Secours) ===
    try:
        google_url = "https://www.googleapis.com/books/v1/volumes"
        google_params = {"q": q, "maxResults": limit, "langRestrict": "fr"}

        async with httpx.AsyncClient(timeout=8.0) as client:
            gb_res = await client.get(google_url, params=google_params)

        if gb_res.status_code == 200:
            data = gb_res.json()
            for item in data.get("items", []):
                volume_info = item.get("volumeInfo", {})
                authors = volume_info.get("authors", [])
                auteur_str = ", ".join(authors) if authors else "Auteur inconnu"

                image_links = volume_info.get("imageLinks", {})
                cover = image_links.get("thumbnail") or image_links.get("smallThumbnail")
                if cover and cover.startswith("http:"):
                    cover = cover.replace("http:", "https:")

                link = volume_info.get("infoLink")

                results.append(ScrapedBook(title=volume_info.get("title", "Sans titre"), auteur=auteur_str, cover_url=cover, source="Google Books", link=link))
            
            return results
        else:
            print(f"[Scraper] Google Books a échoué avec le code {gb_res.status_code}: {gb_res.text[:100]}")

    except Exception as e:
        print(f"[Scraper] Google Books a rencontré une erreur: {e}")

    # === SI TOUT ÉCHOUE ===
    # Au lieu de renvoyer une erreur 502 qui affiche du texte brut dans le navigateur,
    # on renvoie une liste vide. Le frontend verra "0 résultats web" et continuera de fonctionner.
    return []
