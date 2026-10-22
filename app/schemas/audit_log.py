from pydantic import BaseModel
from datetime import datetime



class AuditLogResponse(BaseModel):
    id: int

    user_id: int | None = None

    action: str
    entity: str

    entity_id: int | None = None

    description: str | None = None

    created_at: datetime

    class Config:
        from_attributes = True