from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class LeaveCreate(BaseModel):
    leave_type: str
    reason: str
    start_date: date
    end_date: date


class LeaveAction(BaseModel):
    action: str
    comment: Optional[str] = None



class LeaveResponse(BaseModel):
    id: int

    requested_by: int              
    requested_by_name: Optional[str] = None
    requested_by_role: Optional[str] = None

    leave_type: str
    reason: str

    start_date: date
    end_date: date
    days: int

    status: str
    current_level: str

    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class LeaveHistoryResponse(BaseModel):
    id: int
    leave_request_id: int

    action_by_id: int
    action_by_role: str          

    action: str
    comment: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)