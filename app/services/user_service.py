from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import hash_password


# ==========================================
# CREATE USER
# ==========================================
def create_user(db: Session, user_data: UserCreate, current_user: User):

    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admin can create users."
        )

    existing_user = (
        db.query(User)
        .filter(User.email == user_data.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered."
        )

    new_user = User(
        name=user_data.name,
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        role=user_data.role,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# ==========================================
# GET USERS
# ==========================================
def get_users(db: Session, current_user: User):

    if current_user.role == "admin":
        users = db.query(User).all()

    elif current_user.role == "manager":
        users = (
            db.query(User)
            .filter(User.role == "employee")
            .all()
        )

    else:
        users = (
            db.query(User)
            .filter(User.id == current_user.id)
            .all()
        )

    return users


# ==========================================
# GET USER BY ID
# ==========================================
def get_user_by_id(db: Session, user_id: int, current_user: User):

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found."
        )

    if current_user.role == "admin":
        return user

    if current_user.role == "manager":
        if user.role != "employee":
            raise HTTPException(
                status_code=403,
                detail="Manager can access only employee profiles."
            )
        return user

    if current_user.id != user_id:
        raise HTTPException(
            status_code=403,
            detail="Employees can access only their own profile."
        )

    return user


# ==========================================
# UPDATE USER
# ==========================================
def update_user(
    db: Session,
    user_id: int,
    user_data: UserUpdate,
    current_user: User,
):

    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only Admin can update users."
        )

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found."
        )

    existing_email = (
        db.query(User)
        .filter(User.email == user_data.email, User.id != user_id)
        .first()
    )

    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="Email already exists."
        )

    user.name = user_data.name
    user.email = user_data.email
    user.role = user_data.role

    if user_data.password:
        user.hashed_password = hash_password(user_data.password)

    db.commit()
    db.refresh(user)

    return user


# ==========================================
# DELETE USER
# ==========================================
def delete_user(
    db: Session,
    user_id: int,
    current_user: User,
):

    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only Admin can delete users."
        )

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found."
        )

    db.delete(user)
    db.commit()

    return {"message": "User deleted successfully."}