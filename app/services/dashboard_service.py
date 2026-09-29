from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.user import User
from app.models.task import Task
from app.models.leave_request import LeaveRequest
from app.models.approval import Approval
from app.models.notification import Notification


# ==========================================================
# DASHBOARD SUMMARY
# ==========================================================

def get_dashboard_summary(db: Session, current_user: User):

    role = (current_user.role or "").strip().lower()

    # ---------------- ADMIN ----------------
    if role == "admin":

        total_users = db.query(User).count()

        task_query = db.query(Task)
        approval_query = db.query(Approval)
        leave_query = db.query(LeaveRequest)

    # ---------------- MANAGER ----------------
    elif role == "manager":

        total_users = db.query(User).filter(User.role == "employee").count()

        task_query = db.query(Task).filter(
            Task.created_by_id == current_user.id
        )

        approval_query = db.query(Approval).filter(
            Approval.current_level == "manager"
        )

        leave_query = db.query(LeaveRequest)

    # ---------------- EMPLOYEE ----------------
    else:

        total_users = 1

        # Employee sees only assigned tasks
        task_query = db.query(Task).filter(
            Task.assigned_to_id == current_user.id
        )

        approval_query = db.query(Approval).filter(
            Approval.requested_by_id == current_user.id
        )

        # LeaveRequest model uses requested_by
        leave_query = db.query(LeaveRequest).filter(
            LeaveRequest.requested_by == current_user.id
        )

    # ==========================================================

    total_tasks = task_query.count()

    todo_tasks = task_query.filter(Task.status == "todo").count()

    in_progress_tasks = task_query.filter(
        Task.status == "in_progress"
    ).count()

    review_tasks = task_query.filter(Task.status == "review").count()

    done_tasks = task_query.filter(Task.status == "done").count()

    completed_tasks = done_tasks
    pending_tasks = total_tasks - done_tasks

    pending_approvals = approval_query.filter(
        Approval.status.in_(["pending", "manager_approved"])
    ).count()

    approved_requests = approval_query.filter(
        Approval.status == "approved"
    ).count()

    rejected_requests = approval_query.filter(
        Approval.status == "rejected"
    ).count()

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


# ==========================================================
# TASK DISTRIBUTION
# ==========================================================

def get_task_distribution(db: Session, current_user: User):

    role = (current_user.role or "").strip().lower()

    if role == "admin":

        tasks = db.query(Task).all()

    elif role == "manager":

        tasks = db.query(Task).filter(
            Task.created_by_id == current_user.id
        ).all()

    else:

        tasks = db.query(Task).filter(
            Task.assigned_to_id == current_user.id
        ).all()

    distribution = {
        "todo": 0,
        "in_progress": 0,
        "review": 0,
        "done": 0,
    }

    for task in tasks:

        status = (task.status or "").strip().lower()

        if status in distribution:
            distribution[status] += 1

    return distribution


# ==========================================================
# AI DASHBOARD SUMMARY
# ==========================================================

def get_ai_dashboard_summary(db: Session, current_user: User):

    role = (current_user.role or "").strip().lower()

    # ---------------- ADMIN ----------------
    if role == "admin":

        task_query = db.query(Task)
        approval_query = db.query(Approval)
        leave_query = db.query(LeaveRequest)
        notification_query = db.query(Notification)

    # ---------------- MANAGER ----------------
    elif role == "manager":

        task_query = db.query(Task).filter(
            Task.created_by_id == current_user.id
        )

        approval_query = db.query(Approval).filter(
            Approval.current_level == "manager"
        )

        leave_query = db.query(LeaveRequest)

        notification_query = db.query(Notification).filter(
            Notification.user_id == current_user.id
        )

    # ---------------- EMPLOYEE ----------------
    else:

        task_query = db.query(Task).filter(
            Task.assigned_to_id == current_user.id
        )

        approval_query = db.query(Approval).filter(
            Approval.requested_by_id == current_user.id
        )

        leave_query = db.query(LeaveRequest).filter(
            LeaveRequest.requested_by == current_user.id
        )

        notification_query = db.query(Notification).filter(
            Notification.user_id == current_user.id
        )

    # ==========================================================

    total_tasks = task_query.count()

    completed_tasks = task_query.filter(
        Task.status == "done"
    ).count()

    pending_tasks = task_query.filter(
        Task.status != "done"
    ).count()

    productivity_score = (
        round((completed_tasks / total_tasks) * 100, 2)
        if total_tasks > 0
        else 0
    )

    pending_approvals = approval_query.filter(
        Approval.status.in_(["pending", "manager_approved"])
    ).count()

    unread_notifications = notification_query.filter(
        Notification.is_read == False
    ).count()

    leave_requests = leave_query.count()

    if productivity_score >= 80:
        ai_status = "Excellent Productivity"

    elif productivity_score >= 60:
        ai_status = "Good Productivity"

    elif productivity_score >= 40:
        ai_status = "Average Productivity"

    else:
        ai_status = "Needs Attention"

    ai_message = (
        f"{current_user.name}, you completed "
        f"{completed_tasks} out of {total_tasks} tasks. "
        f"Current productivity is {productivity_score}%."
    )

    return {
        "productivity_score": productivity_score,
        "pending_tasks": pending_tasks,
        "completed_tasks": completed_tasks,
        "pending_approvals": pending_approvals,
        "leave_requests": leave_requests,
        "unread_notifications": unread_notifications,
        "ai_status": ai_status,
        "ai_message": ai_message,
    }