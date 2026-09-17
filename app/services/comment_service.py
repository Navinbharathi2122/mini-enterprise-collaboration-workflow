from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.comment import Comment
from app.models.task import Task
from app.models.user import User

from app.schemas.comment_schema import (
    CommentCreate,
    CommentResponse,
)


def add_comment(
    db: Session,
    task_id: int,
    comment_data: CommentCreate,
    current_user: User,
):
   
    task = db.query(Task).filter(Task.id == task_id).first()

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found.",
        )

    # Employee cannot create internal comments
    if comment_data.is_internal and current_user.role == "employee":
        raise HTTPException(
            status_code=403,
            detail="Employees cannot create internal comments.",
        )

    # Save comment
    comment = Comment(
        task_id=task.id,
        user_id=current_user.id,
        content=comment_data.content,
        is_internal=comment_data.is_internal,
    )

    db.add(comment)
    db.commit()
    db.refresh(comment)

    # Return response
    return {
        "message": "Comment added successfully.",
        "comment": CommentResponse(
            id=comment.id,
            task_id=comment.task_id,
            user_id=comment.user_id,
            user_name=current_user.name,
            content=comment.content,
            is_internal=comment.is_internal,
            created_at=comment.created_at,
        ),
    }


def get_task_comments(
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

    comments = (
        db.query(Comment)
        .filter(Comment.task_id == task_id)
        .order_by(Comment.created_at.asc())
        .all()
    )

    response = []

    for comment in comments:
        
        if comment.is_internal and current_user.role == "employee":
            continue

        response.append(
            CommentResponse(
                id=comment.id,
                task_id=comment.task_id,
                user_id=comment.user_id,
                user_name=comment.user.name,
                content=comment.content,
                is_internal=comment.is_internal,
                created_at=comment.created_at,
            )
        )

    return response