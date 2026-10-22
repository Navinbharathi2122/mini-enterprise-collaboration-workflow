import os
import shutil
from sqlalchemy.orm import Session
from app.models.document import Document


UPLOAD_FOLDER = "app/uploads"


os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def upload_document(
    db: Session,
    file,
    uploaded_by: int,
    task_id: int
):
    
    filename = file.filename

   
    save_path = os.path.join(UPLOAD_FOLDER, filename)

    existing_document = (
        db.query(Document)
        .filter(
            Document.task_id == task_id,
            Document.file_name == filename
        )
        .order_by(Document.version.desc())
        .first()
    )

   
    version = 1

    
    if existing_document:
        version = existing_document.version + 1

    
    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

   
    document = Document(
        file_name=filename,
        file_path=save_path,
        uploaded_by=uploaded_by,
        task_id=task_id,
        version=version
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    return document