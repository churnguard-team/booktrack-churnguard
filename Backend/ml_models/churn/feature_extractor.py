"""
CHURN FEATURE EXTRACTOR
=======================
Extracts features from the BookTrack database for a given user_id.

Feature map (what DB column → what feature name → what it means):
──────────────────────────────────────────────────────────────────
TABLE users
  created_at                  → account_age_days          : how long the user has been registered
  last_login_at               → days_since_last_login     : inactivity signal (NULL → 999 = never logged in)
  objectif_annuel             → objectif_annuel           : reading goal set by user
  genres_preferes (array)     → nb_genres_preferes        : how many genres the user cares about
  oauth_provider              → is_oauth_user             : 1 if Google login, 0 if email/password

TABLE user_books
  COUNT(statut='READ')        → total_books_read          : total finished books
  COUNT(statut='READING')     → books_currently_reading   : currently active readers less likely to churn
  COUNT(statut='ABANDONED')   → books_abandoned           : abandonment rate signal
  COUNT(statut='TO_READ')     → books_to_read             : wishlist size (engagement signal)
  AVG(note)                   → avg_rating                : how much they enjoy what they read
  COUNT(is_favourite=true)    → nb_favourites             : emotional attachment to the app
  SUM(pages_lues)             → total_pages_read          : raw reading volume
  COUNT(date_fin in last 30d) → books_read_last_30d       : recent activity (strongest churn signal)
  COUNT(avis IS NOT NULL)     → nb_reviews_written        : community engagement
  AVG(date_fin - date_debut)  → avg_days_to_finish        : reading speed / consistency

TABLE subscriptions (latest active)
  type = 'PREMIUM'            → is_premium                : paying users churn differently
  status = 'CANCELLED'        → subscription_cancelled    : already churning
  NOW() - date_debut          → subscription_age_days     : loyalty signal
  auto_renew                  → auto_renew                : intent to stay

TABLE user_events (last 30 days)
  COUNT(*)                    → total_events_30d          : overall app usage
  COUNT(event_type='book_view')→ book_views_30d           : browsing behavior
  COUNT(event_type='search')  → searches_30d              : discovery behavior
  COUNT(DISTINCT DATE(occurred_at)) → active_days_30d    : how many distinct days they opened the app

TABLE recommendations
  SUM(est_acceptee) / COUNT(est_affichee) → reco_acceptance_rate : do they engage with suggestions

TABLE book_comments
  COUNT(*)                    → nb_comments               : social engagement
"""

from datetime import datetime, timezone
from typing import Any, Dict, Optional
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.orm import Session


# ── The canonical feature list (must match saved_models/*/features.pkl) ──────
FEATURE_NAMES = [
    "account_age_days",
    "days_since_last_login",
    "objectif_annuel",
    "nb_genres_preferes",
    "is_oauth_user",
    "total_books_read",
    "books_currently_reading",
    "books_abandoned",
    "books_to_read",
    "avg_rating",
    "nb_favourites",
    "total_pages_read",
    "books_read_last_30d",
    "nb_reviews_written",
    "avg_days_to_finish",
    "is_premium",
    "subscription_cancelled",
    "subscription_age_days",
    "auto_renew",
    "total_events_30d",
    "book_views_30d",
    "searches_30d",
    "active_days_30d",
    "reco_acceptance_rate",
    "nb_comments",
]


def extract_features_for_user(db: Session, user_id: UUID) -> Optional[Dict[str, Any]]:
    """
    Pull all churn-relevant signals from the DB for one user.
    Returns a dict keyed by FEATURE_NAMES, or None if user not found.
    """
    now = datetime.now(timezone.utc)

    # ── users ─────────────────────────────────────────────────────────────────
    user_row = db.execute(
        text("""
            SELECT created_at, last_login_at, objectif_annuel,
                   genres_preferes, oauth_provider
            FROM users WHERE id = :uid
        """),
        {"uid": str(user_id)},
    ).fetchone()

    if user_row is None:
        return None

    created_at, last_login_at, objectif_annuel, genres_preferes, oauth_provider = user_row

    account_age_days = (now - created_at).days if created_at else 0
    days_since_last_login = (now - last_login_at).days if last_login_at else 999
    nb_genres_preferes = len(genres_preferes) if genres_preferes else 0
    is_oauth_user = 1 if oauth_provider else 0

    # ── user_books ────────────────────────────────────────────────────────────
    books_row = db.execute(
        text("""
            SELECT
                COUNT(*) FILTER (WHERE statut = 'READ')                          AS total_books_read,
                COUNT(*) FILTER (WHERE statut = 'READING')                       AS books_currently_reading,
                COUNT(*) FILTER (WHERE statut = 'ABANDONED')                     AS books_abandoned,
                COUNT(*) FILTER (WHERE statut = 'TO_READ')                       AS books_to_read,
                COALESCE(AVG(note) FILTER (WHERE note IS NOT NULL), 0)           AS avg_rating,
                COUNT(*) FILTER (WHERE is_favourite = true)                      AS nb_favourites,
                COALESCE(SUM(pages_lues), 0)                                     AS total_pages_read,
                COUNT(*) FILTER (WHERE date_fin >= NOW() - INTERVAL '30 days')   AS books_read_last_30d,
                COUNT(*) FILTER (WHERE avis IS NOT NULL)                         AS nb_reviews_written,
                COALESCE(
                    AVG(date_fin - date_debut)
                    FILTER (WHERE date_fin IS NOT NULL AND date_debut IS NOT NULL),
                    0
                )                                                                AS avg_days_to_finish
            FROM user_books
            WHERE user_id = :uid
        """),
        {"uid": str(user_id)},
    ).fetchone()

    (
        total_books_read, books_currently_reading, books_abandoned, books_to_read,
        avg_rating, nb_favourites, total_pages_read, books_read_last_30d,
        nb_reviews_written, avg_days_to_finish_raw,
    ) = books_row if books_row else (0, 0, 0, 0, 0, 0, 0, 0, 0, 0)

    # avg_days_to_finish comes back as a timedelta or Decimal depending on driver
    if hasattr(avg_days_to_finish_raw, "days"):
        avg_days_to_finish = float(avg_days_to_finish_raw.days)
    else:
        avg_days_to_finish = float(avg_days_to_finish_raw or 0)

    # ── subscriptions (latest) ────────────────────────────────────────────────
    sub_row = db.execute(
        text("""
            SELECT type, status, date_debut, auto_renew
            FROM subscriptions
            WHERE user_id = :uid
            ORDER BY created_at DESC
            LIMIT 1
        """),
        {"uid": str(user_id)},
    ).fetchone()

    if sub_row:
        sub_type, sub_status, sub_date_debut, sub_auto_renew = sub_row
        is_premium = 1 if sub_type == "PREMIUM" else 0
        subscription_cancelled = 1 if sub_status == "CANCELLED" else 0
        subscription_age_days = (now - sub_date_debut).days if sub_date_debut else 0
        auto_renew = 1 if sub_auto_renew else 0
    else:
        is_premium = subscription_cancelled = subscription_age_days = auto_renew = 0

    # ── user_events (last 30 days) ────────────────────────────────────────────
    events_row = db.execute(
        text("""
            SELECT
                COUNT(*)                                                          AS total_events_30d,
                COUNT(*) FILTER (WHERE event_type = 'book_view')                 AS book_views_30d,
                COUNT(*) FILTER (WHERE event_type = 'search')                    AS searches_30d,
                COUNT(DISTINCT DATE(occurred_at))                                AS active_days_30d
            FROM user_events
            WHERE user_id = :uid
              AND occurred_at >= NOW() - INTERVAL '30 days'
        """),
        {"uid": str(user_id)},
    ).fetchone()

    total_events_30d, book_views_30d, searches_30d, active_days_30d = (
        events_row if events_row else (0, 0, 0, 0)
    )

    # ── recommendations ───────────────────────────────────────────────────────
    reco_row = db.execute(
        text("""
            SELECT
                COUNT(*) FILTER (WHERE est_affichee = true)   AS shown,
                COUNT(*) FILTER (WHERE est_acceptee = true)   AS accepted
            FROM recommendations
            WHERE user_id = :uid
        """),
        {"uid": str(user_id)},
    ).fetchone()

    shown, accepted = reco_row if reco_row else (0, 0)
    reco_acceptance_rate = float(accepted) / float(shown) if shown and shown > 0 else 0.0

    # ── book_comments ─────────────────────────────────────────────────────────
    nb_comments = db.execute(
        text("SELECT COUNT(*) FROM book_comments WHERE user_id = :uid"),
        {"uid": str(user_id)},
    ).scalar() or 0

    # ── assemble ──────────────────────────────────────────────────────────────
    return {
        "account_age_days":        account_age_days,
        "days_since_last_login":   days_since_last_login,
        "objectif_annuel":         objectif_annuel or 12,
        "nb_genres_preferes":      nb_genres_preferes,
        "is_oauth_user":           is_oauth_user,
        "total_books_read":        int(total_books_read),
        "books_currently_reading": int(books_currently_reading),
        "books_abandoned":         int(books_abandoned),
        "books_to_read":           int(books_to_read),
        "avg_rating":              float(avg_rating),
        "nb_favourites":           int(nb_favourites),
        "total_pages_read":        int(total_pages_read),
        "books_read_last_30d":     int(books_read_last_30d),
        "nb_reviews_written":      int(nb_reviews_written),
        "avg_days_to_finish":      avg_days_to_finish,
        "is_premium":              is_premium,
        "subscription_cancelled":  subscription_cancelled,
        "subscription_age_days":   subscription_age_days,
        "auto_renew":              auto_renew,
        "total_events_30d":        int(total_events_30d),
        "book_views_30d":          int(book_views_30d),
        "searches_30d":            int(searches_30d),
        "active_days_30d":         int(active_days_30d),
        "reco_acceptance_rate":    reco_acceptance_rate,
        "nb_comments":             int(nb_comments),
    }


def extract_features_for_all_users(db: Session) -> Dict[str, Dict[str, Any]]:
    """
    Bulk extraction for all active users.
    Returns { user_id_str: feature_dict }.
    """
    user_ids = db.execute(
        text("SELECT id FROM users WHERE is_active = true")
    ).fetchall()

    return {
        str(row[0]): extract_features_for_user(db, row[0])
        for row in user_ids
    }
