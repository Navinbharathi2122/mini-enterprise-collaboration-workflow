from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user

from app.models.user import User

from app.schemas.notification import (
    NotificationResponse,
    NotificationReadResponse,
)

from app.services.notification_service import (
    get_notifications,
    mark_notification_as_read,
    mark_all_notifications_read,
    delete_notification,
    delete_all_notifications,
    get_unread_notification_count,
)

router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"],
)


# ==========================================================
# GET ALL NOTIFICATIONS
# ==========================================================

@router.get("/", response_model=list[NotificationResponse])
def read_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_notifications(db, current_user)


# ==========================================================
# GET UNREAD COUNT
# ==========================================================

@router.get("/unread-count")
def unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_unread_notification_count(db, current_user)


# ==========================================================
# MARK SINGLE NOTIFICATION AS READ
# ==========================================================

@router.patch(
    "/{notification_id}/read",
    response_model=NotificationReadResponse,
)
def read_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notification = mark_notification_as_read(
        db,
        notification_id,
        current_user,
    )

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found.",
        )

    return notification


# ==========================================================
# MARK ALL NOTIFICATIONS AS READ
# ==========================================================

@router.patch("/read-all")
def read_all_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return mark_all_notifications_read(db, current_user)


# ==========================================================
# DELETE SINGLE NOTIFICATION
# ==========================================================

@router.delete("/{notification_id}")
def remove_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = delete_notification(
        db,
        notification_id,
        current_user,
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Notification not found.",
        )

    return result


# ==========================================================
# DELETE ALL NOTIFICATIONS
# ==========================================================

@router.delete("/")
def remove_all_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return delete_all_notifications(db, current_user)