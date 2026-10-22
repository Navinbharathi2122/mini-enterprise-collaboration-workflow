from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os
from app.core.database import get_db
from app.core.security import get_current_user
from app.core.permissions import require_task_access
from app.models.document import Document
from app.models.task import Task
from app.models.user import User
from app.services.document_service import upload_document

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.post("/upload")
def upload_file(
    task_id: int = Query(..., ge=1),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
    require_task_access(current_user, task)
    return upload_document(db=db, file=file, uploaded_by=current_user.id, task_id=task_id)

@router.get("/download/{document_id}")
def download_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found.")
    task = db.query(Task).filter(Task.id == document.task_id).first() if document.task_id else None
    if task:
        require_task_access(current_user, task)
    elif current_user.role != "admin" and document.uploaded_by != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to download this document.")
    if not os.path.exists(document.file_path):
        raise HTTPException(status_code=404, detail="File does not exist on server.")
    return FileResponse(path=document.file_path, filename=document.file_name, media_type="application/octet-stream")

@router.get("/task/{task_id}")
def get_task_documents(
    task_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
    require_task_access(current_user, task)
    query = db.query(Document).filter(Document.task_id == task_id)
    query = query.order_by(Document.version.asc() if sort_order == "asc" else Document.version.desc())
    documents = query.offset((page - 1) * limit).limit(limit).all()
    return documents
