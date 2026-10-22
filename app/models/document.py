from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Index
from sqlalchemy.sql import func
from app.core.database import Base

class Document(Base):
    __tablename__ = "documents"
    __table_args__ = (Index("ix_documents_task_created", "task_id", "created_at"), Index("ix_documents_uploaded_created", "uploaded_by", "created_at"))

    id = Column(Integer, primary_key=True, index=True)

    file_name = Column(String(255), nullable=False)

    file_path = Column(String(500), nullable=False)

    version = Column(Integer, default=1)

    uploaded_by = Column(Integer, ForeignKey("users.id"))

    task_id = Column(Integer, ForeignKey("tasks.id"))

    created_at = Column(DateTime(timezone=True), server_default=func.now())