from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.approval import Approval
from app.models.approval_history import ApprovalHistory
from app.models.user import User

from app.schemas.approval_schema import (
    ApprovalCreate,
    ApprovalAction,
)

# =====================================================
# CENTRALIZED NOTIFICATION SERVICE
# =====================================================

from app.services.notification_service import (
    notify_approval_submission,
    notify_approval_action,
)

# =====================================================
# APPROVAL HISTORY HELPER
# =====================================================

def add_history(
    db: Session,
    approval_id: int,
    action_by_id: int,
    action: str,
    comment: str = None,
):
    history = ApprovalHistory(
        approval_id=approval_id,
        action_by_id=action_by_id,
        action=action,
        comment=comment,
    )

    db.add(history)
    db.commit()


# =====================================================
# CREATE APPROVAL REQUEST
# =====================================================

def create_approval(
    db: Session,
    approval_data: ApprovalCreate,
    current_user: User,
):
    """
    Employee creates approval request.

    Enterprise Notifications
    ------------------------
    Employee  -> Confirmation notification.
    Managers  -> New approval request.
    Admins    -> New approval request.
    """

    approval = Approval(
        title=approval_data.title,
        description=approval_data.description,
        requested_by_id=current_user.id,
        status="pending",
        current_level="manager",
    )

    db.add(approval)
    db.commit()
    db.refresh(approval)

    # Save approval history
    add_history(
        db=db,
        approval_id=approval.id,
        action_by_id=current_user.id,
        action="submitted",
        comment="Approval request submitted.",
    )

    # ==========================================
    # ENTERPRISE NOTIFICATIONS
    # ==========================================

    notify_approval_submission(
        db=db,
        employee=current_user,
        approval_title=approval.title,
    )

    return approval

# =====================================================
# MANAGER / ADMIN APPROVAL ACTIONS
# =====================================================

def take_approval_action(
    db: Session,
    approval_id: int,
    approval_action: ApprovalAction,
    current_user: User,
):
    """
    Enterprise Approval Workflow

    Employee -> Manager -> Admin
    """

    approval = get_approval_by_id(db, approval_id)
    action = approval_action.action.strip().lower()

    if current_user.role.lower() not in ["manager", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="Only Manager or Admin can perform approval actions.",
        )

    employee = (
        db.query(User)
        .filter(User.id == approval.requested_by_id)
        .first()
    )

    # =====================================================
    # MANAGER WORKFLOW
    # =====================================================

    if current_user.role.lower() == "manager":

        if approval.current_level != "manager":
            raise HTTPException(
                status_code=400,
                detail="Already forwarded to Admin."
            )

        # Manager Approve
        if action == "approve":

            approval.status = "manager_approved"
            approval.current_level = "admin"

            history_action = "manager_approved"
            history_comment = (
                approval_action.comment
                or "Manager approved request."
            )

        # Manager Reject
        elif action == "reject":

            approval.status = "rejected"
            approval.current_level = "completed"

            history_action = "manager_rejected"
            history_comment = (
                approval_action.comment
                or "Manager rejected request."
            )

        # Manager Hold
        elif action == "hold":

            approval.status = "hold"
            approval.current_level = "manager"

            history_action = "manager_hold"
            history_comment = (
                approval_action.comment
                or "Manager put request on hold."
            )

        # Manager Resume
        elif action == "resume":

            if approval.status != "hold":
                raise HTTPException(
                    status_code=400,
                    detail="Only hold requests can be resumed."
                )

            approval.status = "pending"
            approval.current_level = "manager"

            history_action = "manager_resume"
            history_comment = (
                approval_action.comment
                or "Manager resumed request."
            )

        else:
            raise HTTPException(400, detail="Invalid Manager action.")

    # =====================================================
    # ADMIN WORKFLOW
    # =====================================================

    elif current_user.role.lower() == "admin":

        # Admin cannot touch pending manager request
        if approval.current_level != "admin":
            raise HTTPException(
                status_code=400,
                detail="Waiting for Manager approval first."
            )

        # Admin can approve only Manager Approved / Hold
        if approval.status not in ["manager_approved", "hold"]:
            raise HTTPException(
                status_code=400,
                detail="Admin cannot process this request."
            )

        # Final Approve
        if action == "approve":

            approval.status = "approved"
            approval.current_level = "completed"

            history_action = "admin_approved"
            history_comment = (
                approval_action.comment
                or "Admin approved request."
            )

        # Final Reject
        elif action == "reject":

            approval.status = "rejected"
            approval.current_level = "completed"

            history_action = "admin_rejected"
            history_comment = (
                approval_action.comment
                or "Admin rejected request."
            )

        # Hold by Admin
        elif action == "hold":

            approval.status = "hold"
            approval.current_level = "admin"

            history_action = "admin_hold"
            history_comment = (
                approval_action.comment
                or "Admin put request on hold."
            )

        # Resume by Admin
        elif action == "resume":

            if approval.status != "hold":
                raise HTTPException(
                    status_code=400,
                    detail="Only hold requests can be resumed."
                )

            approval.status = "manager_approved"
            approval.current_level = "admin"

            history_action = "admin_resume"
            history_comment = (
                approval_action.comment
                or "Admin resumed request."
            )

        else:
            raise HTTPException(400, detail="Invalid Admin action.")

    # =====================================================
    # SAVE
    # =====================================================

    approval.approved_by_id = current_user.id

    db.commit()
    db.refresh(approval)

    add_history(
        db=db,
        approval_id=approval.id,
        action_by_id=current_user.id,
        action=history_action,
        comment=history_comment,
    )

    notify_approval_action(
        db=db,
        employee=employee,
        action_by=current_user,
        approval_title=approval.title,
        action=action,
    )

    requester = (
        db.query(User)
        .filter(User.id == approval.requested_by_id)
        .first()
    )

    approver = (
        db.query(User)
        .filter(User.id == approval.approved_by_id)
        .first()
    )

    approval.requested_by_name = requester.name if requester else "Employee"
    approval.approved_by_name = approver.name if approver else None

    return approval
    # ==========================================
    # ENTERPRISE NOTIFICATIONS
    # ==========================================

    notify_approval_action(
        db=db,
        employee=employee,
        action_by=current_user,
        approval_title=approval.title,
        action=action,
    )

    requester = (
        db.query(User)
        .filter(User.id == approval.requested_by_id)
        .first()
    )

    approver = (
        db.query(User)
        .filter(User.id == approval.approved_by_id)
        .first()
    )

    approval.requested_by_name = requester.name if requester else "Employee"
    approval.approved_by_name = approver.name if approver else None

    return approval
# =====================================================
# GET ALL APPROVAL REQUESTS
# =====================================================

def get_all_approvals(db: Session, current_user: User):

    role = (current_user.role or "").strip().lower()

    query = db.query(Approval)

    if role == "employee":
        query = query.filter(
            Approval.requested_by_id == current_user.id
        )

    approvals = query.order_by(
        Approval.created_at.desc()
    ).all()

    for approval in approvals:
     requester = (
        db.query(User)
        .filter(User.id == approval.requested_by_id)
        .first()
    )

    approver = (
        db.query(User)
        .filter(User.id == approval.approved_by_id)
        .first()
        if approval.approved_by_id
        else None
    )

    approval.requested_by_name = requester.name if requester else "Employee"
    approval.requested_by_role = requester.role if requester else "employee"
    approval.approved_by_name = approver.name if approver else None
        # Normalize values for React
    approval.status = (approval.status or "").strip().lower()
    approval.current_level = (approval.current_level or "").strip().lower()

    return approvals

# =====================================================
# GET SINGLE APPROVAL REQUEST
# =====================================================

def get_approval_by_id(
    db: Session,
    approval_id: int,
):
    approval = (
        db.query(Approval)
        .filter(Approval.id == approval_id)
        .first()
    )

    if not approval:
        raise HTTPException(
            status_code=404,
            detail="Approval request not found.",
        )

    requester = (
        db.query(User)
        .filter(User.id == approval.requested_by_id)
        .first()
    )

    approver = (
        db.query(User)
        .filter(User.id == approval.approved_by_id)
        .first()
        if approval.approved_by_id
        else None
    )

    approval.requested_by_name = (
        requester.name if requester else "Employee"
    )

    approval.approved_by_name = (
        approver.name if approver else None
    )

    return approval


# =====================================================
# GET APPROVAL HISTORY
# =====================================================

def get_approval_history(
    db: Session,
    approval_id: int,
):
    history = (
        db.query(ApprovalHistory)
        .filter(
            ApprovalHistory.approval_id == approval_id
        )
        .order_by(ApprovalHistory.created_at.desc())
        .all()
    )

    for item in history:

        user = (
            db.query(User)
            .filter(User.id == item.action_by_id)
            .first()
        )

        item.action_by_name = (
            user.name if user else "Unknown User"
        )

        item.action_by_role = (
            user.role if user else "Unknown"
        )

    return history


# =====================================================
# APPROVAL DASHBOARD STATISTICS
# =====================================================

def get_approval_statistics(
    db: Session,
    current_user: User,
):
    """
    Dashboard Approval Statistics
    """

    role = (current_user.role or "").strip().lower()

    query = db.query(Approval)

    if role == "employee":
        query = query.filter(
            Approval.requested_by_id == current_user.id
        )

    approvals = query.all()

    stats = {
        "total_requests": len(approvals),
        "pending": 0,
        "manager_approved": 0,
        "approved": 0,
        "rejected": 0,
        "hold": 0,
    }

    for approval in approvals:

        status = (approval.status or "").lower()

        if status in stats:
            stats[status] += 1

    return stats


# =====================================================
# GET PENDING APPROVALS
# =====================================================

def get_pending_approvals(
    db: Session,
    current_user: User,
):
    """
    Manager -> Pending manager approvals.
    Admin   -> Pending admin approvals.
    """

    role = (current_user.role or "").strip().lower()

    if role == "manager":
        pending = (
            db.query(Approval)
            .filter(
                Approval.current_level == "manager"
            )
            .order_by(Approval.created_at.desc())
            .all()
        )

    elif role == "admin":
        pending = (
            db.query(Approval)
            .filter(
                Approval.current_level == "admin"
            )
            .order_by(Approval.created_at.desc())
            .all()
        )

    else:
        raise HTTPException(
            status_code=403,
            detail="Employees cannot access pending approvals.",
        )

    return pending


# =====================================================
# GET RECENT APPROVALS
# =====================================================

def get_recent_approvals(
    db: Session,
    current_user: User,
    limit: int = 5,
):
    role = current_user.role.lower()

    query = db.query(Approval)

    if role == "employee":
        query = query.filter(Approval.requested_by_id == current_user.id)

    approvals = (
        query.order_by(Approval.created_at.desc())
        .limit(limit)
        .all()
    )

    for approval in approvals:
        requester = (
            db.query(User)
            .filter(User.id == approval.requested_by_id)
            .first()
        )

        approval.requested_by_name = requester.name if requester else "Employee"
        approval.requested_by_role = requester.role if requester else "employee"

    return approvals