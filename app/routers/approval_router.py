from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user

from app.models.user import User

from app.schemas.approval_schema import (
    ApprovalCreate,
    ApprovalResponse,
    ApprovalAction,
    ApprovalHistoryResponse,
)

from app.services.approval_service import (
    create_approval,
    get_all_approvals,
    take_approval_action,
    get_approval_history,
)

router = APIRouter(
    prefix="/approvals",
    tags=["Approval Workflow"],
)


@router.post(
    "/",
    response_model=ApprovalResponse,
    status_code=201,
)
def create_new_approval(
    approval: ApprovalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_approval(
        db=db,
        approval_data=approval,
        current_user=current_user,
    )


@router.get(
    "/",
    response_model=List[ApprovalResponse],
)
def get_approvals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_all_approvals(
        db=db,
        current_user=current_user,
    )


@router.patch(
    "/{approval_id}/action",
    response_model=ApprovalResponse,
)
def approval_action(
    approval_id: int,
    approval: ApprovalAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return take_approval_action(
        db=db,
        approval_id=approval_id,
        approval_action=approval,
        current_user=current_user,
    )


@router.get(
    "/{approval_id}/history",
    response_model=List[ApprovalHistoryResponse],
)
def approval_history(
    approval_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_approval_history(
        db=db,
        approval_id=approval_id,
    )