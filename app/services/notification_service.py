from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.user import User

# ==========================================================
# CREATE SINGLE NOTIFICATION
# ==========================================================

def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
):
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        is_read=False,
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    return notification


# ==========================================================
# CREATE NOTIFICATION FOR ALL USERS OF A ROLE
# ==========================================================

def notify_role(
    db: Session,
    role: str,
    title: str,
    message: str,
):
    users = (
        db.query(User)
        .filter(User.role.ilike(role))
        .all()
    )

    for user in users:
        create_notification(
            db=db,
            user_id=user.id,
            title=title,
            message=message,
        )


# ==========================================================
# CREATE NOTIFICATION FOR MULTIPLE USERS
# ==========================================================

def notify_multiple_users(
    db: Session,
    user_ids: list[int],
    title: str,
    message: str,
):
    unique_ids = list(set(user_ids))

    for user_id in unique_ids:
        create_notification(
            db=db,
            user_id=user_id,
            title=title,
            message=message,
        )


# ==========================================================
# TASK ASSIGNMENT NOTIFICATIONS (UPDATED)
# ==========================================================

def notify_task_assignment(
    db: Session,
    creator: User,
    assigned_user: User,
    task_title: str,
):
    # Employee receives assignment
    create_notification(
        db=db,
        user_id=assigned_user.id,
        title="📌 New Task Assigned",
        message=(
            f"You have been assigned a new task.\n\n"
            f"Task : {task_title}\n"
            f"Assigned By : {creator.name} ({creator.role.title()})"
        ),
    )

    # Creator confirmation
    create_notification(
        db=db,
        user_id=creator.id,
        title="✅ Task Assigned Successfully",
        message=(
            f"Task '{task_title}' assigned to "
            f"{assigned_user.name}."
        ),
    )

    # Notify all admins except creator
    admins = db.query(User).filter(User.role.ilike("admin")).all()

    for admin in admins:
        if admin.id != creator.id:
            create_notification(
                db=db,
                user_id=admin.id,
                title="📌 New Task Assigned",
                message=(
                    f"{creator.name} assigned '{task_title}' "
                    f"to {assigned_user.name}."
                ),
            )

# ==========================================================
# TASK STATUS UPDATE NOTIFICATIONS (UPDATED)
# ==========================================================

def notify_task_status_update(
    db: Session,
    creator_id: int,
    employee_id: int,
    task_title: str,
    status: str,
):
    creator = db.query(User).filter(User.id == creator_id).first()
    employee = db.query(User).filter(User.id == employee_id).first()

    readable_status = status.replace("_", " ").title()

    # Employee confirmation
    create_notification(
        db=db,
        user_id=employee.id,
        title="📝 Task Status Updated",
        message=(
            f"Task : {task_title}\n"
            f"Status : {readable_status}"
        ),
    )

    # Manager/Admin who created task
    if creator:
        create_notification(
            db=db,
            user_id=creator.id,
            title="📝 Employee Updated Task",
            message=(
                f"{employee.name} updated '{task_title}' "
                f"to {readable_status}."
            ),
        )

    # Notify all admins (except creator)
    admins = db.query(User).filter(User.role.ilike("admin")).all()

    for admin in admins:
        if creator is None or admin.id != creator.id:
            create_notification(
                db=db,
                user_id=admin.id,
                title="📊 Kanban Status Updated",
                message=(
                    f"{employee.name} changed '{task_title}' "
                    f"to {readable_status}."
                ),
            )

    # Task completed notification
    if status.lower() == "done":

        if creator:
            create_notification(
                db=db,
                user_id=creator.id,
                title="🎉 Task Completed",
                message=(
                    f"{employee.name} completed '{task_title}'."
                ),
            )

        create_notification(
            db=db,
            user_id=employee.id,
            title="🎉 Congratulations",
            message=(
                f"You completed '{task_title}'."
            ),
        )

# ==========================================================
# LEAVE SUBMISSION NOTIFICATIONS (Enterprise Workflow)
# ==========================================================

def notify_leave_submission(
    db: Session,
    employee: User,
    leave_type: str,
):
    # Employee Confirmation
    create_notification(
        db=db,
        user_id=employee.id,
        title="🌴 Leave Request Submitted",
        message=(
            f"Leave Type : {leave_type}\n"
            "Status     : Pending Manager Approval"
        ),
    )

    # Manager Notification
    notify_role(
        db=db,
        role="manager",
        title="🌴 New Leave Request",
        message=(
            f"Requested By : {employee.name} ({employee.role.title()})\n\n"
            f"Leave Type   : {leave_type}\n"
            "Status       : Pending Manager Approval"
        ),
    )

    # Admin Notification
    notify_role(
        db=db,
        role="admin",
        title="🌴 New Leave Request",
        message=(
            f"Requested By : {employee.name} ({employee.role.title()})\n\n"
            f"Leave Type   : {leave_type}\n"
            "Status       : Pending Manager Approval"
        ),
    )

def notify_leave_action(
    db: Session,
    employee: User,
    action_by: User,
    action: str,
):
    action = action.lower()

    create_notification(
        db=db,
        user_id=employee.id,
        title=f"Leave {action.title()}",
        message=f"Your leave request has been {action} by {action_by.role.title()}.",
    )

    if action_by.role.lower() == "manager":
        notify_role(
            db=db,
            role="admin",
            title="Leave Request Updated",
            message=f"{employee.name}'s leave request was {action} by Manager.",
        )

    elif action_by.role.lower() == "admin":
        notify_role(
            db=db,
            role="manager",
            title="Leave Request Updated",
            message=f"{employee.name}'s leave request was {action} by Admin.",
        )


# ==========================================================
# APPROVAL SUBMISSION NOTIFICATIONS (Enterprise Workflow)
# ==========================================================

def notify_approval_submission(
    db: Session,
    employee: User,
    approval_title: str,
):
    # Employee Confirmation
    create_notification(
        db=db,
        user_id=employee.id,
        title="📄 Approval Request Submitted",
        message=(
            f"Approval : {approval_title}\n"
            "Status   : Pending Manager Approval"
        ),
    )

    # Manager Notification
    notify_role(
        db=db,
        role="manager",
        title="📄 New Approval Request",
        message=(
            f"Requested By : {employee.name} ({employee.role.title()})\n\n"
            f"Approval     : {approval_title}\n"
            "Status       : Pending Manager Approval"
        ),
    )

    # Admin Notification
    notify_role(
        db=db,
        role="admin",
        title="📄 New Approval Request",
        message=(
            f"Requested By : {employee.name} ({employee.role.title()})\n\n"
            f"Approval     : {approval_title}\n"
            "Status       : Pending Manager Approval"
        ),
    )

def notify_approval_action(
    db: Session,
    employee: User,
    action_by: User,
    approval_title: str,
    action: str,
):
    action = action.lower()

    create_notification(
        db=db,
        user_id=employee.id,
        title=f"Approval {action.title()}",
        message=f"'{approval_title}' has been {action} by {action_by.role.title()}.",
    )

    if action_by.role.lower() == "manager":
        notify_role(
            db=db,
            role="admin",
            title="Approval Request Updated",
            message=f"{employee.name}'s approval '{approval_title}' was {action} by Manager.",
        )

    elif action_by.role.lower() == "admin":
        notify_role(
            db=db,
            role="manager",
            title="Approval Request Updated",
            message=f"{employee.name}'s approval '{approval_title}' was {action} by Admin.",
        )


# ==========================================================
# DOCUMENT NOTIFICATIONS
# ==========================================================

def notify_document_upload(
    db: Session,
    uploaded_by: User,
    document_name: str,
):
    create_notification(
        db=db,
        user_id=uploaded_by.id,
        title="Document Uploaded",
        message=f"'{document_name}' uploaded successfully.",
    )

    notify_role(
        db=db,
        role="admin",
        title="New Document Uploaded",
        message=f"{uploaded_by.name} uploaded '{document_name}'.",
    )


# ==========================================================
# GET USER NOTIFICATIONS
# ==========================================================

def get_user_notifications(
    db: Session,
    current_user: User,
):
    return (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )


# ==========================================================
# ROUTER COMPATIBILITY
# ==========================================================

def get_notifications(
    db: Session,
    current_user: User,
):
    return get_user_notifications(db, current_user)


# ==========================================================
# MARK SINGLE NOTIFICATION AS READ
# ==========================================================

def mark_notification_read(
    db: Session,
    notification_id: int,
    current_user: User,
):
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
        .first()
    )

    if not notification:
        return None

    notification.is_read = True

    db.commit()
    db.refresh(notification)

    return notification


# Alias expected by notification_router.py
def mark_notification_as_read(
    db: Session,
    notification_id: int,
    current_user: User,
):
    return mark_notification_read(
        db=db,
        notification_id=notification_id,
        current_user=current_user,
    )


# ==========================================================
# MARK ALL NOTIFICATIONS AS READ
# ==========================================================

def mark_all_notifications_read(
    db: Session,
    current_user: User,
):
    notifications = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.is_read == False,
        )
        .all()
    )

    for notification in notifications:
        notification.is_read = True

    db.commit()

    return {"message": "All notifications marked as read."}


# ==========================================================
# DELETE SINGLE NOTIFICATION
# ==========================================================

def delete_notification(
    db: Session,
    notification_id: int,
    current_user: User,
):
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
        .first()
    )

    if not notification:
        return None

    db.delete(notification)
    db.commit()

    return {"message": "Notification deleted successfully."}


# ==========================================================
# DELETE ALL NOTIFICATIONS
# ==========================================================

def delete_all_notifications(
    db: Session,
    current_user: User,
):
    (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .delete()
    )

    db.commit()

    return {"message": "All notifications deleted successfully."}


# ==========================================================
# GET UNREAD COUNT
# ==========================================================

def get_unread_notification_count(
    db: Session,
    current_user: User,
):
    unread_count = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.is_read == False,
        )
        .count()
    )

    return {
        "unread_count": unread_count
    }