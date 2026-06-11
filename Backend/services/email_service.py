"""
Service d'envoi d'emails de rétention via SMTP.
"""

import os
import json
import uuid
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import text

SMTP_HOST     = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT     = int(os.getenv("SMTP_PORT", 587))
SMTP_USER     = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_EMAIL    = os.getenv("EMAIL_FROM", SMTP_USER)
FROM_NAME     = os.getenv("EMAIL_FROM_NAME", "BookTrack Team")
BRAND_COLOR   = "#2563eb"
FRONTEND_URL  = os.getenv("FRONTEND_URL", "http://localhost:3000")


def _send_smtp(to_email: str, subject: str, html: str, plain: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = f"{FROM_NAME} <{FROM_EMAIL}>"
    msg["To"]      = to_email
    msg.attach(MIMEText(plain, "plain", "utf-8"))
    msg.attach(MIMEText(html,  "html",  "utf-8"))
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.ehlo()
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(FROM_EMAIL, to_email, msg.as_string())


def _build_email(user_name: str, prenom: str, discount_percent: int) -> tuple:
    code = f"STAY{discount_percent}"
    html = f"""<!DOCTYPE html><html><body style="font-family:sans-serif;color:#374151;">
    <div style="max-width:600px;margin:auto;background:#fff;border-radius:8px;overflow:hidden;">
        <div style="background:{BRAND_COLOR};padding:32px;text-align:center;">
            <h1 style="color:#fff;margin:0;">Nous vous manquez ! 💙</h1>
        </div>
        <div style="padding:32px;">
            <p>Bonjour <strong>{user_name}</strong>,</p>
            <p>Votre engagement avec BookTrack a diminué. On aimerait vous voir revenir !</p>
            <div style="background:#eff6ff;border:2px solid {BRAND_COLOR};border-radius:8px;padding:20px;text-align:center;margin:24px 0;">
                <h2 style="color:{BRAND_COLOR};font-size:32px;margin:0;">{discount_percent}% de réduction</h2>
                <p>Code : <strong style="font-family:monospace;background:#fff;padding:4px 8px;border-radius:4px;">{code}</strong></p>
                <p style="color:#ef4444;font-weight:600;">⏰ Valable 7 jours</p>
            </div>
            <div style="text-align:center;margin:32px 0;">
                <a href="{FRONTEND_URL}/books" style="background:{BRAND_COLOR};color:#fff;padding:12px 32px;text-decoration:none;border-radius:6px;font-weight:600;">
                    Découvrir nos recommandations
                </a>
            </div>
        </div>
        <div style="background:#f9fafb;padding:16px;text-align:center;font-size:12px;color:#9ca3af;">© 2025 BookTrack</div>
    </div>
    </body></html>"""
    plain = f"Bonjour {user_name},\n\nOffre exclusive : {discount_percent}% de réduction\nCode : {code} (valable 7 jours)\n\nVisitez : {FRONTEND_URL}/books\n\nL'équipe BookTrack"
    return html, plain


def send_retention_email(db: Session, user_id: str, churn_score: float, discount_percent: int = 20) -> Dict[str, Any]:
    if not SMTP_USER or not SMTP_PASSWORD:
        return {"status": "error", "detail": "SMTP not configured (SMTP_USER/SMTP_PASSWORD missing)"}

    try:
        row = db.execute(text(
            "SELECT id::text, email, nom, prenom FROM users WHERE id = :uid"
        ), {"uid": user_id}).fetchone()
    except Exception as e:
        return {"status": "error", "detail": str(e)}

    if not row:
        return {"status": "error", "detail": "User not found"}

    _, user_email, nom, prenom = row
    full_name = f"{prenom} {nom}" if prenom and nom else user_email.split("@")[0]
    html, plain = _build_email(full_name, prenom, discount_percent)
    action_id = str(uuid.uuid4())

    try:
        _send_smtp(
            to_email=user_email,
            subject=f"🎁 Offre spéciale pour vous, {prenom or 'lecteur'} !",
            html=html,
            plain=plain,
        )
        statut = "SENT"
        error_detail = None
    except Exception as e:
        statut = "FAILED"
        error_detail = str(e)

    db.execute(text("""
        INSERT INTO retention_actions (id, user_id, type_action, statut, contenu, sujet, date_envoi, metadata, created_at)
        VALUES (:id, :uid, 'EMAIL', :statut, :contenu, :sujet, NOW(), :meta, NOW())
    """), {
        "id": action_id, "uid": user_id, "statut": statut,
        "contenu": html,
        "sujet": f"Offre spéciale pour vous, {prenom or 'lecteur'} !",
        "meta": json.dumps({"discount_percent": discount_percent, "churn_score": float(churn_score), "error": error_detail}),
    })
    db.commit()

    if statut == "SENT":
        return {"status": "sent", "user_id": user_id, "email": user_email, "action_id": action_id, "discount_code": f"STAY{discount_percent}"}
    return {"status": "error", "user_id": user_id, "email": user_email, "detail": error_detail}


def mark_email_opened(db: Session, action_id: str) -> Dict[str, Any]:
    try:
        db.execute(text("UPDATE retention_actions SET date_ouverture = NOW() WHERE id = :aid"), {"aid": action_id})
        db.commit()
        return {"status": "marked"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}


def mark_email_clicked(db: Session, action_id: str) -> Dict[str, Any]:
    try:
        db.execute(text("UPDATE retention_actions SET date_clic = NOW() WHERE id = :aid"), {"aid": action_id})
        db.commit()
        return {"status": "marked"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}
