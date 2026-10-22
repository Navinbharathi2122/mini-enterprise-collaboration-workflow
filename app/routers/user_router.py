
from fastapi import APIRouter, Depends, Query
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
    tags=["Users"],
)


# Get the currently authenticated user's SQLite profile
@router.get("/me", response_model=UserResponse)
def read_current_user(
    current_user: User = Depends(get_current_user),
):
    return current_user


# Get all users
@router.get("/", response_model=list[UserResponse])
def read_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    sort_order: str = Query("asc", pattern="^(asc|desc)$"),
    role: str | None = Query(None, max_length=20),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_users(db, current_user, page, limit, sort_order, role)


# Create a new user
@router.post("/", response_model=UserResponse)
def create_new_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_user(db, user, current_user)


# Get a user by ID
@router.get("/{user_id}", response_model=UserResponse)
def read_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_user_by_id(db, user_id, current_user)


# Update a user
@router.put("/{user_id}", response_model=UserResponse)
def update_existing_user(
    user_id: int,
    user: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return update_user(db, user_id, user, current_user)


# Delete a user
@router.delete("/{user_id}")
def remove_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return delete_user(db, user_id, current_user)
