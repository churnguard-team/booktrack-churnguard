"""
Service d'envoi d'emails de rétention.
Gère l'intégration avec SendGrid pour les campagnes de rétention ciblées.
"""

import os
import json
from typing import Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import text
import uuid

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content, HtmlContent

# Configuration
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
FROM_EMAIL = os.getenv("EMAIL_FROM", "noreply@booktrack.io")
LOGO_URL = os.getenv("LOGO_URL", "https://booktrack.io/logo.png")
BRAND_COLOR = "#2563eb"


def _get_retention_email_content(
    user_name: str,
    churn_score: float,
    niveau_risque: str,
    discount_percent: int,
    recommended_books: list = None,
    preferred_genres: list = None,
) -> tuple[str, str]:
    """
    Génère le contenu HTML et text pour un email de rétention personnalisé.
    
    Args:
        user_name: Nom du utilisateur
        churn_score: Score de churn (0-1)
        niveau_risque: Niveau de risque (LOW/MEDIUM/HIGH/CRITICAL)
        discount_percent: Pourcentage de réduction offert
        recommended_books: Liste de livres recommandés
        preferred_genres: Liste de genres préférés
        
    Returns:
        Tuple (html_content, text_content)
    """
    discount_code = f"STAY{discount_percent}"
    
    # Texte simple
    text_content = f"""
    Bonjour {user_name},
    
    Nous avons remarqué que votre engagement avec BookTrack a diminué récemment.
    Nous valorisons votre présence et aimerions vous aider à redécouvrir nos meilleures lectures !
    
    OFFRE EXCLUSIVE : {discount_percent}% de réduction sur votre abonnement
    Code : {discount_code}
    Valable pendant 7 jours
    
    Redécouvrez vos genres préférés et des recommandations spécialement sélectionnées pour vous.
    
    Cordialement,
    L'équipe BookTrack
    """
    
    # HTML content avec design professionnel
    recommended_books_html = ""
    if recommended_books:
        recommended_books_html = """
        <h3 style="color: #1f2937; margin-bottom: 16px; font-size: 18px;">
            📚 Recommandations personnalisées pour vous
        </h3>
        <div style="margin-bottom: 24px;">
        """
        for book in recommended_books[:3]:  # Top 3 books
            recommended_books_html += f"""
            <div style="
                border-left: 4px solid {BRAND_COLOR};
                padding-left: 12px;
                margin-bottom: 12px;
            ">
                <p style="margin: 0; font-weight: 600; color: #1f2937;">
                    {book.get('title', 'N/A')}
                </p>
                <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">
                    par {book.get('author', 'N/A')} • Genre: {book.get('genre', 'N/A')}
                </p>
            </div>
            """
        recommended_books_html += """
        </div>
        """
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #374151;">
        
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb;">
            <tr>
                <td style="padding: 40px 20px;">
                    <table width="100%" max-width="600" align="center" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                        
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, {BRAND_COLOR} 0%, #1e40af 100%); padding: 32px 24px; text-align: center; border-radius: 8px 8px 0 0;">
                                <h1 style="margin: 0; color: white; font-size: 24px;">
                                    Nous vous manquez ! 💙
                                </h1>
                            </td>
                        </tr>
                        
                        <!-- Main Content -->
                        <tr>
                            <td style="padding: 32px 24px;">
                                <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px;">
                                    Bonjour <strong>{user_name}</strong>,
                                </p>
                                
                                <p style="margin: 0 0 16px 0; color: #374151;">
                                    Nous avons remarqué que votre engagement avec BookTrack a diminué récemment. 
                                    Votre profil de lecteur est spécial pour nous, et nous aimerions vous aider 
                                    à redécouvrir les livres qui vous passionnent !
                                </p>
                                
                                <!-- Offer Banner -->
                                <div style="
                                    background-color: #eff6ff;
                                    border: 2px solid {BRAND_COLOR};
                                    border-radius: 8px;
                                    padding: 20px;
                                    margin: 24px 0;
                                    text-align: center;
                                ">
                                    <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
                                        Offre exclusive pour vous
                                    </p>
                                    <h2 style="margin: 0 0 8px 0; color: {BRAND_COLOR}; font-size: 32px;">
                                        {discount_percent}% de réduction
                                    </h2>
                                    <p style="margin: 0 0 12px 0; color: #374151;">
                                        sur votre abonnement BookTrack
                                    </p>
                                    <p style="margin: 0; font-size: 12px; color: #6b7280;">
                                        Code : <strong style="font-family: monospace; font-size: 14px; background-color: white; padding: 4px 8px; border-radius: 4px;">{discount_code}</strong>
                                    </p>
                                    <p style="margin: 12px 0 0 0; color: #ef4444; font-size: 13px; font-weight: 600;">
                                        ⏰ Valable pendant 7 jours seulement
                                    </p>
                                </div>
                                
                                <!-- Recommended Books -->
                                {recommended_books_html}
                                
                                <!-- CTA Button -->
                                <div style="text-align: center; margin: 32px 0;">
                                    <a href="{os.getenv('FRONTEND_URL', 'https://booktrack.io')}/books" style="
                                        display: inline-block;
                                        background-color: {BRAND_COLOR};
                                        color: white;
                                        padding: 12px 32px;
                                        text-decoration: none;
                                        border-radius: 6px;
                                        font-weight: 600;
                                        font-size: 16px;
                                        transition: background-color 0.3s;
                                    ">
                                        Découvrir nos recommandations
                                    </a>
                                </div>
                                
                                <!-- Footer Info -->
                                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
                                <p style="margin: 0; color: #6b7280; font-size: 13px;">
                                    Besoin d'aide ? Répondez à cet email ou consultez notre 
                                    <a href="{os.getenv('FRONTEND_URL', 'https://booktrack.io')}/help" style="color: {BRAND_COLOR}; text-decoration: none;">
                                        centre d'aide
                                    </a>
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f9fafb; padding: 20px 24px; text-align: center; border-radius: 0 0 8px 8px;">
                                <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                    © 2025 BookTrack. Tous droits réservés.<br>
                                    <a href="{os.getenv('FRONTEND_URL', 'https://booktrack.io')}/privacy" style="color: {BRAND_COLOR}; text-decoration: none; margin: 0 8px;">
                                        Confidentialité
                                    </a> |
                                    <a href="{os.getenv('FRONTEND_URL', 'https://booktrack.io')}/terms" style="color: {BRAND_COLOR}; text-decoration: none; margin: 0 8px;">
                                        Conditions
                                    </a>
                                </p>
                            </td>
                        </tr>
                        
                    </table>
                </td>
            </tr>
        </table>
        
    </body>
    </html>
    """
    
    return html_content, text_content


def send_retention_email(
    db: Session,
    user_id: str,
    churn_score: float,
    discount_percent: int = 20,
) -> Dict[str, Any]:
    """
    Envoie un email de rétention personnalisé à un utilisateur à risque.
    
    Args:
        db: Session SQLAlchemy
        user_id: ID de l'utilisateur
        churn_score: Score de churn calculé
        discount_percent: Pourcentage de réduction à offrir
        
    Returns:
        Dict avec le statut d'envoi
    """
    if not SENDGRID_API_KEY:
        return {
            "status": "error",
            "detail": "SENDGRID_API_KEY not configured",
        }
    
    # Récupérer les infos utilisateur
    user_row = db.execute(text("""
        SELECT u.id::text, u.email, u.nom, u.prenom, u.genres_preferes,
               cs.niveau_risque,
               json_agg(json_build_object(
                   'title', b.title,
                   'author', b.auteur,
                   'genre', g.name
               )) as recommended_books
        FROM users u
        LEFT JOIN churn_scores cs ON cs.user_id = u.id AND cs.is_latest = true
        LEFT JOIN library lib ON lib.user_id = u.id AND lib.statut = 'READING'
        LEFT JOIN books b ON b.id = lib.book_id
        LEFT JOIN book_genres bg ON bg.book_id = b.id
        LEFT JOIN genres g ON g.id = bg.genre_id
        WHERE u.id = :uid
        GROUP BY u.id, u.email, u.nom, u.prenom, u.genres_preferes, cs.niveau_risque
    """), {"uid": user_id}).fetchone()
    
    if not user_row:
        return {
            "status": "error",
            "detail": "User not found",
        }
    
    user_email, nom, prenom, genres_pref, niveau_risque, recommended_books = (
        user_row[1], user_row[2], user_row[3], user_row[4], user_row[5], user_row[6] or []
    )
    
    full_name = f"{prenom} {nom}" if prenom and nom else user_email.split("@")[0]
    
    # Générer le contenu
    html_content, text_content = _get_retention_email_content(
        user_name=full_name,
        churn_score=churn_score,
        niveau_risque=niveau_risque or "HIGH",
        discount_percent=discount_percent,
        recommended_books=recommended_books,
        preferred_genres=genres_pref or [],
    )
    
    try:
        # Préparer le message SendGrid
        message = Mail(
            from_email=Email(FROM_EMAIL, "BookTrack Team"),
            to_emails=To(user_email),
            subject=f"🎁 Offre spéciale pour vous, {prenom or 'lecteur'}!",
            plain_text_content=text_content,
            html_content=HtmlContent(html_content),
        )
        
        # Ajouter les métadonnées de suivi
        message.metadata = {
            "user_id": user_id,
            "churn_score": str(churn_score),
            "type": "retention_offer",
        }
        
        # Envoyer via SendGrid
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        
        # Enregistrer dans la base de données
        action_id = str(uuid.uuid4())
        db.execute(text("""
            INSERT INTO retention_actions
                (id, user_id, type_action, statut, contenu, sujet, date_envoi, metadata, created_at)
            VALUES
                (:id, :uid, 'EMAIL_RETENTION', 'SENT', :contenu, :sujet, NOW(), :metadata::jsonb, NOW())
        """), {
            "id": action_id,
            "uid": user_id,
            "contenu": html_content,
            "sujet": f"Offre spéciale pour vous, {prenom or 'lecteur'}!",
            "metadata": json.dumps({
                "discount_percent": discount_percent,
                "churn_score": float(churn_score),
                "sendgrid_response": response.status_code,
                "discount_code": f"STAY{discount_percent}",
            }),
        })
        db.commit()
        
        return {
            "status": "sent",
            "user_id": user_id,
            "email": user_email,
            "action_id": action_id,
            "discount_code": f"STAY{discount_percent}",
            "discount_percent": discount_percent,
        }
        
    except Exception as e:
        # Enregistrer l'erreur
        action_id = str(uuid.uuid4())
        db.execute(text("""
            INSERT INTO retention_actions
                (id, user_id, type_action, statut, contenu, sujet, metadata, created_at)
            VALUES
                (:id, :uid, 'EMAIL_RETENTION', 'FAILED', :contenu, :sujet, :metadata::jsonb, NOW())
        """), {
            "id": action_id,
            "uid": user_id,
            "contenu": str(e),
            "sujet": "Email send failed",
            "metadata": json.dumps({
                "error": str(e),
                "error_type": type(e).__name__,
            }),
        })
        db.commit()
        
        return {
            "status": "error",
            "user_id": user_id,
            "email": user_email,
            "detail": str(e),
        }


def mark_email_opened(db: Session, action_id: str) -> Dict[str, Any]:
    """Marquer un email comme ouvert (pour tracking via webhook SendGrid)."""
    try:
        db.execute(text("""
            UPDATE retention_actions
            SET date_ouverture = NOW()
            WHERE id = :aid AND type_action = 'EMAIL_RETENTION'
        """), {"aid": action_id})
        db.commit()
        return {"status": "marked"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}


def mark_email_clicked(db: Session, action_id: str) -> Dict[str, Any]:
    """Marquer un email comme cliqué."""
    try:
        db.execute(text("""
            UPDATE retention_actions
            SET date_clic = NOW()
            WHERE id = :aid AND type_action = 'EMAIL_RETENTION'
        """), {"aid": action_id})
        db.commit()
        return {"status": "marked"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}
