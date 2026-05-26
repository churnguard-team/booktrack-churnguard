import json
import sys
from urllib.request import Request, urlopen
from urllib.error import HTTPError

API_BASE = "http://localhost:8000"
TARGET_EMAIL = "marouaidomar1@gmail.com"

def http_get(path):
    req = Request(API_BASE + path, headers={"Accept": "application/json"})
    try:
        with urlopen(req) as r:
            return json.load(r)
    except HTTPError as e:
        # print server error body for debugging
        try:
            body = e.read().decode('utf-8')
            print('HTTP_ERROR_BODY:', body)
        except Exception:
            pass
        raise

def http_post(path, data):
    payload = json.dumps(data).encode('utf-8')
    req = Request(API_BASE + path, data=payload, headers={"Content-Type":"application/json"}, method='POST')
    try:
        with urlopen(req) as r:
            return json.load(r)
    except HTTPError as e:
        try:
            return json.load(e)
        except Exception:
            return {"error": str(e)}

if __name__ == '__main__':
    users = http_get('/users')
    match = None
    for u in users:
        if u.get('email') == TARGET_EMAIL:
            match = u
            break
    if not match:
        print('USER_NOT_FOUND')
        sys.exit(1)
    user_id = match['id']
    print('FOUND user_id =', user_id)
    body = {"user_id": user_id, "discount_percent": 25}
    resp = http_post('/api/retention/send-email', body)
    print(json.dumps(resp, indent=2))
