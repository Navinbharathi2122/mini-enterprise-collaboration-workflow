import hashlib
import logging
import secrets
import smtplib
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from fastapi import HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.user import User
from app.models.security_tokens import RefreshToken, PasswordResetToken
from app.schemas.auth import LoginRequest
from app.core.security import verify_password, create_access_token, hash_password
from app.services.audit_service import create_audit_log

logger = logging.getLogger(__name__)

def _utcnow():
    return datetime.now(timezone.utc)

def _hash_token(token: str) -> str:
    return hashlib.sha256((token + settings.reset_token_pepper).encode()).hexdigest()

def _create_refresh_token(user: User) -> tuple[str, datetime]:
    expires = _utcnow() + timedelta(days=settings.refresh_token_expire_days)
    token = jwt.encode({"sub": str(user.id), "type": "refresh", "exp": expires, "jti": secrets.token_urlsafe(16)}, settings.secret_key, algorithm=settings.algorithm)
    return token, expires

def login(db: Session, login_data: LoginRequest):
    email = str(login_data.email).strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if user is None or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password", headers={"WWW-Authenticate": "Bearer"})
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User account is inactive")
    access_token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role, "type": "access"})
    refresh_token, expires = _create_refresh_token(user)
    db.add(RefreshToken(user_id=user.id, token_hash=_hash_token(refresh_token), expires_at=expires))
    try:
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("Failed to persist refresh session")
        raise HTTPException(status_code=503, detail="Unable to create login session")
    try:
        create_audit_log(db=db, user_id=user.id, action="LOGIN", entity="AUTH", entity_id=user.id, description="User logged in successfully")
    except Exception:
        logger.exception("Failed to create login audit log")
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer", "expires_in": settings.access_token_expire_minutes * 60, "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role}}

def refresh_session(db: Session, raw_token: str):
    try:
        payload = jwt.decode(raw_token, settings.secret_key, algorithms=[settings.algorithm])
        if payload.get("type") != "refresh":
            raise ValueError("wrong token type")
        user_id = int(payload["sub"])
    except (JWTError, ValueError, KeyError, TypeError):
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    stored = db.query(RefreshToken).filter(RefreshToken.token_hash == _hash_token(raw_token)).with_for_update().first()
    now = _utcnow()
    if not stored or stored.revoked_at is not None or stored.expires_at.replace(tzinfo=timezone.utc) <= now or stored.user_id != user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        stored.revoked_at = now
        db.commit()
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    # Rotate refresh token: old token is revoked and replaced in one transaction.
    stored.revoked_at = now
    new_refresh, expires = _create_refresh_token(user)
    db.add(RefreshToken(user_id=user.id, token_hash=_hash_token(new_refresh), expires_at=expires))
    db.commit()
    access = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role, "type": "access"})
    return {"access_token": access, "refresh_token": new_refresh, "token_type": "bearer", "expires_in": settings.access_token_expire_minutes * 60}

def logout_session(db: Session, raw_token: str):
    token_hash = _hash_token(raw_token)
    stored = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
    if stored and stored.revoked_at is None:
        stored.revoked_at = _utcnow()
        db.commit()
    return {"message": "Logged out successfully"}

def _send_reset_email(email: str, token: str):
    if not all([settings.smtp_host, settings.smtp_from_email]):
        logger.warning("Password reset requested but SMTP is not configured; no email was sent")
        return
    msg = EmailMessage()
    msg["Subject"] = "MECW password reset"
    msg["From"] = settings.smtp_from_email
    msg["To"] = email
    msg.set_content(f"Use this one-time link to reset your MECW password: {settings.frontend_url.rstrip('/')}/reset-password#token={token}\nThis link expires in {settings.password_reset_expire_minutes} minutes. If you did not request this, ignore this email.")
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as server:
        if settings.smtp_use_tls:
            server.starttls()
        if settings.smtp_username:
            server.login(settings.smtp_username, settings.smtp_password)
        server.send_message(msg)

def forgot_password(db: Session, email: str):
    normalized = email.strip().lower()
    user = db.query(User).filter(User.email == normalized, User.is_active.is_(True)).first()
    if user:
        raw = secrets.token_urlsafe(32)
        db.add(PasswordResetToken(user_id=user.id, token_hash=_hash_token(raw), expires_at=_utcnow() + timedelta(minutes=settings.password_reset_expire_minutes)))
        db.commit()
        try:
            _send_reset_email(user.email, raw)
        except Exception:
            logger.exception("Password reset email delivery failed")
            # Do not disclose account existence or reset token through the API.
    return {"message": "If an active account exists for that email, password reset instructions will be sent."}

def reset_password(db: Session, raw_token: str, new_password: str):
    now = _utcnow()
    token = db.query(PasswordResetToken).filter(PasswordResetToken.token_hash == _hash_token(raw_token), PasswordResetToken.used_at.is_(None)).with_for_update().first()
    if not token or token.expires_at.replace(tzinfo=timezone.utc) <= now:
        raise HTTPException(status_code=400, detail="Reset token is invalid or expired")
    user = db.query(User).filter(User.id == token.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=400, detail="Reset token is invalid or expired")
    user.hashed_password = hash_password(new_password)
    # Invalidate every outstanding reset link for this user, not just the link used.
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used_at.is_(None),
    ).update({PasswordResetToken.used_at: now}, synchronize_session=False)
    # Revoke all existing refresh sessions after a credential reset.
    db.query(RefreshToken).filter(RefreshToken.user_id == user.id, RefreshToken.revoked_at.is_(None)).update({RefreshToken.revoked_at: now}, synchronize_session=False)
    db.commit()
    return {"message": "Password has been reset successfully"}
