from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os

from app.core.database import get_db
from app.models.document import Document
from app.services.document_service import upload_document

router = APIRouter(
    prefix="/documents",
    tags=["Documents"]
)


@router.post("/upload")
def upload_file(
    task_id: int,
    uploaded_by: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    return upload_document(
        db=db,
        file=file,
        uploaded_by=uploaded_by,
        task_id=task_id
    )



@router.get("/download/{document_id}")
def download_document(
    document_id: int,
    db: Session = Depends(get_db)
):
    
    document = (
        db.query(Document)
        .filter(Document.id == document_id)
        .first()
    )

   
    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found."
        )

   
    if not os.path.exists(document.file_path):
        raise HTTPException(
            status_code=404,
            detail="File does not exist on server."
        )

  
    return FileResponse(
        path=document.file_path,
        filename=document.file_name,
        media_type="application/octet-stream"
    )



@router.get("/task/{task_id}")
def get_task_documents(
    task_id: int,
    db: Session = Depends(get_db)
):
    documents = (
        db.query(Document)
        .filter(Document.task_id == task_id)
        .order_by(Document.version.desc())
        .all()
    )

    if not documents:
        raise HTTPException(
            status_code=404,
            detail="No documents found for this task."
        )

    return documents