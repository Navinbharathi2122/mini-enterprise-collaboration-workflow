from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    due_date: Optional[datetime] = None
    assigned_to_id: Optional[int] = None


class TaskUpdate(BaseModel):
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    due_date: Optional[datetime] = None
    assigned_to_id: Optional[int] = None


class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    status: str
    priority: str
    due_date: Optional[datetime]

    created_by_id: int
    assigned_to_id: Optional[int]

    created_by_name: str
    assigned_to_name: Optional[str]

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True