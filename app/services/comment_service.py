
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.comment import Comment
from app.models.task import Task
from app.models.user import User
from app.models.audit_log import AuditLog

from app.schemas.comment_schema import (
    CommentCreate,
    CommentResponse,
)


# -----------------------------------------
# ROLE HELPERS
# -----------------------------------------

def normalize_role(role: str | None) -> str:
    return (
        (role or "")
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


# -----------------------------------------
# USER DETAILS HELPERS
# -----------------------------------------

def get_user_name(user: User) -> str:
    """
    Get a non-empty display name from the user model.
    The current project uses user.name in comment responses.
    """
    name = (
        getattr(user, "name", None)
        or getattr(user, "user_name", None)
        or getattr(user, "full_name", None)
        or getattr(user, "email", None)
    )

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Current user does not have a name or email configured.",
        )

    return str(name)


def get_user_role(user: User) -> str:
    role = getattr(user, "role", None)

    if not role:
        raise HTTPException(
            status_code=400,
            detail="Current user does not have a role configured.",
        )

    # Supports both string roles and enum-based roles.
    return str(getattr(role, "value", role))


# -----------------------------------------
# TASK ACCESS VALIDATION
# -----------------------------------------

def validate_task_access(task: Task, current_user: User):
    """
    Admin: access all tasks.
    Manager / Team Leader: tasks they created or are assigned to.
    Employee: only tasks assigned to them.
    """

    role = normalize_role(current_user.role)

    if is_admin(current_user):
        return

    if role in {"manager", "team_leader", "teamleader"}:
        if (
            task.created_by_id == current_user.id
            or task.assigned_to_id == current_user.id
        ):
            return

        raise HTTPException(
            status_code=403,
            detail="You do not have permission to access this task.",
        )

    if role == "employee":
        if task.assigned_to_id == current_user.id:
            return

        raise HTTPException(
            status_code=403,
            detail="You can only access tasks assigned to you.",
        )

    raise HTTPException(
        status_code=403,
        detail="Your role is not authorized to access this task.",
    )


# -----------------------------------------
# ADD COMMENT + AUDIT LOG
# -----------------------------------------

def add_comment(
    db: Session,
    task_id: int,
    comment_data: CommentCreate,
    current_user: User,
):
    task = (
        db.query(Task)
        .filter(Task.id == task_id)
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found.",
        )

    validate_task_access(task, current_user)

    if (
        comment_data.is_internal
        and not is_manager_or_admin(current_user)
    ):
        raise HTTPException(
            status_code=403,
            detail="Only managers and admins can create internal comments.",
        )

    content = comment_data.content.strip()

    if not content:
        raise HTTPException(
            status_code=422,
            detail="Comment cannot be empty.",
        )

    # Resolve actual user details before inserting records.
    user_name = get_user_name(current_user)
    user_role = get_user_role(current_user)

    try:
        comment = Comment(
            task_id=task.id,
            user_id=current_user.id,
            content=content,
            is_internal=comment_data.is_internal,
        )

        db.add(comment)
        db.flush()

        comment_type = (
            "INTERNAL"
            if comment_data.is_internal
            else "PUBLIC"
        )

        audit_log = AuditLog(
            user_id=current_user.id,
            user_name=user_name,
            user_role=user_role,
            action=f"COMMENT_ADDED_{comment_type}",
            entity="Comment",
            entity_id=comment.id,
            description=f"{comment_type.title()} comment added to task {task.id}",
        )

        db.add(audit_log)

        # Save comment and audit record in one transaction.
        db.commit()
        db.refresh(comment)

    except Exception:
        db.rollback()
        raise

    return {
        "message": "Comment added successfully.",
        "comment": CommentResponse(
            id=comment.id,
            task_id=comment.task_id,
            user_id=current_user.id,
            user_name=user_name,
            content=comment.content,
            is_internal=comment.is_internal,
            created_at=comment.created_at,
        ),
    }


# -----------------------------------------
# GET COMMENTS WITH ACCESS VALIDATION
# -----------------------------------------

def get_task_comments(
    db: Session,
    task_id: int,
    current_user: User,
):
    task = (
        db.query(Task)
        .filter(Task.id == task_id)
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found.",
        )

    validate_task_access(task, current_user)

    comments = (
        db.query(Comment)
        .filter(Comment.task_id == task_id)
        .order_by(Comment.created_at.asc())
        .all()
    )

    response = []

    for comment in comments:
        # Hide internal comments from employees and other
        # roles that are not permitted to view them.
        if (
            comment.is_internal
            and not is_manager_or_admin(current_user)
        ):
            continue

        comment_user = comment.user

        response.append(
            CommentResponse(
                id=comment.id,
                task_id=comment.task_id,
                user_id=comment.user_id,
                user_name=(
                    getattr(comment_user, "name", None)
                    or getattr(comment_user, "user_name", None)
                    or getattr(comment_user, "full_name", None)
                    or getattr(comment_user, "email", None)
                    or "Unknown User"
                ),
                content=comment.content,
                is_internal=comment.is_internal,
                created_at=comment.created_at,
            )
        )

    return response
