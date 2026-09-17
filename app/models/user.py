from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="employee")
    is_active = Column(Boolean, default=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    created_tasks = relationship(
        "Task",
        foreign_keys="Task.created_by_id",
        back_populates="created_by"
    )

    assigned_tasks = relationship(
        "Task",
        foreign_keys="Task.assigned_to_id",
        back_populates="assigned_to"
    )

    updated_tasks = relationship(
        "Task",
        foreign_keys="Task.updated_by_id",
        back_populates="updated_by"
    )

    comments = relationship(
        "Comment",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    approvals_requested = relationship(
        "Approval",
        foreign_keys="Approval.requested_by_id",
        back_populates="requested_by"
    )

    approvals_actioned = relationship(
        "ApprovalHistory",
        foreign_keys="ApprovalHistory.action_by_id",
        back_populates="action_by"
    )