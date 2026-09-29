from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import Base, engine

# Models
from app.models.user import User
from app.models.task import Task
from app.models.comment import Comment
from app.models.approval import Approval
from app.models.approval_history import ApprovalHistory
from app.models.leave_request import LeaveRequest
from app.models.leave_history import LeaveHistory
from app.models.document import Document
from app.models.audit_log import AuditLog
from app.models.notification import Notification

# Routers
from app.routers.auth_router import router as auth_router
from app.routers.user_router import router as user_router
from app.routers.task_router import router as task_router
from app.routers.comment_router import router as comment_router
from app.routers.approval_router import router as approval_router
from app.routers.leave_router import router as leave_router
from app.routers.dashboard_router import router as dashboard_router
from app.routers.documents import router as document_router
from app.routers.audit_router import router as audit_router
from app.routers.notification_router import router as notification_router

# Middleware
from app.middleware.audit_middleware import AuditMiddleware

app = FastAPI(
    title="Enterprise Workflow API",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Audit Middleware
app.add_middleware(AuditMiddleware)

# Create Tables
Base.metadata.create_all(bind=engine)

# Include Routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(user_router)
app.include_router(task_router)
app.include_router(comment_router)
app.include_router(approval_router)
app.include_router(leave_router)
app.include_router(dashboard_router)
app.include_router(document_router)
app.include_router(audit_router)
app.include_router(notification_router)

@app.get("/")
def root():
    return {"message": "Enterprise Workflow API Running 🚀"}