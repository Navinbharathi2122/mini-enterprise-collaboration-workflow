from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class ApprovalHistory(Base):
    __tablename__ = "approval_history"

    id = Column(Integer, primary_key=True, index=True)

    approval_id = Column(Integer, ForeignKey("approvals.id"))
    action_by_id = Column(Integer, ForeignKey("users.id"))

    action = Column(String(30), nullable=False)
    comment = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    approval = relationship(
        "Approval",
        back_populates="history"
    )

    action_by = relationship(
        "User",
        back_populates="approvals_actioned"
    )