"""Tenant administration API with token validation and tenant-level RBAC."""
import os
import re
import httpx
from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import Base, engine, get_db
import app.models  # noqa: F401 - register all ORM models and relationships
from app.models.user import User
from app.models.tenant import Tenant
from app.models.tenant_membership import TenantMembership

USER_SERVICE_URL = os.getenv("USER_SERVICE_URL", "http://127.0.0.1:8002").rstrip("/")
app = FastAPI(title="Tenant Admin Microservice", version="2.0.0")
bearer_scheme = HTTPBearer(auto_error=False)

class TenantCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    slug: str | None = Field(default=None, min_length=2, max_length=100)

class MembershipCreate(BaseModel):
    user_id: int = Field(gt=0)
    role: str = "employee"

class StatusUpdate(BaseModel):
    is_active: bool

class RoleUpdate(BaseModel):
    role: str = Field(min_length=3, max_length=30)

@app.on_event("startup")
def create_required_tables():
    Base.metadata.create_all(bind=engine)

@app.get("/")
def root():
    return {"service": "Tenant Admin Microservice", "status": "running"}

async def current_profile(credentials: HTTPAuthorizationCredentials | None):
    if credentials is None:
        raise HTTPException(status_code=401, detail="Bearer access token is required")
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(f"{USER_SERVICE_URL}/users/me", headers={"Authorization": f"Bearer {credentials.credentials}"})
    except httpx.RequestError as exc:
        raise HTTPException(status_code=503, detail="User Microservice is unavailable") from exc
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code if response.status_code in (401, 403) else 401, detail="Authentication failed through User Microservice")
    return response.json()

def _user_for_profile(db: Session, profile: dict) -> User:
    user = db.query(User).filter(User.email == str(profile.get("email", "")).lower()).first()
    if user is None or not user.is_active:
        raise HTTPException(status_code=403, detail="Active user account not found")
    return user

def _membership(db: Session, tenant_id: int, user_id: int) -> TenantMembership:
    membership = db.query(TenantMembership).filter(TenantMembership.tenant_id == tenant_id, TenantMembership.user_id == user_id).first()
    if membership is None:
        raise HTTPException(status_code=403, detail="User is not a member of this tenant")
    return membership

def _require_tenant_admin(db: Session, tenant_id: int, user: User) -> Tenant:
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id, Tenant.is_active.is_(True)).first()
    if tenant is None:
        raise HTTPException(status_code=404, detail="Active tenant not found")
    if user.role.lower() in {"super_admin", "superadmin"}:
        return tenant
    membership = _membership(db, tenant_id, user.id)
    if membership.role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Tenant admin access required")
    return tenant

@app.get("/tenant-admin/me")
async def get_tenant_admin_identity(tenant_id: int = Query(..., gt=0), credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme), db: Session = Depends(get_db)):
    profile = await current_profile(credentials)
    user = _user_for_profile(db, profile)
    tenant = _require_tenant_admin(db, tenant_id, user)
    return {"email": user.email, "user_id": user.id, "tenant_id": tenant.id, "tenant_name": tenant.name, "role": user.role, "authenticated": True, "authorized": True}

@app.post("/tenants/", status_code=status.HTTP_201_CREATED)
async def create_tenant(body: TenantCreate, credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme), db: Session = Depends(get_db)):
    profile = await current_profile(credentials)
    user = _user_for_profile(db, profile)
    if user.role.lower() not in {"admin", "super_admin", "superadmin"}:
        raise HTTPException(status_code=403, detail="Admin access required to create tenants")
    slug = (body.slug or re.sub(r"[^a-z0-9]+", "-", body.name.lower()).strip("-"))
    if db.query(Tenant).filter(Tenant.slug == slug).first():
        raise HTTPException(status_code=409, detail="Tenant slug already exists")
    tenant = Tenant(name=body.name.strip(), slug=slug, is_active=True)
    db.add(tenant)
    db.flush()
    db.add(TenantMembership(tenant_id=tenant.id, user_id=user.id, role="admin"))
    db.commit()
    db.refresh(tenant)
    return {"id": tenant.id, "name": tenant.name, "slug": tenant.slug, "is_active": tenant.is_active}

@app.get("/tenants/{tenant_id}")
async def get_tenant(tenant_id: int, credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme), db: Session = Depends(get_db)):
    profile = await current_profile(credentials)
    user = _user_for_profile(db, profile)
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if tenant is None:
        raise HTTPException(status_code=404, detail="Tenant not found")
    if user.role.lower() not in {"admin", "super_admin", "superadmin"}:
        _membership(db, tenant_id, user.id)
    return {"id": tenant.id, "name": tenant.name, "slug": tenant.slug, "is_active": tenant.is_active}

@app.get("/tenants/{tenant_id}/users")
async def list_tenant_users(tenant_id: int, credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme), db: Session = Depends(get_db)):
    profile = await current_profile(credentials)
    user = _user_for_profile(db, profile)
    _require_tenant_admin(db, tenant_id, user)
    rows = db.query(TenantMembership, User).join(User, User.id == TenantMembership.user_id).filter(TenantMembership.tenant_id == tenant_id).all()
    return [{"user_id": member.id, "name": member.name, "email": member.email, "role": membership.role, "is_active": member.is_active} for membership, member in rows]

@app.post("/tenants/{tenant_id}/users", status_code=status.HTTP_201_CREATED)
async def add_tenant_user(tenant_id: int, body: MembershipCreate, credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme), db: Session = Depends(get_db)):
    profile = await current_profile(credentials)
    actor = _user_for_profile(db, profile)
    _require_tenant_admin(db, tenant_id, actor)
    target = db.query(User).filter(User.id == body.user_id).first()
    if target is None:
        raise HTTPException(status_code=404, detail="User not found")
    role = body.role.strip().lower()
    if role not in {"admin", "manager", "employee"}:
        raise HTTPException(status_code=422, detail="Role must be admin, manager or employee")
    existing = db.query(TenantMembership).filter(TenantMembership.tenant_id == tenant_id, TenantMembership.user_id == target.id).first()
    if existing:
        existing.role = role
        membership = existing
    else:
        membership = TenantMembership(tenant_id=tenant_id, user_id=target.id, role=role)
        db.add(membership)
    db.commit()
    return {"tenant_id": tenant_id, "user_id": target.id, "role": membership.role}

@app.patch("/tenants/{tenant_id}/users/{user_id}/status")
async def update_tenant_user_status(tenant_id: int, user_id: int, body: StatusUpdate, credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme), db: Session = Depends(get_db)):
    profile = await current_profile(credentials)
    actor = _user_for_profile(db, profile)
    _require_tenant_admin(db, tenant_id, actor)
    membership = _membership(db, tenant_id, user_id)
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = body.is_active
    db.commit()
    return {"tenant_id": tenant_id, "user_id": user_id, "is_active": user.is_active, "membership_role": membership.role}

@app.patch("/tenants/{tenant_id}/users/{user_id}/role")
async def update_tenant_user_role(tenant_id: int, user_id: int, body: RoleUpdate, credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme), db: Session = Depends(get_db)):
    profile = await current_profile(credentials)
    actor = _user_for_profile(db, profile)
    _require_tenant_admin(db, tenant_id, actor)
    membership = _membership(db, tenant_id, user_id)
    role = body.role.strip().lower()
    if role not in {"admin", "manager", "employee"}:
        raise HTTPException(status_code=422, detail="Role must be admin, manager or employee")
    membership.role = role
    db.commit()
    return {"tenant_id": tenant_id, "user_id": user_id, "role": membership.role}
