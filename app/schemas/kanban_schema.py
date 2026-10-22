from datetime import datetime
from typing import List

from pydantic import BaseModel


class TaskStatusUpdate(BaseModel):
    status: str


class KanbanTaskResponse(BaseModel):
    id: int
    title: str
    description: str | None
    status: str
    priority: str
    due_date: datetime | None
    created_by_id: int
    assigned_to_id: int | None
    updated_by_id: int | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class KanbanBoardResponse(BaseModel):
    todo: List[KanbanTaskResponse]
    in_progress: List[KanbanTaskResponse]
    review: List[KanbanTaskResponse]
    done: List[KanbanTaskResponse]