from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User

from app.schemas.user import (
    UserCreate,
    UserUpdate,
    UserResponse,
)

from app.services.user_service import (
    create_user,
    get_users,
    get_user_by_id,
    update_user,
    delete_user,
)


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


# ==========================================
# GET ALL USERS
# ==========================================
@router.get("/", response_model=list[UserResponse])
def read_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_users(db, current_user)


# ==========================================
# CREATE USER
# ==========================================
@router.post("/", response_model=UserResponse)
def create_new_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_user(db, user, current_user)


# ==========================================
# GET USER BY ID
# ==========================================
@router.get("/{user_id}", response_model=UserResponse)
def read_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_user_by_id(db, user_id, current_user)


# ==========================================
# UPDATE USER
# ==========================================
@router.put("/{user_id}", response_model=UserResponse)
def update_existing_user(
    user_id: int,
    user: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return update_user(db, user_id, user, current_user)


# ==========================================
# DELETE USER
# ==========================================
@router.delete("/{user_id}")
def remove_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return delete_user(db, user_id, current_user)