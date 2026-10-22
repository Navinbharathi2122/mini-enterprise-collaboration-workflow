
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.approval import Approval
from app.models.approval_history import ApprovalHistory
from app.models.user import User
from app.schemas.approval_schema import ApprovalCreate, ApprovalAction

from app.services.notification_service import (
    notify_approval_submission,
    notify_approval_action,
)


# =====================================================
# APPROVAL HISTORY
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
    db.refresh(history)
    return history


# =====================================================
# CREATE APPROVAL
# Employee -> Manager -> Admin
# Manager -> Direct Admin
# Admin cannot create
# =====================================================

def create_approval(
    db: Session,
    approval_data: ApprovalCreate,
    current_user: User,
):
    role = (current_user.role or "").strip().lower()

    if role == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin cannot create approval requests.",
        )

    if role not in ("employee", "manager"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Employee or Manager can create requests.",
        )

    current_level = "manager" if role == "employee" else "admin"

    approval = Approval(
        title=approval_data.title,
        description=approval_data.description,
        requested_by_id=current_user.id,
        status="pending",
        current_level=current_level,
    )

    try:
        db.add(approval)
        db.flush()

        db.add(
            ApprovalHistory(
                approval_id=approval.id,
                action_by_id=current_user.id,
                action="submitted",
                comment="Approval request submitted.",
            )
        )

        db.commit()
        db.refresh(approval)

    except Exception:
        db.rollback()
        raise

    # Existing notification service is called here.
    # Role-specific notification routing is a separate update.
    notify_approval_submission(
        db=db,
        employee=current_user,
        approval_title=approval.title,
    )

    return approval


# =====================================================
# GET APPROVAL BY ID
# =====================================================

def get_approval_by_id(db: Session, approval_id: int):
    approval = (
        db.query(Approval)
        .filter(Approval.id == approval_id)
        .first()
    )

    if not approval:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
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
        requester.name if requester else "Unknown User"
    )
    approval.requested_by_role = (
        requester.role if requester else "unknown"
    )
    approval.approved_by_name = (
        approver.name if approver else None
    )

    return approval


# =====================================================
# APPROVE / REJECT / HOLD / RESUME
# =====================================================

def take_approval_action(
    db: Session,
    approval_id: int,
    approval_action: ApprovalAction,
    current_user: User,
):
    role = (current_user.role or "").strip().lower()
    action = (approval_action.action or "").strip().lower()

    if role not in ("manager", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Manager or Admin can perform approval actions.",
        )

    approval = (
        db.query(Approval)
        .filter(Approval.id == approval_id)
        .first()
    )

    if not approval:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Approval request not found.",
        )

    requester = (
        db.query(User)
        .filter(User.id == approval.requested_by_id)
        .first()
    )

    if not requester:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request creator not found.",
        )

    requester_role = (requester.role or "").strip().lower()

    if requester.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot approve your own request.",
        )

    if approval.current_level == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This request is already completed.",
        )

    history_action = ""
    history_comment = approval_action.comment

    # -------------------------------------------------
    # MANAGER ACTIONS
    # -------------------------------------------------

    if role == "manager":

        # Manager can process employee requests only.
        if approval.current_level != "manager":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This request is not awaiting Manager approval.",
            )

        if requester_role != "employee":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Manager cannot approve this request.",
            )

        if approval.status not in ("pending", "hold"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Request is not available for Manager action.",
            )

        if action == "approve":
            approval.status = "manager_approved"
            approval.current_level = "admin"
            history_action = "manager_approved"
            history_comment = history_comment or "Manager approved request."

        elif action == "reject":
            approval.status = "rejected"
            approval.current_level = "completed"
            history_action = "manager_rejected"
            history_comment = history_comment or "Manager rejected request."

        elif action == "hold":
            approval.status = "hold"
            approval.current_level = "manager"
            history_action = "manager_hold"
            history_comment = history_comment or "Manager put request on hold."

        elif action == "resume":
            if approval.status != "hold":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Only held requests can be resumed.",
                )

            approval.status = "pending"
            approval.current_level = "manager"
            history_action = "manager_resume"
            history_comment = history_comment or "Manager resumed request."

        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Manager action.",
            )

    # -------------------------------------------------
    # ADMIN ACTIONS
    # -------------------------------------------------

    else:
        if approval.current_level != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This request is not awaiting Admin approval.",
            )

        # A manager-created request reaches Admin as pending.
        # An employee-created request reaches Admin as manager_approved.
        allowed_statuses = ["manager_approved", "hold"]

        if requester_role == "manager":
            allowed_statuses.append("pending")

        if approval.status not in allowed_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Request is not available for Admin action.",
            )

        if action == "approve":
            approval.status = "approved"
            approval.current_level = "completed"
            history_action = "admin_approved"
            history_comment = history_comment or "Admin approved request."

        elif action == "reject":
            approval.status = "rejected"
            approval.current_level = "completed"
            history_action = "admin_rejected"
            history_comment = history_comment or "Admin rejected request."

        elif action == "hold":
            approval.status = "hold"
            approval.current_level = "admin"
            history_action = "admin_hold"
            history_comment = history_comment or "Admin put request on hold."

        elif action == "resume":
            if approval.status != "hold":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Only held requests can be resumed.",
                )

            if requester_role == "manager":
                approval.status = "pending"
            else:
                approval.status = "manager_approved"

            approval.current_level = "admin"
            history_action = "admin_resume"
            history_comment = history_comment or "Admin resumed request."

        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Admin action.",
            )

    try:
        # approved_by_id records the latest actor in the existing model.
        approval.approved_by_id = current_user.id

        db.add(
            ApprovalHistory(
                approval_id=approval.id,
                action_by_id=current_user.id,
                action=history_action,
                comment=history_comment,
            )
        )

        db.commit()
        db.refresh(approval)

    except Exception:
        db.rollback()
        raise

    # Notify the requester and relevant roles through the existing service.
    notify_approval_action(
        db=db,
        employee=requester,
        action_by=current_user,
        approval_title=approval.title,
        action=action,
    )

    return get_approval_by_id(db, approval.id)


# =====================================================
# GET ALL APPROVALS
# =====================================================

def get_all_approvals(db: Session, current_user: User, page: int = 1, limit: int = 20, status_filter: str | None = None, sort_order: str = "desc"):
    role = (current_user.role or "").strip().lower()
    query = db.query(Approval).options(
        joinedload(Approval.requested_by),
        joinedload(Approval.approved_by),
    )
    if role == "employee":
        query = query.filter(Approval.requested_by_id == current_user.id)
    elif role not in ("manager", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Role is not allowed to view approvals.")
    if status_filter:
        query = query.filter(Approval.status == status_filter.strip().lower())
    query = query.order_by(Approval.created_at.asc() if sort_order == "asc" else Approval.created_at.desc())
    approvals = query.offset((page - 1) * limit).limit(limit).all()
    for approval in approvals:
        requester = approval.requested_by
        approver = approval.approved_by
        approval.requested_by_name = requester.name if requester else "Unknown User"
        approval.requested_by_role = requester.role if requester else "unknown"
        approval.approved_by_name = approver.name if approver else None
        approval.status = (approval.status or "").strip().lower()
        approval.current_level = (approval.current_level or "").strip().lower()
    return approvals


def get_approval_history(
    db: Session,
    approval_id: int,
):
    approval = (
        db.query(Approval)
        .filter(Approval.id == approval_id)
        .first()
    )

    if approval is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Approval request not found.",
        )

    return (
        db.query(ApprovalHistory)
        .filter(ApprovalHistory.approval_id == approval_id)
        .order_by(ApprovalHistory.created_at.asc())
        .all()
    )
