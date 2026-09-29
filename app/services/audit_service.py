from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.user import User


# =====================================================
# CREATE AUDIT LOG
# =====================================================

def create_audit_log(
    db: Session,
    user_id: int,
    action: str,
    entity: str,
    entity_id: int | None,
    description: str,
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        return None

    audit_log = AuditLog(
        user_id=user.id,
        user_name=user.name,
        user_role=user.role,
        action=action,
        entity=entity,
        entity_id=entity_id,
        description=description,
    )

    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)

    return audit_log


# =====================================================
# GET ALL AUDIT LOGS
# =====================================================

def get_audit_logs(db: Session, current_user: User):

    role = (current_user.role or "").lower()

    if role == "admin":
        return (
            db.query(AuditLog)
            .order_by(AuditLog.created_at.desc())
            .all()
        )

    elif role == "manager":
        return (
            db.query(AuditLog)
            .filter(AuditLog.user_role == "employee")
            .order_by(AuditLog.created_at.desc())
            .all()
        )

    else:
        return (
            db.query(AuditLog)
            .filter(AuditLog.user_id == current_user.id)
            .order_by(AuditLog.created_at.desc())
            .all()
        )

# =====================================================
# GET SINGLE AUDIT LOG
# =====================================================

def get_audit_log_by_id(
    db: Session,
    audit_log_id: int,
    current_user: User,
):

    role = (current_user.role or "").lower()

    if role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=403,
            detail="Only Admin and Manager can view audit logs."
        )

    audit_log = (
        db.query(AuditLog)
        .filter(AuditLog.id == audit_log_id)
        .first()
    )

    if audit_log is None:
        raise HTTPException(
            status_code=404,
            detail="Audit log not found."
        )

    return audit_log