from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel


# ==========================
# CREATE APPROVAL
# ==========================

class ApprovalCreate(BaseModel):
    title: str
    description: Optional[str] = None


# ==========================
# APPROVAL ACTION
# ==========================

class ApprovalAction(BaseModel):
    action: Literal["approve", "reject", "hold", "resume"]
    comment: Optional[str] = None

# ==========================
# APPROVAL RESPONSE
# ==========================

class ApprovalResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None

    status: str
    current_level: str

    requested_by_id: int
    approved_by_id: Optional[int] = None

    # ADD THESE FIELDS
    requested_by_name: Optional[str] = None
    requested_by_role: Optional[str] = None
    approved_by_name: Optional[str] = None

    created_at: datetime

    class Config:
        from_attributes = True


# ==========================
# APPROVAL HISTORY RESPONSE
# ==========================

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