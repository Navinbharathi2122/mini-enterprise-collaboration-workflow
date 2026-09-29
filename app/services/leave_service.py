from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.leave_request import LeaveRequest
from app.models.leave_history import LeaveHistory
from app.models.user import User

from app.services.notification_service import (
    notify_leave_submission,
    notify_leave_action,
)



def create_leave_request(
    db: Session,
    leave_data,
    current_user: User,
):
    """
    Employee submits leave request.

    Workflow:
    Employee -> Manager -> Admin
    """

    days = (leave_data.end_date - leave_data.start_date).days + 1

    if days <= 0:
        raise HTTPException(
            status_code=400,
            detail="End date must be after start date.",
        )

    leave = LeaveRequest(
        requested_by=current_user.id,
        leave_type=leave_data.leave_type,
        reason=leave_data.reason,
        start_date=leave_data.start_date,
        end_date=leave_data.end_date,
        days=days,
        status="pending",
        current_level="manager",
    )

    db.add(leave)
    db.commit()
    db.refresh(leave)

    # Attach employee details for frontend
    leave.requested_by_name = current_user.name
    leave.requested_by_role = current_user.role

    # Enterprise Notifications
    notify_leave_submission(
        db=db,
        employee=current_user,
        leave_type=leave.leave_type,
    )

    return leave


# =====================================================
# GET ALL LEAVE REQUESTS
# =====================================================

def get_all_leave_requests(
    db: Session,
    current_user: User,
):
    """
    Employee -> Own leaves only.
    Manager/Admin -> All leaves.
    """

    role = (current_user.role or "").strip().lower()

    if role == "employee":
        leaves = (
            db.query(LeaveRequest)
            .filter(LeaveRequest.requested_by == current_user.id)
            .order_by(LeaveRequest.created_at.desc())
            .all()
        )
    else:
        leaves = (
            db.query(LeaveRequest)
            .order_by(LeaveRequest.created_at.desc())
            .all()
        )

    # Add employee name & role
    for leave in leaves:
        employee = (
            db.query(User)
            .filter(User.id == leave.requested_by)
            .first()
        )

        if employee:
            leave.requested_by_name = employee.name
            leave.requested_by_role = employee.role

    return leaves


# =====================================================
# GET SINGLE LEAVE REQUEST
# =====================================================

def get_leave_by_id(
    db: Session,
    leave_request_id: int,
):
    leave = (
        db.query(LeaveRequest)
        .filter(LeaveRequest.id == leave_request_id)
        .first()
    )

    if not leave:
        raise HTTPException(
            status_code=404,
            detail="Leave request not found.",
        )

    employee = (
        db.query(User)
        .filter(User.id == leave.requested_by)
        .first()
    )

    if employee:
        leave.requested_by_name = employee.name
        leave.requested_by_role = employee.role

    return leave


# =====================================================
# MANAGER / ADMIN LEAVE ACTIONS (ENTERPRISE WORKFLOW)
# =====================================================

from datetime import datetime
from fastapi import HTTPException

def take_leave_action(
    db: Session,
    leave_request_id: int,
    leave_action,
    current_user: User,
):
    leave = (
        db.query(LeaveRequest)
        .filter(LeaveRequest.id == leave_request_id)
        .first()
    )

    if not leave:
        raise HTTPException(404, "Leave request not found.")

    employee = (
        db.query(User)
        .filter(User.id == leave.requested_by)
        .first()
    )

    action = leave_action.action.lower().strip()
    role = current_user.role.lower().strip()

    # ---------- MANAGER ----------
    if role == "manager":

        if leave.status in ["approved", "rejected"]:
            raise HTTPException(400, "Leave request already completed.")

        if action == "approve":
            leave.status = "manager_approved"
            leave.current_level = "admin"

        elif action == "reject":
            leave.status = "rejected"
            leave.current_level = "completed"

        elif action == "hold":
            leave.status = "hold"

        elif action == "resume":
            if leave.status != "hold":
                raise HTTPException(400, "Leave is not on hold.")
            leave.status = "pending"
            leave.current_level = "manager"

        else:
            raise HTTPException(400, "Invalid action.")

    # ---------- ADMIN ----------
    elif role == "admin":

        if leave.status in ["approved", "rejected"]:
            raise HTTPException(400, "Leave request already completed.")

        if action == "approve":
            leave.status = "approved"
            leave.current_level = "completed"

        elif action == "reject":
            leave.status = "rejected"
            leave.current_level = "completed"

        elif action == "hold":
            leave.status = "hold"

        elif action == "resume":
            if leave.status != "hold":
                raise HTTPException(400, "Leave is not on hold.")
            leave.status = "manager_approved"
            leave.current_level = "admin"

        else:
            raise HTTPException(400, "Invalid action.")

    else:
        raise HTTPException(403, "Only Manager or Admin can perform leave actions.")

    leave.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(leave)

    # Leave history
    history = LeaveHistory(
        leave_request_id=leave.id,
        action_by_id=current_user.id,
        action_by_role=current_user.role,
        action=action,
        comment=leave_action.comment,
    )

    db.add(history)
    db.commit()

    # Notifications
    notify_leave_action(
        db=db,
        employee=employee,
        action_by=current_user,
        action=action,
    )

    leave.requested_by_name = employee.name
    leave.requested_by_role = employee.role

    return leave

# =====================================================
# LEAVE HISTORY
# =====================================================

def get_leave_history(
    db: Session,
    leave_request_id: int,
):
    """
    Returns complete approval history of a leave request.
    Used in Leave History modal.
    """

    leave = (
        db.query(LeaveRequest)
        .filter(LeaveRequest.id == leave_request_id)
        .first()
    )

    if not leave:
        raise HTTPException(
            status_code=404,
            detail="Leave request not found.",
        )

    history = (
        db.query(LeaveHistory)
        .filter(LeaveHistory.leave_request_id == leave_request_id)
        .order_by(LeaveHistory.created_at.desc())
        .all()
    )

    return history


# =====================================================
# DASHBOARD LEAVE STATISTICS
# =====================================================

def get_leave_statistics(
    db: Session,
    current_user: User,
):
    """
    Dashboard statistics.

    Employee -> Own requests only.
    Manager/Admin -> All requests.
    """

    role = (current_user.role or "").strip().lower()

    query = db.query(LeaveRequest)

    if role == "employee":
        query = query.filter(
            LeaveRequest.requested_by == current_user.id
        )

    leaves = query.all()

    stats = {
        "total_requests": len(leaves),
        "pending": 0,
        "manager_approved": 0,
        "approved": 0,
        "rejected": 0,
        "hold": 0,
    }

    for leave in leaves:
        status = (leave.status or "").lower()

        if status == "pending":
            stats["pending"] += 1

        elif status == "manager_approved":
            stats["manager_approved"] += 1

        elif status == "approved":
            stats["approved"] += 1

        elif status == "rejected":
            stats["rejected"] += 1

        elif status == "hold":
            stats["hold"] += 1

    return stats


# =====================================================
# PENDING LEAVE REQUESTS
# =====================================================

def get_pending_leave_requests(
    db: Session,
    current_user: User,
):
    """
    Manager -> Requests waiting for Manager approval.

    Admin -> Requests waiting for Admin approval.
    """

    role = (current_user.role or "").strip().lower()

    if role == "manager":

        pending = (
            db.query(LeaveRequest)
            .filter(LeaveRequest.current_level == "manager")
            .order_by(LeaveRequest.created_at.desc())
            .all()
        )

    elif role == "admin":

        pending = (
            db.query(LeaveRequest)
            .filter(LeaveRequest.current_level == "admin")
            .order_by(LeaveRequest.created_at.desc())
            .all()
        )

    else:
        raise HTTPException(
            status_code=403,
            detail="Employees cannot access pending leave approvals.",
        )

    # Attach employee information
    for leave in pending:

        employee = (
            db.query(User)
            .filter(User.id == leave.requested_by)
            .first()
        )

        if employee:
            leave.requested_by_name = employee.name
            leave.requested_by_role = employee.role

    return pending


# =====================================================
# RECENT LEAVE REQUESTS
# =====================================================

def get_recent_leave_requests(
    db: Session,
    current_user: User,
    limit: int = 5,
):
    """
    Dashboard Recent Leave Requests widget.
    """

    role = (current_user.role or "").strip().lower()

    query = db.query(LeaveRequest)

    if role == "employee":
        query = query.filter(
            LeaveRequest.requested_by == current_user.id
        )

    recent = (
        query.order_by(LeaveRequest.created_at.desc())
        .limit(limit)
        .all()
    )

    for leave in recent:

        employee = (
            db.query(User)
            .filter(User.id == leave.requested_by)
            .first()
        )

        if employee:
            leave.requested_by_name = employee.name
            leave.requested_by_role = employee.role

    return recent


# =====================================================
# EMPLOYEE LEAVE BALANCE
# =====================================================

def get_employee_leave_balance(
    db: Session,
    current_user: User,
):
    """
    Calculates employee leave balance.

    Default yearly balance = 24 days.
    """

    approved_leaves = (
        db.query(LeaveRequest)
        .filter(
            LeaveRequest.requested_by == current_user.id,
            LeaveRequest.status == "approved",
        )
        .all()
    )

    used_days = sum(leave.days for leave in approved_leaves)

    total_leave = 24
    remaining_leave = max(total_leave - used_days, 0)

    return {
        "total_leave": total_leave,
        "used_leave": used_days,
        "remaining_leave": remaining_leave,
    }


# =====================================================
# MANAGER / ADMIN LEAVE SUMMARY
# =====================================================

def get_leave_approval_summary(db: Session):
    """
    Dashboard approval cards.
    """

    return {
        "pending_manager": db.query(LeaveRequest).filter(
            LeaveRequest.current_level == "manager"
        ).count(),

        "pending_admin": db.query(LeaveRequest).filter(
            LeaveRequest.current_level == "admin"
        ).count(),

        "approved": db.query(LeaveRequest).filter(
            LeaveRequest.status == "approved"
        ).count(),

        "rejected": db.query(LeaveRequest).filter(
            LeaveRequest.status == "rejected"
        ).count(),

        "hold": db.query(LeaveRequest).filter(
            LeaveRequest.status == "hold"
        ).count(),
    }


# =====================================================
# SEARCH LEAVE REQUESTS
# =====================================================

def search_leave_requests(
    db: Session,
    current_user: User,
    keyword: str,
):
    """
    Search leave requests by employee name,
    leave type or status.
    """

    keyword = keyword.lower()

    leaves = get_all_leave_requests(db, current_user)

    results = []

    for leave in leaves:

        employee = (
            db.query(User)
            .filter(User.id == leave.requested_by)
            .first()
        )

        employee_name = employee.name.lower() if employee else ""

        if (
            keyword in employee_name
            or keyword in leave.leave_type.lower()
            or keyword in leave.status.lower()
        ):
            leave.requested_by_name = employee.name if employee else ""
            leave.requested_by_role = employee.role if employee else ""

            results.append(leave)

    return results


# =====================================================
# STATUS COLOR HELPER
# =====================================================

def get_leave_status_color(status: str):
    """
    Used by React dashboard.
    """

    colors = {
        "pending": "#F59E0B",
        "manager_approved": "#2563EB",
        "approved": "#16A34A",
        "rejected": "#DC2626",
        "hold": "#9333EA",
    }

    return colors.get(status.lower(), "#64748B")


# =====================================================
# ENRICH LEAVE RESPONSE
# =====================================================

def enrich_leave_response(
    db: Session,
    leave: LeaveRequest,
):
    """
    Adds employee name & role for frontend.
    """

    employee = (
        db.query(User)
        .filter(User.id == leave.requested_by)
        .first()
    )

    if employee:
        leave.requested_by_name = employee.name
        leave.requested_by_role = employee.role

    return leave


# =====================================================
# ENTERPRISE AUDIT LOG HELPER
# =====================================================

def create_leave_audit_log(
    db: Session,
    leave: LeaveRequest,
    current_user: User,
    action: str,
):
    """
    Optional helper if your project has AuditLog model.
    """

    try:
        from app.models.audit_log import AuditLog

        log = AuditLog(
            user_id=current_user.id,
            action=action.upper(),
            entity="Leave Request",
            entity_id=leave.id,
            description=(
                f"{current_user.name} ({current_user.role}) "
                f"{action.lower()} leave request #{leave.id}"
            ),
        )

        db.add(log)
        db.commit()

    except Exception:
        # Skip audit log if model isn't available
        db.rollback()


# =====================================================
# ENTERPRISE NOTIFICATION HELPER
# =====================================================

def send_leave_notifications_after_action(
    db: Session,
    leave: LeaveRequest,
    employee: User,
    current_user: User,
    action: str,
):
    """
    Wrapper used after Manager/Admin actions.
    """

    notify_leave_action(
        db=db,
        employee=employee,
        action_by=current_user,
        action=action,
    )

    create_leave_audit_log(
        db=db,
        leave=leave,
        current_user=current_user,
        action=action,
    )

