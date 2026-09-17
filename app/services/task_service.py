from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.task import Task
from app.models.user import User
from app.schemas.task import TaskCreate, TaskUpdate


# =====================================================
# WORKFLOW
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

        "in_progress": "in_progress",
        "in progress": "in_progress",
        "progress": "in_progress",

        "review": "review",

        "done": "done",
        "completed": "done",
        "complete": "done",
    }

    return mapping.get(status, "todo")


# =====================================================
# VALIDATE WORKFLOW
# =====================================================

def validate_workflow_transition(current_status: str, new_status: str):

    current_status = normalize_status(current_status)
    new_status = normalize_status(new_status)

    if current_status == new_status:
        return

    if new_status not in WORKFLOW.get(current_status, []):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid workflow transition: {current_status} -> {new_status}",
        )


# =====================================================
# BUILD RESPONSE
# =====================================================

def build_task_response(task: Task):
    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "status": normalize_status(task.status),
        "priority": task.priority.lower().strip() if task.priority else "low",
        "due_date": task.due_date,
        "created_by_id": task.created_by_id,
        "assigned_to_id": task.assigned_to_id,
        "created_by_name": task.created_by.name if task.created_by else None,
        "assigned_to_name": task.assigned_to.name if task.assigned_to else None,
        "created_at": task.created_at,
        "updated_at": task.updated_at,
    }


# ==========================================
# GET KANBAN TASKS (FIXED)
# ==========================================
def get_kanban_tasks(db: Session, current_user: User):

    role = (current_user.role or "").strip().lower()

    # ADMIN -> ALL TASKS
    if role == "admin":
        tasks = db.query(Task).all()

    # MANAGER -> TASKS CREATED BY MANAGER
    elif role == "manager":
        tasks = db.query(Task).filter(
            Task.created_by_id == current_user.id
        ).all()

    # EMPLOYEE -> ONLY ASSIGNED TASKS
    else:
        tasks = db.query(Task).filter(
            Task.assigned_to_id == current_user.id
        ).all()

    board = {
        "todo": [],
        "in_progress": [],
        "review": [],
        "done": [],
    }

    for task in tasks:
        status = normalize_status(task.status)

        if status not in board:
            status = "todo"

        board[status].append(build_task_response(task))

    # DEBUG - REMOVE AFTER TESTING
    print("========== KANBAN DEBUG ==========")
    print("ROLE:", current_user.role)
    print("TOTAL TASKS:", len(tasks))
    print("TODO:", len(board["todo"]))
    print("IN_PROGRESS:", len(board["in_progress"]))
    print("REVIEW:", len(board["review"]))
    print("DONE:", len(board["done"]))
    print("==================================")

    return board

# =====================================================
# UPDATE TASK STATUS
# =====================================================

def update_task_status(
    task_id: int,
    new_status: str,
    db: Session,
    current_user: User,
):

    task = db.query(Task).filter(Task.id == task_id).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    role = (current_user.role or "").strip().lower()

    if role == "employee" and task.assigned_to_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can update only assigned tasks.",
        )

    validate_workflow_transition(task.status, new_status)

    task.status = normalize_status(new_status)

    db.commit()
    db.refresh(task)

    return build_task_response(task)


# =====================================================
# CREATE TASK
# =====================================================

def create_task(db: Session, task_data: TaskCreate, current_user: User):

    role = (current_user.role or "").strip().lower()

    if role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=403,
            detail="Only Admin or Manager can create tasks.",
        )

    if task_data.assigned_to_id:

        assigned_user = (
            db.query(User)
            .filter(User.id == task_data.assigned_to_id)
            .first()
        )

        if not assigned_user:
            raise HTTPException(
                status_code=404,
                detail="Assigned user not found.",
            )

        if role == "manager" and assigned_user.role.lower() != "employee":
            raise HTTPException(
                status_code=403,
                detail="Manager can assign only employee.",
            )

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

    return build_task_response(task)


# =====================================================
# GET ALL TASKS
# =====================================================

def get_tasks(db: Session, current_user: User):

    role = (current_user.role or "").strip().lower()

    if role == "admin":
        tasks = db.query(Task).all()

    elif role == "manager":
        tasks = (
            db.query(Task)
            .filter(Task.created_by_id == current_user.id)
            .all()
        )

    else:
        tasks = (
            db.query(Task)
            .filter(Task.assigned_to_id == current_user.id)
            .all()
        )

    return [build_task_response(task) for task in tasks]


# =====================================================
# GET SINGLE TASK
# =====================================================

def get_task_by_id(db: Session, task_id: int, current_user: User):

    task = db.query(Task).filter(Task.id == task_id).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")

    role = (current_user.role or "").strip().lower()

    if role == "manager" and task.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized.")

    if role == "employee" and task.assigned_to_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized.")

    return build_task_response(task)


# =====================================================
# UPDATE TASK
# =====================================================

def update_task(
    db: Session,
    task_id: int,
    task_data: TaskUpdate,
    current_user: User,
):

    task = db.query(Task).filter(Task.id == task_id).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")

    role = (current_user.role or "").strip().lower()

    if role == "manager" and task.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized.")

    if role == "employee":

        if task.assigned_to_id != current_user.id:
            raise HTTPException(status_code=403, detail="Unauthorized.")

        validate_workflow_transition(task.status, task_data.status)
        task.status = normalize_status(task_data.status)

    else:
        task.title = task_data.title
        task.description = task_data.description
        task.status = normalize_status(task_data.status)
        task.priority = task_data.priority.lower().strip()
        task.due_date = task_data.due_date
        task.assigned_to_id = task_data.assigned_to_id

    db.commit()
    db.refresh(task)

    return build_task_response(task)


# =====================================================
# DELETE TASK
# =====================================================

def delete_task(
    db: Session,
    task_id: int,
    current_user: User,
):

    task = db.query(Task).filter(Task.id == task_id).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")

    role = (current_user.role or "").strip().lower()

    if role == "employee":
        raise HTTPException(
            status_code=403,
            detail="Employees cannot delete tasks.",
        )

    if role == "manager" and task.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized.")

    db.delete(task)
    db.commit()

    return {"message": "Task deleted successfully."}