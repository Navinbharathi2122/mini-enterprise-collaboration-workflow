from sqlalchemy.orm import Session

from app.models.user import User
from app.models.task import Task
from app.models.leave_request import LeaveRequest
from app.models.approval import Approval


# ==========================================
# Dashboard Summary
# ==========================================
def get_dashboard_summary(db: Session, current_user: User):

    # ----- Users -----
    if current_user.role == "admin":
        total_users = db.query(User).count()
        task_query = db.query(Task)
        approval_query = db.query(Approval)
        leave_query = db.query(LeaveRequest)

    elif current_user.role == "manager":
        total_users = db.query(User).filter(User.role == "employee").count()

        task_query = db.query(Task).filter(
            Task.created_by_id == current_user.id
        )

        approval_query = db.query(Approval).filter(
            Approval.approver_id == current_user.id
        )

        leave_query = db.query(LeaveRequest).filter(
            LeaveRequest.manager_id == current_user.id
        )

    else:
        total_users = 1

        task_query = db.query(Task).filter(
            Task.assigned_to_id == current_user.id
        )

        approval_query = db.query(Approval).filter(
            Approval.requested_by_id == current_user.id
        )

        leave_query = db.query(LeaveRequest).filter(
            LeaveRequest.employee_id == current_user.id
        )

    # ----- Task Counts -----
    total_tasks = task_query.count()

    todo_tasks = task_query.filter(Task.status == "todo").count()
    in_progress_tasks = task_query.filter(Task.status == "in_progress").count()
    review_tasks = task_query.filter(Task.status == "review").count()
    done_tasks = task_query.filter(Task.status == "done").count()

    completed_tasks = done_tasks
    pending_tasks = total_tasks - done_tasks

    # ----- Approval Counts -----
    pending_approvals = approval_query.filter(
        Approval.status == "pending"
    ).count()

    approved_requests = approval_query.filter(
        Approval.status == "approved"
    ).count()

    rejected_requests = approval_query.filter(
        Approval.status == "rejected"
    ).count()

    # ----- Leave Count -----
    leave_requests = leave_query.count()

    return {
        "total_users": total_users,
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "pending_tasks": pending_tasks,
        "todo_tasks": todo_tasks,
        "in_progress_tasks": in_progress_tasks,
        "review_tasks": review_tasks,
        "done_tasks": done_tasks,
        "pending_approvals": pending_approvals,
        "approved_requests": approved_requests,
        "rejected_requests": rejected_requests,
        "leave_requests": leave_requests,
    }


# ==========================================
# Task Distribution (REQUIRED by dashboard_router.py)
# ==========================================
def get_task_distribution(db: Session, current_user: User):

    if current_user.role == "employee":
        tasks = db.query(Task).filter(
            Task.assigned_to_id == current_user.id
        ).all()

    elif current_user.role == "manager":
        tasks = db.query(Task).filter(
            Task.created_by_id == current_user.id
        ).all()

    else:
        tasks = db.query(Task).all()

    distribution = {
        "todo": 0,
        "in_progress": 0,
        "review": 0,
        "done": 0,
    }

    for task in tasks:
        status = (task.status or "").lower()

        if status in distribution:
            distribution[status] += 1

    return distribution