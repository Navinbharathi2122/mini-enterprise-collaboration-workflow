from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User

from app.schemas.leave_schema import (
    LeaveCreate,
    LeaveAction,
    LeaveResponse,
    LeaveHistoryResponse,
)

from app.services.leave_service import (
    create_leave_request,
    get_all_leave_requests,
    get_leave_by_id,
    take_leave_action,
    get_leave_history,
)

router = APIRouter(
    prefix="/api/leaves",
    tags=["Leave Requests"],
    redirect_slashes=False,
)



@router.post(
    "",
    response_model=LeaveResponse,
    status_code=201,
)
def create_leave(
    leave_data: LeaveCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_leave_request(
        db=db,
        leave_data=leave_data,
        current_user=current_user,
    )



@router.get(
    "",
    response_model=List[LeaveResponse],
)
def get_leaves(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_all_leave_requests(
        db=db,
        current_user=current_user,
    )



@router.get(
    "/{leave_request_id}",
    response_model=LeaveResponse,
)
def get_leave(
    leave_request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_leave_by_id(
        db=db,
        leave_request_id=leave_request_id,
    )



@router.patch(
    "/{leave_request_id}/action",
    response_model=LeaveResponse,
)
def leave_action(
    leave_request_id: int,
    leave_action: LeaveAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return take_leave_action(
        db=db,
        leave_request_id=leave_request_id,
        leave_action=leave_action,
        current_user=current_user,
    )



@router.get(
    "/{leave_request_id}/history",
    response_model=List[LeaveHistoryResponse],
)
def leave_history(
    leave_request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_leave_history(
        db=db,
        leave_request_id=leave_request_id,
    )