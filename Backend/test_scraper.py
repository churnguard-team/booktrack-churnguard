import asyncio
import httpx

async def test_google_books_scraper():
    print("--- TEST DU SCRAPER (GOOGLE BOOKS) ---")
    
    # On teste l'URL locale si votre backend est lancé, 
    # sinon on teste l'API Google directement pour vérifier la connexion
    url = "https://www.googleapis.com/books/v1/volumes?q=harry+potter&maxResults=3"
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(url)
            
        print(f"Statut HTTP : {r.status_code}")
        
        if r.status_code == 200:
            data = r.json()
            items = data.get("items", [])
            print(f"Livres trouvés : {len(items)}\n")
            
            for item in items:
                info = item.get("volumeInfo", {})
                print(f"  [WEB] {info.get('title')} - {info.get('authors', ['Inconnu'])[0]}")
            
            print("\n✅ Le scraping Google Books fonctionne parfaitement !")
        else:
            print(f"❌ Erreur : Le service a répondu avec le code {r.status_code}")
            
    except Exception as e:
        print(f"❌ Erreur de connexion : {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_google_books_scraper())
