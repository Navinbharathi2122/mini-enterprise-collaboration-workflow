"""User microservice: validates Auth0 tokens and provisions OAuth profiles."""
import os
import secrets
from typing import Any

import httpx
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.core.database import Base, engine, get_db
import app.models  # noqa: F401 - register all ORM models and relationships
from app.core.security import hash_password
from app.models.user import User
# Import these models so metadata knows about their tables in this service.
from app.models.tenant import Tenant  # noqa: F401
from app.models.tenant_membership import TenantMembership  # noqa: F401

app = FastAPI(title="User Microservice", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
bearer_scheme = HTTPBearer(auto_error=False)
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://127.0.0.1:8001").rstrip("/")

@app.on_event("startup")
def create_required_tables() -> None:
    # Safe for existing tables; does not delete or overwrite existing records.
    Base.metadata.create_all(bind=engine)

@app.get("/")
def root():
    return {"service": "User Microservice", "status": "running"}

async def _validated_payload(credentials: HTTPAuthorizationCredentials | None) -> dict[str, Any]:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Bearer access token is required", headers={"WWW-Authenticate": "Bearer"})
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{AUTH_SERVICE_URL}/auth/validate",
                headers={"Authorization": f"Bearer {credentials.credentials}"},
            )
    except httpx.RequestError as exc:
        raise HTTPException(status_code=503, detail="Authentication service is unavailable") from exc
    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Authentication service rejected the token", headers={"WWW-Authenticate": "Bearer"})
    try:
        data = response.json()
    except ValueError as exc:
        raise HTTPException(status_code=502, detail="Authentication service returned invalid JSON") from exc
    return {"sub": data.get("subject"), "email": data.get("email"), "name": data.get("name"), "provider": data.get("provider")}

def _profile_from_payload(payload: dict[str, Any], db: Session) -> User:
    email = payload.get("email")
    name = payload.get("name") or payload.get("nickname")
    if not email or not isinstance(email, str) or "@" not in email:
        raise HTTPException(status_code=401, detail="Verified email claim is required. Configure an Auth0 Post Login Action to add https://mecw-api/email.")
    email = email.strip().lower()
    name = str(name or email.split("@", 1)[0]).strip()[:100] or "User"

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        # OAuth accounts do not use this random password for login; local login remains separate.
        user = User(name=name, email=email, hashed_password=hash_password(secrets.token_urlsafe(48)), role="employee", is_active=True)
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Keep admin-assigned role and activation state; only refresh profile name if blank.
        if not user.name and name:
            user.name = name
            db.commit()
            db.refresh(user)
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User account is inactive. Contact your tenant administrator.")
    return user

@app.get("/users/me")
async def get_my_profile(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    payload = await _validated_payload(credentials)
    user = _profile_from_payload(payload, db)
    return {
        "authenticated": True,
        "user_id": user.id,
        "auth0_id": payload.get("sub"),
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "is_active": user.is_active,
        "provider": (payload.get("sub") or "").split("|", 1)[0] or "unknown",
    }

@app.post("/users/", status_code=status.HTTP_201_CREATED)
async def create_or_update_oauth_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    """Provision the signed-in Auth0 user. Role is never accepted from the browser."""
    payload = await _validated_payload(credentials)
    user = _profile_from_payload(payload, db)
    return {"user_id": user.id, "email": user.email, "name": user.name, "role": user.role, "is_active": user.is_active}

@app.get("/users/{user_id}")
async def get_user_by_id(user_id: int, credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme), db: Session = Depends(get_db)):
    payload = await _validated_payload(credentials)
    current = _profile_from_payload(payload, db)
    if current.id != user_id and current.role not in {"admin", "super_admin", "manager"}:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return {"user_id": user.id, "name": user.name, "email": user.email, "role": user.role, "is_active": user.is_active}


class UserProfileUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=100)

@app.patch("/users/{user_id}")
async def update_user_profile(
    user_id: int,
    body: UserProfileUpdate,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    payload = await _validated_payload(credentials)
    actor = _profile_from_payload(payload, db)
    if actor.id != user_id and actor.role.lower() not in {"admin", "super_admin", "manager"}:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    target = db.query(User).filter(User.id == user_id).first()
    if target is None:
        raise HTTPException(status_code=404, detail="User not found")
    target.name = body.name.strip()
    db.commit()
    db.refresh(target)
    return {"user_id": target.id, "name": target.name, "email": target.email, "role": target.role, "is_active": target.is_active}
