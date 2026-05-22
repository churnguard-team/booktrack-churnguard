import os
import uuid
import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent.parent / ".env")

from database import get_db
from models import Subscription
from schemas import CheckoutSessionRequest, CancelSubscriptionRequest, SubscriptionResponse

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_REPLACE_ME")
WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_REPLACE_ME")
PRICE_ID = os.getenv("STRIPE_PREMIUM_PRICE_ID", "price_REPLACE_ME")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

router = APIRouter(prefix="/api/payment", tags=["payment"])


@router.post("/create-checkout-session")
def create_checkout_session(body: CheckoutSessionRequest, db: Session = Depends(get_db)):
    """Create a Stripe Checkout session for the PREMIUM plan."""
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="subscription",
            line_items=[{"price": PRICE_ID, "quantity": 1}],
            customer_email=body.email,
            metadata={"user_id": body.user_id},
            success_url=f"{FRONTEND_URL}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{FRONTEND_URL}/payment/cancel",
        )
        return {"url": session.url, "session_id": session.id}
    except stripe.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Stripe webhook events (payment success, cancellation, expiry)."""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, WEBHOOK_SECRET)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid signature")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"].to_dict()
        user_id_str = session.get("metadata", {}).get("user_id")
        stripe_customer_id = session.get("customer")
        stripe_sub_id = session.get("subscription")

        print(f"[payment] checkout.session.completed — user_id={user_id_str} customer={stripe_customer_id} sub={stripe_sub_id}")

        if user_id_str:
            try:
                user_uuid = uuid.UUID(user_id_str)
            except ValueError:
                print(f"[payment] invalid user_id UUID: {user_id_str}")
                return {"status": "ok"}

            sub = db.query(Subscription).filter(Subscription.user_id == user_uuid).first()
            if sub:
                sub.type = "PREMIUM"
                sub.status = "ACTIVE"
                sub.stripe_customer_id = stripe_customer_id
                sub.stripe_sub_id = stripe_sub_id
                sub.updated_at = datetime.now(timezone.utc)
            else:
                sub = Subscription(
                    user_id=user_uuid,
                    type="PREMIUM",
                    status="ACTIVE",
                    date_debut=datetime.now(timezone.utc),
                    stripe_customer_id=stripe_customer_id,
                    stripe_sub_id=stripe_sub_id,
                )
                db.add(sub)
            db.commit()
            print(f"[payment] subscription updated to PREMIUM for user {user_id_str}")

    elif event["type"] == "customer.subscription.deleted":
        stripe_sub_id = event["data"]["object"].to_dict()["id"]
        sub = db.query(Subscription).filter(Subscription.stripe_sub_id == stripe_sub_id).first()
        if sub:
            sub.status = "CANCELLED"
            sub.type = "FREE"
            sub.cancelled_at = datetime.now(timezone.utc)
            sub.updated_at = datetime.now(timezone.utc)
            db.commit()
            print(f"[payment] subscription cancelled for stripe_sub_id={stripe_sub_id}")

    elif event["type"] == "invoice.payment_failed":
        stripe_sub_id = event["data"]["object"].to_dict().get("subscription")
        if stripe_sub_id:
            sub = db.query(Subscription).filter(Subscription.stripe_sub_id == stripe_sub_id).first()
            if sub:
                sub.status = "EXPIRED"
                sub.updated_at = datetime.now(timezone.utc)
                db.commit()

    return {"status": "ok"}


@router.post("/dev/set-premium/{user_id}")
def dev_set_premium(user_id: str, db: Session = Depends(get_db)):
    """DEV ONLY — directly set a user to PREMIUM without Stripe."""
    if os.getenv("ENV", "dev") != "dev":
        raise HTTPException(status_code=403, detail="Not available in production")
    try:
        user_uuid_dev = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user_id UUID")
    sub = db.query(Subscription).filter(Subscription.user_id == user_uuid_dev).first()
    if sub:
        sub.type = "PREMIUM"
        sub.status = "ACTIVE"
        sub.updated_at = datetime.now(timezone.utc)
    else:
        sub = Subscription(user_id=user_uuid_dev, type="PREMIUM", status="ACTIVE", date_debut=datetime.now(timezone.utc))
        db.add(sub)
    db.commit()
    db.refresh(sub)
    return {"message": "User set to PREMIUM", "user_id": user_id}


@router.get("/subscription/{user_id}", response_model=SubscriptionResponse)
def get_subscription(user_id: str, db: Session = Depends(get_db)):
    """Get the current subscription for a user."""
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user_id UUID")
    sub = db.query(Subscription).filter(Subscription.user_id == user_uuid).first()
    if not sub:
        return SubscriptionResponse(
            id="00000000-0000-0000-0000-000000000000",
            user_id=user_id,
            type="FREE",
            status="ACTIVE",
            date_debut=datetime.now(timezone.utc),
        )
    return sub


@router.post("/cancel")
def cancel_subscription(body: CancelSubscriptionRequest, db: Session = Depends(get_db)):
    """Cancel a user's Stripe subscription."""
    sub = db.query(Subscription).filter(Subscription.user_id == uuid.UUID(body.user_id)).first()
    if not sub or not sub.stripe_sub_id:
        raise HTTPException(status_code=404, detail="No active subscription found")

    try:
        stripe.Subscription.cancel(sub.stripe_sub_id)
    except stripe.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))

    sub.status = "CANCELLED"
    sub.type = "FREE"
    sub.cancelled_at = datetime.now(timezone.utc)
    sub.cancel_reason = body.reason
    sub.updated_at = datetime.now(timezone.utc)
    db.commit()

    return {"message": "Subscription cancelled successfully"}
