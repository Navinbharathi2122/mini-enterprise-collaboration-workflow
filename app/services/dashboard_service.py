from sqlalchemy.orm import Session

from app.models.user import User
from app.models.task import Task


def get_dashboard_stats(db: Session, current_user: User):

    if current_user.role == "admin":

        total_users = db.query(User).count()

        total_tasks = db.query(Task).count()

        completed_tasks = (
            db.query(Task)
            .filter(Task.status == "completed")
            .count()
        )

        pending_tasks = (
            db.query(Task)
            .filter(Task.status.in_(["pending", "in_progress"]))
            .count()
        )

        return {
            "total_users": total_users,
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "pending_tasks": pending_tasks,
        }

    elif current_user.role == "manager":

        # Managers can see employees count
        total_users = (
            db.query(User)
            .filter(User.role == "employee")
            .count()
        )

        # Only tasks created by manager
        total_tasks = (
            db.query(Task)
            .filter(Task.created_by_id == current_user.id)
            .count()
        )

        completed_tasks = (
            db.query(Task)
            .filter(
                Task.created_by_id == current_user.id,
                Task.status == "completed"
            )
            .count()
        )

        pending_tasks = (
            db.query(Task)
            .filter(
                Task.created_by_id == current_user.id,
                Task.status.in_(["pending", "in_progress"])
            )
            .count()
        )

        return {
            "total_users": total_users,
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "pending_tasks": pending_tasks,
        }

    # ======================================================
    # EMPLOYEE DASHBOARD
    # ======================================================
    else:

        # Employee dashboard doesn't show all users
        total_users = 1

        # Only assigned tasks
        total_tasks = (
            db.query(Task)
            .filter(Task.assigned_to_id == current_user.id)
            .count()
        )

        completed_tasks = (
            db.query(Task)
            .filter(
                Task.assigned_to_id == current_user.id,
                Task.status == "completed"
            )
            .count()
        )

        pending_tasks = (
            db.query(Task)
            .filter(
                Task.assigned_to_id == current_user.id,
                Task.status.in_(["pending", "in_progress"])
            )
            .count()
        )

        return {
            "total_users": total_users,
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "pending_tasks": pending_tasks,
        }