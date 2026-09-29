from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user

from app.models.user import User

from app.schemas.dashboard import (
    DashboardResponse,
    DashboardAISummaryResponse,
)

from app.services.dashboard_service import (
    get_dashboard_summary,
    get_task_distribution,
    get_ai_dashboard_summary,
)

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get(
    "/summary",
    response_model=DashboardResponse
)
def dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_dashboard_summary(db, current_user)



@router.get("/task-distribution")
def task_distribution(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_task_distribution(db, current_user)



@router.get(
    "/ai-summary",
    response_model=DashboardAISummaryResponse
)
def ai_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_ai_dashboard_summary(db, current_user)