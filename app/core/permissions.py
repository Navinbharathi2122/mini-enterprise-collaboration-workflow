from fastapi import HTTPException, status
from app.models.user import User



def require_admin(current_user: User):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required."
        )
    return current_user


def require_manager_or_admin(current_user: User):
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin or Manager access required."
        )
    return current_user


def require_authenticated_user(current_user: User):
    if current_user.role not in ["admin", "manager", "employee"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied."
        )
    return current_user


def require_employee_or_admin(current_user: User):
    if current_user.role not in ["admin", "employee"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied."
        )
    return current_user


def require_same_user_or_admin(current_user: User, user_id: int):
    if current_user.role == "admin":
        return current_user

    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can access only your own profile."
        )

    return current_user


def require_task_access(current_user: User, task):
    if current_user.role == "admin":
        return current_user

    if current_user.role == "manager":
        if task.created_by_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Managers can access only their own created tasks."
            )
        return current_user

    if current_user.role == "employee":
        if task.assigned_to_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Employees can access only assigned tasks."
            )
        return current_user

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Permission denied."
    )