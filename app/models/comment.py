from sqlalchemy import Column, Integer, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)

    task_id = Column(
        Integer,
        ForeignKey("tasks.id", ondelete="CASCADE"),
        nullable=False,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    content = Column(Text, nullable=False)

    is_internal = Column(Boolean, default=False)

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    task = relationship(
        "Task",
        back_populates="comments",
    )

    user = relationship(
        "User",
        back_populates="comments",
    )