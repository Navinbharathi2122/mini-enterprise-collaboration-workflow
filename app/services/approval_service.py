from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.approval import Approval
from app.models.approval_history import ApprovalHistory
from app.models.user import User
from app.schemas.approval_schema import ApprovalCreate, ApprovalAction


def add_history(db: Session, approval_id: int, action_by_id: int, action: str, comment: str = None):
    history = ApprovalHistory(
        approval_id=approval_id,
        action_by_id=action_by_id,
        action=action,
        comment=comment,
    )
    db.add(history)
    db.commit()


def create_approval(db: Session, approval_data: ApprovalCreate, current_user: User):
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

    add_history(
        db,
        approval.id,
        current_user.id,
        "submitted",
        "Approval request submitted.",
    )

    return approval


def get_all_approvals(db: Session, current_user: User):

    # ADMIN -> See all approvals
    if current_user.role == "admin":
        approvals = (
            db.query(Approval)
            .order_by(Approval.created_at.desc())
            .all()
        )

    # MANAGER -> See Pending + Hold + Manager Approved + Rejected
    elif current_user.role == "manager":

    # Manager can see ALL approval requests in the company
     approvals = (
        db.query(Approval)
        .order_by(Approval.created_at.desc())
        .all()
    )

    # EMPLOYEE -> See only own approvals
    else:
        approvals = (
            db.query(Approval)
            .filter(Approval.requested_by_id == current_user.id)
            .order_by(Approval.created_at.desc())
            .all()
        )

    # Attach names
    for approval in approvals:
        requester = db.query(User).filter(User.id == approval.requested_by_id).first()
        approver = db.query(User).filter(User.id == approval.approved_by_id).first() if approval.approved_by_id else None

        approval.requested_by_name = requester.name if requester else "Employee"
        approval.approved_by_name = approver.name if approver else None

    return approvals


def get_approval_by_id(db: Session, approval_id: int):
    approval = db.query(Approval).filter(Approval.id == approval_id).first()

    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found.")

    return approval


def take_approval_action(db: Session, approval_id: int, approval_action: ApprovalAction, current_user: User):
    approval = get_approval_by_id(db, approval_id)

    action = approval_action.action.lower().strip()

    if current_user.role not in ["manager", "admin"]:
        raise HTTPException(status_code=403, detail="Only Manager or Admin can perform approval actions.")

    if action not in ["approve", "reject", "hold", "resume"]:
        raise HTTPException(status_code=400, detail="Invalid action.")

    if approval.status in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail=f"Approval already {approval.status}.")

    # ===================== MANAGER =====================
    if current_user.role == "manager":

        if approval.current_level != "manager":
            raise HTTPException(status_code=403, detail="Waiting for Admin approval.")

        if action == "hold":
            approval.status = "hold"
            approval.approved_by_id = current_user.id

            add_history(
                db,
                approval.id,
                current_user.id,
                "manager_hold",
                approval_action.comment or "Approval kept on hold.",
            )

        elif action == "resume":
            if approval.status != "hold":
                raise HTTPException(status_code=400, detail="Only hold requests can be resumed.")

            approval.status = "pending"

            add_history(
                db,
                approval.id,
                current_user.id,
                "manager_resume",
                approval_action.comment or "Approval resumed.",
            )

        elif action == "reject":
            if not approval_action.comment:
                raise HTTPException(status_code=400, detail="Rejection comment is required.")

            approval.status = "rejected"
            approval.approved_by_id = current_user.id

            add_history(
                db,
                approval.id,
                current_user.id,
                "manager_rejected",
                approval_action.comment,
            )

        elif action == "approve":
            # Move request to Admin
            approval.status = "manager_approved"
            approval.current_level = "admin"
            approval.approved_by_id = current_user.id

            add_history(
                db,
                approval.id,
                current_user.id,
                "manager_approved",
                approval_action.comment or "Manager approved request.",
            )

    # ===================== ADMIN =====================
    elif current_user.role == "admin":

        if approval.current_level != "admin":
            raise HTTPException(status_code=403, detail="This request is not waiting for Admin approval.")

        if action == "hold":
            approval.status = "hold"
            approval.approved_by_id = current_user.id

            add_history(
                db,
                approval.id,
                current_user.id,
                "admin_hold",
                approval_action.comment or "Approval kept on hold by Admin.",
            )

        elif action == "resume":
            if approval.status != "hold":
                raise HTTPException(status_code=400, detail="Only hold requests can be resumed.")

            approval.status = "manager_approved"

            add_history(
                db,
                approval.id,
                current_user.id,
                "admin_resume",
                approval_action.comment or "Approval resumed by Admin.",
            )

        elif action == "reject":
            if not approval_action.comment:
                raise HTTPException(status_code=400, detail="Rejection comment is required.")

            approval.status = "rejected"
            approval.approved_by_id = current_user.id

            add_history(
                db,
                approval.id,
                current_user.id,
                "admin_rejected",
                approval_action.comment,
            )

        elif action == "approve":
            approval.status = "approved"
            approval.current_level = "completed"
            approval.approved_by_id = current_user.id

            add_history(
                db,
                approval.id,
                current_user.id,
                "admin_approved",
                approval_action.comment or "Admin approved request.",
            )

    db.commit()
    db.refresh(approval)

    requester = db.query(User).filter(User.id == approval.requested_by_id).first()
    approver = db.query(User).filter(User.id == approval.approved_by_id).first() if approval.approved_by_id else None

    approval.requested_by_name = requester.name if requester else "Employee"
    approval.approved_by_name = approver.name if approver else None

    return approval


def get_approval_history(db: Session, approval_id: int):
    approval = get_approval_by_id(db, approval_id)

    history = (
        db.query(ApprovalHistory)
        .filter(ApprovalHistory.approval_id == approval.id)
        .order_by(ApprovalHistory.created_at.asc())
        .all()
    )

    for item in history:
        user = db.query(User).filter(User.id == item.action_by_id).first()

        item.action_by_name = user.name if user else "Unknown User"
        item.action_by_role = user.role if user else "Unknown"

    return history