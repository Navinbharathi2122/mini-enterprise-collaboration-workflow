from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.task import Task
from app.models.user import User
from app.schemas.task import TaskCreate, TaskUpdate


def create_task(db: Session, task_data: TaskCreate, current_user: User):

    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admin or Manager can create tasks."
        )

   
    if task_data.assigned_to_id is not None:
        assigned_user = (
            db.query(User)
            .filter(User.id == task_data.assigned_to_id)
            .first()
        )

        if not assigned_user:
            raise HTTPException(
                status_code=404,
                detail="Assigned user not found."
            )

        if current_user.role == "manager" and assigned_user.role != "employee":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Manager can assign tasks only to employees."
            )

    new_task = Task(
        title=task_data.title,
        description=task_data.description,
        status=task_data.status,
        priority=task_data.priority,
        due_date=task_data.due_date,
        assigned_to_id=task_data.assigned_to_id,
        created_by_id=current_user.id,
    )

    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    return {
        "id": new_task.id,
        "title": new_task.title,
        "description": new_task.description,
        "status": new_task.status,
        "priority": new_task.priority,
        "due_date": new_task.due_date,
        "created_by_id": new_task.created_by_id,
        "assigned_to_id": new_task.assigned_to_id,
        "created_by_name": new_task.created_by.name,
        "assigned_to_name": (
            new_task.assigned_to.name if new_task.assigned_to else None
        ),
        "created_at": new_task.created_at,
        "updated_at": new_task.updated_at,
    }


def get_tasks(db: Session, current_user: User):

    if current_user.role == "admin":
        tasks = db.query(Task).all()

    elif current_user.role == "manager":
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

    return [
        {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "status": task.status,
            "priority": task.priority,
            "due_date": task.due_date,
            "created_by_id": task.created_by_id,
            "assigned_to_id": task.assigned_to_id,
            "created_by_name": task.created_by.name,
            "assigned_to_name": (
                task.assigned_to.name if task.assigned_to else None
            ),
            "created_at": task.created_at,
            "updated_at": task.updated_at,
        }
        for task in tasks
    ]


def get_task_by_id(db: Session, task_id: int, current_user: User):

    task = db.query(Task).filter(Task.id == task_id).first()

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found."
        )

    if current_user.role == "manager" and task.created_by_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Managers can access only their own tasks."
        )

    if current_user.role == "employee" and task.assigned_to_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Employees can access only assigned tasks."
        )

    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "priority": task.priority,
        "due_date": task.due_date,
        "created_by_id": task.created_by_id,
        "assigned_to_id": task.assigned_to_id,
        "created_by_name": task.created_by.name,
        "assigned_to_name": (
            task.assigned_to.name if task.assigned_to else None
        ),
        "created_at": task.created_at,
        "updated_at": task.updated_at,
    }


def update_task(
    db: Session,
    task_id: int,
    task_data: TaskUpdate,
    current_user: User,
):

    db_task = db.query(Task).filter(Task.id == task_id).first()

    if not db_task:
        raise HTTPException(
            status_code=404,
            detail="Task not found."
        )

    
    if current_user.role == "manager":
        if db_task.created_by_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Managers can update only their own tasks."
            )

    
    if current_user.role == "employee":
        if db_task.assigned_to_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Employees can update only assigned tasks."
            )

       
        db_task.status = task_data.status
        db.commit()
        db.refresh(db_task)

    else:
       
        db_task.title = task_data.title
        db_task.description = task_data.description
        db_task.status = task_data.status
        db_task.priority = task_data.priority
        db_task.due_date = task_data.due_date

        if task_data.assigned_to_id is not None:
            assigned_user = (
                db.query(User)
                .filter(User.id == task_data.assigned_to_id)
                .first()
            )

            if not assigned_user:
                raise HTTPException(
                    status_code=404,
                    detail="Assigned user not found."
                )

            if current_user.role == "manager" and assigned_user.role != "employee":
                raise HTTPException(
                    status_code=403,
                    detail="Manager can assign only to employees."
                )

        db_task.assigned_to_id = task_data.assigned_to_id

        db.commit()
        db.refresh(db_task)

    return {
        "id": db_task.id,
        "title": db_task.title,
        "description": db_task.description,
        "status": db_task.status,
        "priority": db_task.priority,
        "due_date": db_task.due_date,
        "created_by_id": db_task.created_by_id,
        "assigned_to_id": db_task.assigned_to_id,
        "created_by_name": db_task.created_by.name,
        "assigned_to_name": (
            db_task.assigned_to.name if db_task.assigned_to else None
        ),
        "created_at": db_task.created_at,
        "updated_at": db_task.updated_at,
    }


def delete_task(
    db: Session,
    task_id: int,
    current_user: User,
):

    db_task = db.query(Task).filter(Task.id == task_id).first()

    if not db_task:
        raise HTTPException(
            status_code=404,
            detail="Task not found."
        )

    if current_user.role == "employee":
        raise HTTPException(
            status_code=403,
            detail="Employees cannot delete tasks."
        )

    if current_user.role == "manager" and db_task.created_by_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Managers can delete only their own tasks."
        )

    db.delete(db_task)
    db.commit()

    return {"message": "Task deleted successfully"}