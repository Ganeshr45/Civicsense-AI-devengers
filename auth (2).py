import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import create_access_token, generate_otp_code, get_current_user
from app.database import get_db
from app.models import OTP, User, UserRole
from app.schemas import OTPRequest, OTPVerify, TokenResponse, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])
logger = logging.getLogger("civicsense.auth")

OTP_TTL_MINUTES = 10


@router.post("/request-otp")
def request_otp(payload: OTPRequest, db: Session = Depends(get_db)):
    """
    Generates a one-time code for phone login.

    No paid SMS gateway is wired up for the hackathon build, so the code is
    logged server-side (and echoed in the response in non-production use)
    instead of sent by SMS. Swapping in Twilio/MSG91 later only means
    replacing the `logger.info` call below with a real send -- the
    generate/store/verify flow is fully functional as-is.
    """
    code = generate_otp_code()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=OTP_TTL_MINUTES)
    otp = OTP(phone=payload.phone, code=code, expires_at=expires_at)
    db.add(otp)

    user = db.query(User).filter(User.phone == payload.phone).first()
    if not user:
        user = User(name=payload.name or "Citizen", phone=payload.phone, role=UserRole.citizen)
        db.add(user)

    db.commit()
    logger.info("OTP for %s is %s (expires in %s min)", payload.phone, code, OTP_TTL_MINUTES)

    return {"message": "OTP generated", "dev_otp": code, "expires_in_minutes": OTP_TTL_MINUTES}


@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp(payload: OTPVerify, db: Session = Depends(get_db)):
    otp = (
        db.query(OTP)
        .filter(OTP.phone == payload.phone, OTP.code == payload.code, OTP.used.is_(False))
        .order_by(OTP.created_at.desc())
        .first()
    )
    if not otp:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP")
    if otp.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP expired")

    otp.used = True
    user = db.query(User).filter(User.phone == payload.phone).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    db.commit()
    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return UserOut.model_validate(user)
