
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.cache import get_json, set_json
from app.core.auth0_security import (
    get_current_auth0_payload,
    EMAIL_CLAIM,
)
from app.models.user import User

from app.schemas.dashboard import (
    DashboardResponse,
    DashboardAISummaryResponse,
)

from app.services.dashboard_service import (
    get_dashboard_summary,
    get_task_distribution,
    get_ai_dashboard_summary,
)


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


def get_dashboard_user(
    auth0_payload: dict = Depends(get_current_auth0_payload),
    db: Session = Depends(get_db),
) -> User:
    """Validate Auth0 identity and find the existing local user."""

    email = (
        auth0_payload.get("email")
        or auth0_payload.get(EMAIL_CLAIM)
    )

    if not email:
        raise HTTPException(
            status_code=401,
            detail=(
                "Email claim is missing from the Auth0 access token. "
                "Configure an Auth0 Post Login Action."
            ),
        )

    user = (
        db.query(User)
        .filter(User.email == str(email).strip().lower())
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=401,
            detail=(
                "No local user account matches the Auth0 email. "
                "Create or link the user account first."
            ),
        )
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User account is inactive")

    return user


@router.get(
    "/summary",
    response_model=DashboardResponse,
)
def dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_dashboard_user),
):
    # Authentication/authorization is resolved before the per-user cache is consulted.
    key = f"mecw:dashboard:summary:user:{current_user.id}:role:{current_user.role}"
    cached = get_json(key)
    if cached is not None:
        return cached
    result = get_dashboard_summary(db, current_user)
    set_json(key, result, ttl=45)
    return result


@router.get("/task-distribution")
def task_distribution(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_dashboard_user),
):
    key = f"mecw:dashboard:distribution:user:{current_user.id}:role:{current_user.role}"
    cached = get_json(key)
    if cached is not None:
        return cached
    result = get_task_distribution(db, current_user)
    set_json(key, result, ttl=45)
    return result


@router.get(
    "/ai-summary",
    response_model=DashboardAISummaryResponse,
)
def ai_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_dashboard_user),
):
    return get_ai_dashboard_summary(db, current_user)
