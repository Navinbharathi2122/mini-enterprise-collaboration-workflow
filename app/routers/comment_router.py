from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user

from app.models.user import User

from app.schemas.comment_schema import (
    CommentCreate,
    CommentResponse,
)

from app.services.comment_service import (
    add_comment,
    get_task_comments,
)

router = APIRouter(
    prefix="/tasks",
    tags=["Task Comments"],
)


@router.post(
    "/{task_id}/comments",
    status_code=201,
)
def create_comment(
    task_id: int,
    comment_data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return add_comment(
        db=db,
        task_id=task_id,
        comment_data=comment_data,
        current_user=current_user,
    )


@router.get(
    "/{task_id}/comments",
    response_model=List[CommentResponse],
)
def fetch_comments(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_task_comments(
        db=db,
        task_id=task_id,
        current_user=current_user,
    )