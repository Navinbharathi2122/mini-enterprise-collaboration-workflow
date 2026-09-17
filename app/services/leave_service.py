from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.leave_request import LeaveRequest
from app.models.leave_history import LeaveHistory
from app.models.user import User



def create_leave_request(db, leave_data, current_user):
    days = (leave_data.end_date - leave_data.start_date).days + 1

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

    
    leave.requested_by_name = current_user.name
    leave.requested_by_role = current_user.role

    return leave


def get_all_leave_requests(db: Session, current_user: User):
    if current_user.role == "employee":
        return (
            db.query(LeaveRequest)
            .filter(LeaveRequest.requested_by == current_user.id)
            .order_by(LeaveRequest.created_at.desc())
            .all()
        )

    return (
        db.query(LeaveRequest)
        .order_by(LeaveRequest.created_at.desc())
        .all()
    )


def get_leave_by_id(db: Session, leave_request_id: int):
    leave = (
        db.query(LeaveRequest)
        .filter(LeaveRequest.id == leave_request_id)
        .first()
    )

    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")

    return leave




def take_leave_action(db, leave_request_id, leave_action, current_user):
    leave = db.query(LeaveRequest).filter(
        LeaveRequest.id == leave_request_id
    ).first()

    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")

    action = leave_action.action.lower()

    
    if current_user.role == "manager":
        if action == "approve":
            leave.status = "manager_approved"
            leave.current_level = "admin"

        elif action == "hold":
            leave.status = "hold"

        elif action == "reject":
            leave.status = "rejected"
            leave.current_level = "completed"

        elif action == "resume":
            leave.status = "pending"


    elif current_user.role == "admin":
        if action == "approve":
            leave.status = "approved"
            leave.current_level = "completed"

        elif action == "hold":
            leave.status = "hold"

        elif action == "reject":
            leave.status = "rejected"
            leave.current_level = "completed"

        elif action == "resume":
            leave.status = "manager_approved"


    history = LeaveHistory(
        leave_request_id=leave.id,
        action_by_id=current_user.id,
        action_by_role=current_user.role,   
        action=action,
        comment=leave_action.comment,
    )

    db.add(history)
    db.commit()
    db.refresh(leave)

   
    user = db.query(User).filter(User.id == leave.requested_by).first()

    leave.requested_by_name = user.name
    leave.requested_by_role = user.role

    return leave


def get_leave_history(db: Session, leave_request_id: int):
    return (
        db.query(LeaveHistory)
        .filter(LeaveHistory.leave_request_id == leave_request_id)
        .order_by(LeaveHistory.created_at.desc())
        .all()
    )