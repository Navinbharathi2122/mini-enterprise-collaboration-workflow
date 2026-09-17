from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(Integer, primary_key=True, index=True)

    requested_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    leave_type = Column(String(50), nullable=False)
    reason = Column(String(500), nullable=False)

    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)

    days = Column(Integer, nullable=False)

    status = Column(String(30), default="pending", nullable=False)
    current_level = Column(String(30), default="manager", nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    user = relationship("User")
    history = relationship(
        "LeaveHistory",
        back_populates="leave_request",
        cascade="all, delete-orphan",
    )