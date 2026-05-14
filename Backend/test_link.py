import httpx
import asyncio

async def test():
    async with httpx.AsyncClient() as client:
        r = await client.get('http://localhost:8000/scraper/search?q=Apprentie+comtesse')
        print(r.json())

asyncio.run(test())
