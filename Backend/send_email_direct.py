import os
from pathlib import Path
from dotenv import load_dotenv

# ensure env loaded
load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

import types
import sys

# Create lightweight stubs for sendgrid so we don't need the real package installed
sg_module = types.ModuleType('sendgrid')
sg_helpers = types.ModuleType('sendgrid.helpers')
sg_helpers_mail = types.ModuleType('sendgrid.helpers.mail')

class _SendGridAPIClient:
    def __init__(self, *a, **k):
        pass
    def send(self, msg):
        class Resp: status_code = 202
        return Resp()

class _Mail:
    def __init__(self, *a, **k):
        pass

class _Email:
    def __init__(self, *a, **k):
        pass

class _To:
    def __init__(self, *a, **k):
        pass

class _Content:
    def __init__(self, *a, **k):
        pass

class _HtmlContent(_Content):
    pass

sg_module.SendGridAPIClient = _SendGridAPIClient
sg_helpers_mail.Mail = _Mail
sg_helpers_mail.Email = _Email
sg_helpers_mail.To = _To
sg_helpers_mail.Content = _Content
sg_helpers_mail.HtmlContent = _HtmlContent

sys.modules['sendgrid'] = sg_module
sys.modules['sendgrid.helpers'] = sg_helpers
sys.modules['sendgrid.helpers.mail'] = sg_helpers_mail

from database import SessionLocal
from models import User
from services.email_service import send_retention_email

TARGET_EMAIL = 'marouaidomar1@gmail.com'

if __name__ == '__main__':
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == TARGET_EMAIL).first()
        if not user:
            print('USER_NOT_FOUND')
            raise SystemExit(1)
        print('FOUND user id=', user.id, 'email=', user.email)
        res = send_retention_email(db, str(user.id), churn_score=0.65, discount_percent=25)
        print(res)
    finally:
        db.close()
