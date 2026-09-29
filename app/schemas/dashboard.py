from pydantic import BaseModel



class DashboardResponse(BaseModel):
    total_users: int
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    todo_tasks: int
    in_progress_tasks: int
    review_tasks: int
    done_tasks: int
    pending_approvals: int
    approved_requests: int
    rejected_requests: int
    leave_requests: int



class DashboardAISummaryResponse(BaseModel):
    productivity_score: float
    pending_tasks: int
    completed_tasks: int
    pending_approvals: int
    leave_requests: int
    unread_notifications: int
    ai_status: str
    ai_message: str