
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.audit_log import AuditLogResponse

from app.services.audit_service import (
    get_audit_logs,
    get_audit_log_by_id,
    create_audit_log,
    is_manager_or_admin,
)


router = APIRouter(
    prefix="/audit-logs",
    tags=["Audit Logs"],
)


def admin_or_manager(current_user: User):
    """
    Allow Admin, Super Admin, Manager and Team Leader.
    """
    if not is_manager_or_admin(current_user):
        from fastapi import HTTPException

        raise HTTPException(
            status_code=403,
            detail="Only Admin and Manager can access Audit Logs.",
        )

    return current_user


# ==========================================
# RECORD SUCCESSFUL AUTH0 LOGIN
# ==========================================

@router.post(
    "/login-event",
    response_model=AuditLogResponse,
)
def record_login_event(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Record a successful Google/Auth0 login.
    The backend identifies the user from the validated token.
    """
    return create_audit_log(
        db=db,
        user_id=current_user.id,
        action="LOGIN",
        entity="AUTH",
        entity_id=current_user.id,
        description="User logged in successfully through Auth0",
    )


# ==========================================
# GET ALL AUDIT LOGS
# ==========================================

@router.get(
    "/",
    response_model=list[AuditLogResponse],
)
def read_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    admin_or_manager(current_user)

    return get_audit_logs(
        db=db,
        current_user=current_user,
    )


# ==========================================
# GET SINGLE AUDIT LOG
# ==========================================

@router.get(
    "/{audit_log_id}",
    response_model=AuditLogResponse,
)
def read_audit_log(
    audit_log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    admin_or_manager(current_user)

    return get_audit_log_by_id(
        db=db,
        audit_log_id=audit_log_id,
        current_user=current_user,
    )
