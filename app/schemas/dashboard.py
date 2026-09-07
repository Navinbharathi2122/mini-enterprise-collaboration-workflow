from pydantic import BaseModel


class DashboardResponse(BaseModel):
    total_users: int
    total_tasks: int
    completed_tasks: int
    pending_tasks: int