from pydantic import BaseModel
from datetime import datetime

class DocumentResponse(BaseModel):
    id: int
    file_name: str
    version: int
    uploaded_by: int
    task_id: int
    created_at: datetime

    class Config:
        from_attributes = True