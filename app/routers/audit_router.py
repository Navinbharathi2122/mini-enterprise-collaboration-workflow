from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user

from app.models.user import User

from app.schemas.audit_log import AuditLogResponse

from app.services.audit_service import (
    get_audit_logs,
    get_audit_log_by_id,
)

router = APIRouter(
    prefix="/audit-logs",
    tags=["Audit Logs"],
)


def admin_or_manager(current_user: User):
    role = (current_user.role or "").lower()

    if role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=403,
            detail="Only Admin and Manager can access Audit Logs."
        )

    return current_user


@router.get("/", response_model=list[AuditLogResponse])
def read_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    admin_or_manager(current_user)
    return get_audit_logs(db, current_user)


@router.get("/{audit_log_id}", response_model=AuditLogResponse)
def read_audit_log(
    audit_log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    admin_or_manager(current_user)
    return get_audit_log_by_id(
        db,
        audit_log_id,
        current_user,
    )