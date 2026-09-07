from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String(150), nullable=False)

    description = Column(Text, nullable=True)

    status = Column(String(20), nullable=False, default="todo")

    priority = Column(String(20), nullable=False, default="medium")

    due_date = Column(DateTime(timezone=True), nullable=True)

    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)

   
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    created_by = relationship(
        "User",
        foreign_keys=[created_by_id],
        backref="created_tasks"
    )

    assigned_to = relationship(
        "User",
        foreign_keys=[assigned_to_id],
        backref="assigned_tasks"
    )