from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.rate_limit import RateLimit
from app.schemas.auth import LoginRequest, RefreshRequest, LogoutRequest, ForgotPasswordRequest, ResetPasswordRequest
from app.services.auth_service import login, refresh_session, logout_session, forgot_password, reset_password

router = APIRouter()

@router.post("/login", dependencies=[Depends(RateLimit("login", 5, 60))])
def login_user(login_data: LoginRequest, db: Session = Depends(get_db)):
    return login(db, login_data)

@router.post("/refresh", dependencies=[Depends(RateLimit("refresh", 20, 60))])
def refresh(refresh_data: RefreshRequest, db: Session = Depends(get_db)):
    return refresh_session(db, refresh_data.refresh_token)

@router.post("/logout")
def logout(logout_data: LogoutRequest, db: Session = Depends(get_db)):
    return logout_session(db, logout_data.refresh_token)

@router.post("/forgot-password", dependencies=[Depends(RateLimit("forgot-password", 3, 900))])
def forgot_password_request(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    return forgot_password(db, str(data.email))

@router.post("/reset-password", dependencies=[Depends(RateLimit("reset-password", 5, 900))])
def reset_password_request(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    return reset_password(db, data.token, data.new_password)
