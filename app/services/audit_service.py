

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.user import User


# =====================================================
# ROLE HELPERS
# =====================================================

def normalize_role(role) -> str:
    value = getattr(role, "value", role)

    return (
        str(value or "")
        .strip()
        .lower()
        .replace("-", "_")
        .replace(" ", "_")
    )


def is_admin(user: User) -> bool:
    return normalize_role(user.role) in {
        "admin",
        "administrator",
        "super_admin",
        "superadmin",
    }


def is_manager_or_admin(user: User) -> bool:
    return normalize_role(user.role) in {
        "admin",
        "administrator",
        "super_admin",
        "superadmin",
        "manager",
        "team_leader",
        "teamleader",
    }


# =====================================================
# CREATE AUDIT LOG
# =====================================================

def create_audit_log(
    db: Session,
    user_id: int,
    action: str,
    entity: str,
    entity_id: int | None = None,
    description: str | None = None,
):
    user = db.query(User).filter(User.id == user_id).first()

    if user is None:
        raise ValueError(
            f"Cannot create audit log: user ID {user_id} was not found."
        )

    user_name = (
        getattr(user, "name", None)
        or getattr(user, "user_name", None)
        or getattr(user, "full_name", None)
        or getattr(user, "email", None)
    )

    user_role = normalize_role(user.role)

    if not user_name:
        raise ValueError(
            f"Cannot create audit log: user ID {user_id} has no display name."
        )

    if not user_role:
        raise ValueError(
            f"Cannot create audit log: user ID {user_id} has no role."
        )

    audit_log = AuditLog(
        user_id=user.id,
        user_name=str(user_name),
        user_role=user_role,
        action=action,
        entity=entity,
        entity_id=entity_id,
        description=description,
    )

    try:
        db.add(audit_log)
        db.commit()
        db.refresh(audit_log)
        return audit_log

    except Exception:
        db.rollback()
        raise


# =====================================================
# GET AUDIT LOGS
# =====================================================

def get_audit_logs(
    db: Session,
    current_user: User,
):
    query = db.query(AuditLog)

    if is_admin(current_user):
        # Admin can view all recorded user activities.
        pass

    elif is_manager_or_admin(current_user):
        # Manager / Team Leader can view employee logs
        # and their own logs.
        query = query.filter(
            (AuditLog.user_role == "employee")
            | (AuditLog.user_id == current_user.id)
        )

    else:
        raise HTTPException(
            status_code=403,
            detail="Only Admin and Manager can access Audit Logs.",
        )

    return (
        query
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
    if not is_manager_or_admin(current_user):
        raise HTTPException(
            status_code=403,
            detail="Only Admin and Manager can view audit logs.",
        )

    audit_log = (
        db.query(AuditLog)
        .filter(AuditLog.id == audit_log_id)
        .first()
    )

    if audit_log is None:
        raise HTTPException(
            status_code=404,
            detail="Audit log not found.",
        )

    # Admin can view any audit record.
    if is_admin(current_user):
        return audit_log

    # Manager / Team Leader can view employee logs
    # and their own records.
    if (
        audit_log.user_role != "employee"
        and audit_log.user_id != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="You cannot access this audit log.",
        )

    return audit_log
