from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from typing import Literal, Optional



class ApprovalCreate(BaseModel):
    title: str
    description: Optional[str] = None



class ApprovalAction(BaseModel):
    action: Literal["approved", "rejected", "hold"]
    comment: Optional[str] = None

class ApprovalResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None

    status: str
    current_level: str

    requested_by_id: int
    approved_by_id: Optional[int] = None

    created_at: datetime

    class Config:
        from_attributes = True


class ApprovalHistoryResponse(BaseModel):
    id: int
    approval_id: int
    action_by_id: int

    action_by_name: Optional[str] = None
    action_by_role: Optional[str] = None

    action: str
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True