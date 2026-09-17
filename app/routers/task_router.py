from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User

from app.schemas.task import (
    TaskCreate,
    TaskUpdate,
    TaskResponse,
    KanbanBoardResponse,
    KanbanTaskResponse,
    TaskStatusUpdate,
)

from app.services.task_service import (
    create_task,
    get_tasks,
    get_task_by_id,
    update_task,
    delete_task,
    get_kanban_tasks,
    update_task_status,
)

router = APIRouter(
    prefix="/tasks",
    tags=["Tasks"],
)

# ======================================================
# IMPORTANT:
# Static routes FIRST
# ======================================================

@router.get("/kanban", response_model=KanbanBoardResponse)
def kanban_board(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_kanban_tasks(db, current_user)


@router.patch("/{task_id}/status", response_model=KanbanTaskResponse)
def change_task_status(
    task_id: int,
    status_data: TaskStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return update_task_status(
        task_id,
        status_data.status,
        db,
        current_user,
    )

# ======================================================
# CRUD APIs
# ======================================================

@router.post("/", response_model=TaskResponse)
def create_new_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_task(db, task, current_user)


@router.get("/", response_model=list[TaskResponse])
def read_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_tasks(db, current_user)


# Dynamic route LAST
@router.get("/{task_id}", response_model=TaskResponse)
def read_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_task_by_id(db, task_id, current_user)


@router.put("/{task_id}", response_model=TaskResponse)
def update_existing_task(
    task_id: int,
    task: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return update_task(db, task_id, task, current_user)


@router.delete("/{task_id}")
def remove_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return delete_task(db, task_id, current_user)