from pydantic import BaseModel
from datetime import datetime


class CommentCreate(BaseModel):
    content: str
    is_internal: bool = False


class CommentResponse(BaseModel):
    id: int
    task_id: int
    user_id: int
    user_name: str
    content: str
    is_internal: bool
    created_at: datetime

    class Config:
        from_attributes = True