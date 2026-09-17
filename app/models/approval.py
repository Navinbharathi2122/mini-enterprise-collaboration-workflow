from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class Approval(Base):
    __tablename__ = "approvals"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    status = Column(String(30), default="pending", nullable=False)
    current_level = Column(String(30), default="manager", nullable=False)

    requested_by_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    approved_by_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    created_at = Column(DateTime, default=datetime.utcnow)

    requested_by = relationship(
        "User",
        foreign_keys=[requested_by_id],
        back_populates="approvals_requested"
    )

    approved_by = relationship(
        "User",
        foreign_keys=[approved_by_id]
    )

    history = relationship(
        "ApprovalHistory",
        back_populates="approval",
        cascade="all, delete-orphan"
    )