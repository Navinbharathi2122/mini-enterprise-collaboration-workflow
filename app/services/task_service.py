from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.task import Task
from app.models.user import User

# Import centralized notification service
from app.services.notification_service import (
    notify_task_assignment,
    notify_task_status_update,
    create_notification,
)

from app.schemas.task import TaskCreate, TaskUpdate


# =====================================================
# TASK WORKFLOW
# =====================================================

WORKFLOW = {
    "todo": ["in_progress"],
    "in_progress": ["review"],
    "review": ["done"],
    "done": [],
}


# =====================================================
# STATUS NORMALIZER
# =====================================================

def normalize_status(status: str):
    if not status:
        return "todo"

    status = status.strip().lower()

    mapping = {
        "todo": "todo",
        "to_do": "todo",
        "pending": "todo",

        "in progress": "in_progress",
        "progress": "in_progress",
        "in_progress": "in_progress",

        "review": "review",

        "done": "done",
        "completed": "done",
        "complete": "done",
    }

    return mapping.get(status, "todo")


# =====================================================
# VALIDATE TASK WORKFLOW
# =====================================================

def validate_workflow_transition(current_status: str, new_status: str):

    current_status = normalize_status(current_status)
    new_status = normalize_status(new_status)

    if current_status == new_status:
        return

    allowed = WORKFLOW.get(current_status, [])

    if new_status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid workflow transition: {current_status} ➜ {new_status}",
        )


# =====================================================
# BUILD TASK RESPONSE
# =====================================================

def build_task_response(task: Task):

    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,

        "status": normalize_status(task.status),
        "priority": task.priority.lower() if task.priority else "low",

        "due_date": task.due_date,

        "created_by_id": task.created_by_id,
        "assigned_to_id": task.assigned_to_id,

        "created_by_name": task.created_by.name if task.created_by else None,
        "assigned_to_name": task.assigned_to.name if task.assigned_to else None,

        "created_at": task.created_at,
        "updated_at": task.updated_at,
    }


# =====================================================
# GET TASKS FOR KANBAN BOARD
# =====================================================

def get_kanban_tasks(db: Session, current_user: User):

    role = (current_user.role or "").strip().lower()

    # ADMIN
    if role == "admin":
        tasks = db.query(Task).order_by(Task.created_at.desc()).all()

    # MANAGER
    elif role == "manager":
        tasks = (
            db.query(Task)
            .filter(
                or_(
                    Task.created_by_id == current_user.id,
                    Task.assigned_to_id == current_user.id,
                )
            )
            .order_by(Task.created_at.desc())
            .all()
        )

    # EMPLOYEE
    else:
        tasks = (
            db.query(Task)
            .filter(Task.assigned_to_id == current_user.id)
            .order_by(Task.created_at.desc())
            .all()
        )

    board = {
        "todo": [],
        "in_progress": [],
        "review": [],
        "done": [],
    }

    for task in tasks:
        status = normalize_status(task.status)
        board[status].append(build_task_response(task))

    return board
# =====================================================
# GET ALL TASKS
# =====================================================

def get_tasks(db: Session, current_user: User):

    role = (current_user.role or "").strip().lower()

    print("=" * 60)
    print("CURRENT USER :", current_user.id, current_user.name, role)

    # ADMIN
    if role == "admin":
        tasks = db.query(Task).order_by(Task.created_at.desc()).all()

    # MANAGER
    elif role == "manager":
        tasks = (
            db.query(Task)
            .filter(
                or_(
                    Task.created_by_id == current_user.id,
                    Task.assigned_to_id == current_user.id,
                )
            )
            .order_by(Task.created_at.desc())
            .all()
        )

    # EMPLOYEE
    else:
        tasks = (
            db.query(Task)
            .filter(Task.assigned_to_id == current_user.id)
            .order_by(Task.created_at.desc())
            .all()
        )

    print("TASKS FOUND :", len(tasks))

    return [build_task_response(task) for task in tasks]
# =====================================================
# GET SINGLE TASK
# =====================================================

def get_task_by_id(db: Session, task_id: int, current_user: User):

    task = db.query(Task).filter(Task.id == task_id).first()

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found.",
        )

    role = (current_user.role or "").strip().lower()

    if role == "manager" and task.created_by_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Unauthorized.",
        )

    if role == "employee" and task.assigned_to_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Unauthorized.",
        )

    return build_task_response(task)

# =====================================================
# CREATE TASK (ENTERPRISE NOTIFICATION VERSION)
# =====================================================

def create_task(
    db: Session,
    task_data: TaskCreate,
    current_user: User,
):

    role = (current_user.role or "").strip().lower()

    # Only Admin and Manager can create tasks.
    if role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=403,
            detail="Only Admin or Manager can create tasks.",
        )

    # Validate assigned employee.
    assigned_user = None

    if task_data.assigned_to_id:

        assigned_user = (
            db.query(User)
            .filter(User.id == task_data.assigned_to_id)
            .first()
        )

        if not assigned_user:
            raise HTTPException(
                status_code=404,
                detail="Assigned employee not found.",
            )

        # Manager can assign only Employee.
        if (
            role == "manager"
            and assigned_user.role.lower() != "employee"
        ):
            raise HTTPException(
                status_code=403,
                detail="Manager can assign tasks only to employees.",
            )

    # Create task.
    task = Task(
        title=task_data.title,
        description=task_data.description,
        status=normalize_status(task_data.status),
        priority=task_data.priority.lower().strip(),
        due_date=task_data.due_date,
        assigned_to_id=task_data.assigned_to_id,
        created_by_id=current_user.id,
    )

    db.add(task)
    db.commit()
    db.refresh(task)

    # =====================================================
    # ENTERPRISE NOTIFICATIONS
    # =====================================================

    if assigned_user:
        notify_task_assignment(
            db=db,
            creator=current_user,
            assigned_user=assigned_user,
            task_title=task.title,
        )
    else:
        create_notification(
            db=db,
            user_id=current_user.id,
            title="Task Created Successfully",
            message=f"Task '{task.title}' has been created successfully.",
        )

    # =====================================================
    # RESPONSE
    # =====================================================

    return build_task_response(task)

# =====================================================
# UPDATE TASK STATUS (KANBAN + NOTIFICATIONS)
# =====================================================

def update_task_status(
    task_id: int,
    new_status: str,
    db: Session,
    current_user: User,
):
    task = db.query(Task).filter(Task.id == task_id).first()

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found."
        )

    role = (current_user.role or "").strip().lower()

    # Employee can update only assigned task
    if role == "employee" and task.assigned_to_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can update only your assigned task."
        )

    validate_workflow_transition(task.status, new_status)

    old_status = normalize_status(task.status)
    new_status = normalize_status(new_status)

    task.status = new_status

    db.commit()
    db.refresh(task)

    # ==========================================
    # Notification to Manager/Admin
    # ==========================================

    if task.created_by_id:
        notify_task_status_update(
            db=db,
            creator_id=task.created_by_id,
            employee_id=task.assigned_to_id,
            task_title=task.title,
            status=new_status,
        )

    # ==========================================
    # Notification to Employee
    # ==========================================

    create_notification(
        db=db,
        user_id=task.assigned_to_id,
        title="Task Status Updated",
        message=f"Your task '{task.title}' moved from '{old_status.replace('_',' ').title()}' to '{new_status.replace('_',' ').title()}'.",
    )

    # ==========================================
    # Completed Notification
    # ==========================================

    if new_status == "done":
        create_notification(
            db=db,
            user_id=task.created_by_id,
            title="Task Completed",
            message=f"{current_user.name} completed task '{task.title}'.",
        )

        create_notification(
            db=db,
            user_id=task.assigned_to_id,
            title="Congratulations 🎉",
            message=f"You successfully completed '{task.title}'.",
        )

    return build_task_response(task)

# =====================================================
# UPDATE TASK DETAILS / REASSIGN TASK
# =====================================================

def update_task(
    db: Session,
    task_id: int,
    task_data: TaskUpdate,
    current_user: User,
):
    task = db.query(Task).filter(Task.id == task_id).first()

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found."
        )

    role = (current_user.role or "").strip().lower()

    if role == "manager":
        if (
            task.created_by_id != current_user.id
            and task.assigned_to_id != current_user.id
        ):
            raise HTTPException(
                status_code=403,
                detail="Unauthorized."
            )

    old_status = normalize_status(task.status)
    old_assigned_user = task.assigned_to_id

    # ==========================================
    # Employee can update only status
    # ==========================================

    if role == "employee":

        if task.assigned_to_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Unauthorized."
            )

        validate_workflow_transition(task.status, task_data.status)
        task.status = normalize_status(task_data.status)

    else:

        task.title = task_data.title
        task.description = task_data.description
        task.priority = task_data.priority.lower().strip()
        task.status = normalize_status(task_data.status)
        task.due_date = task_data.due_date
        task.assigned_to_id = task_data.assigned_to_id

    db.commit()
    db.refresh(task)

    # ==========================================
    # Reassigned Notification
    # ==========================================

    if old_assigned_user and old_assigned_user != task.assigned_to_id:
        create_notification(
            db=db,
            user_id=old_assigned_user,
            title="Task Unassigned",
            message=f"Task '{task.title}' is no longer assigned to you.",
        )

    if task.assigned_to_id and old_assigned_user != task.assigned_to_id:
        new_employee = db.query(User).filter(User.id == task.assigned_to_id).first()

        if new_employee:
            notify_task_assignment(
                db=db,
                creator=current_user,
                assigned_user=new_employee,
                task_title=task.title,
            )

    # ==========================================
    # Status Changed Notification
    # ==========================================

    if old_status != normalize_status(task.status):
        create_notification(
            db=db,
            user_id=task.assigned_to_id,
            title="Task Updated",
            message=f"'{task.title}' status changed to '{task.status.replace('_',' ').title()}'.",
        )

    return build_task_response(task)

# =====================================================
# DELETE TASK (ENTERPRISE NOTIFICATIONS)
# =====================================================

def delete_task(
    db: Session,
    task_id: int,
    current_user: User,
):
    task = db.query(Task).filter(Task.id == task_id).first()

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found.",
        )

    role = (current_user.role or "").strip().lower()

    if role == "employee":
        raise HTTPException(
            status_code=403,
            detail="Employees cannot delete tasks.",
        )

    if role == "manager":
     if task.created_by_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Unauthorized."
        )

    assigned_user_id = task.assigned_to_id
    creator_id = task.created_by_id
    task_title = task.title

    # Delete task
    db.delete(task)
    db.commit()

    # ==========================================
    # NOTIFICATIONS
    # ==========================================

    # Notify assigned employee
    if assigned_user_id:
        create_notification(
            db=db,
            user_id=assigned_user_id,
            title="Task Deleted",
            message=f"Task '{task_title}' has been removed by {current_user.role.title()}.",
        )

    # Notify creator if deleted by another admin/manager
    if creator_id and creator_id != current_user.id:
        create_notification(
            db=db,
            user_id=creator_id,
            title="Task Deleted",
            message=f"Task '{task_title}' has been deleted.",
        )

    return {
        "message": "Task deleted successfully."
    }


# =====================================================
# TASK STATISTICS (DASHBOARD SUPPORT)
# =====================================================

def get_task_statistics(db: Session, current_user: User):

    role = (current_user.role or "").strip().lower()

    query = db.query(Task)

    if role == "manager":
        query = query.filter(
            or_(
                Task.created_by_id == current_user.id,
                Task.assigned_to_id == current_user.id,
            )
        )

    elif role == "employee":
        query = query.filter(
            Task.assigned_to_id == current_user.id
        )

    tasks = query.all()

    stats = {
        "total_tasks": len(tasks),
        "todo": 0,
        "in_progress": 0,
        "review": 0,
        "done": 0,
        "high_priority": 0,
        "medium_priority": 0,
        "low_priority": 0,
    }

    for task in tasks:
        status = normalize_status(task.status)

        if status in stats:
            stats[status] += 1

        priority = (task.priority or "").lower()

        if priority == "high":
            stats["high_priority"] += 1
        elif priority == "medium":
            stats["medium_priority"] += 1
        else:
            stats["low_priority"] += 1

    return stats
# =====================================================
# TASK DISTRIBUTION (DASHBOARD CHART SUPPORT)
# =====================================================

def get_task_distribution(
    db: Session,
    current_user: User,
):
    stats = get_task_statistics(db, current_user)

    return {
        "labels": [
            "Todo",
            "In Progress",
            "Review",
            "Done",
        ],
        "values": [
            stats["todo"],
            stats["in_progress"],
            stats["review"],
            stats["done"],
        ],
    }


# =====================================================
# PRIORITY DISTRIBUTION (DASHBOARD CHART SUPPORT)
# =====================================================

def get_priority_distribution(
    db: Session,
    current_user: User,
):
    stats = get_task_statistics(db, current_user)

    return {
        "labels": [
            "High",
            "Medium",
            "Low",
        ],
        "values": [
            stats["high_priority"],
            stats["medium_priority"],
            stats["low_priority"],
        ],
    }


# =====================================================
# RECENT TASKS (DASHBOARD SUPPORT)
# =====================================================

def get_recent_tasks(
    db: Session,
    current_user: User,
    limit: int = 5,
):

    role = (current_user.role or "").strip().lower()

    query = db.query(Task)

    if role == "manager":
        query = query.filter(
            or_(
                Task.created_by_id == current_user.id,
                Task.assigned_to_id == current_user.id,
            )
        )

    elif role == "employee":
        query = query.filter(
            Task.assigned_to_id == current_user.id
        )

    tasks = (
        query.order_by(Task.created_at.desc())
        .limit(limit)
        .all()
    )

    return [build_task_response(task) for task in tasks]