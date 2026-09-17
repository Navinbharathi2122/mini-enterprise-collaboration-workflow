from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class LeaveHistory(Base):
    __tablename__ = "leave_history"

    id = Column(Integer, primary_key=True, index=True)

    leave_request_id = Column(
        Integer,
        ForeignKey("leave_requests.id", ondelete="CASCADE"),
        nullable=False,
    )

    action_by_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

   
    action_by_role = Column(
        String(30),
        nullable=False,
        default="employee",
    )

    action = Column(
        String(30),
        nullable=False,
    )

    comment = Column(
        String(500),
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    leave_request = relationship("LeaveRequest")
    action_by = relationship("User")