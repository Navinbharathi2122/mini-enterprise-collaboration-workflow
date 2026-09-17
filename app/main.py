from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import Base, engine

from app.models.user import User
from app.models.task import Task
from app.models.comment import Comment
from app.models.approval import Approval
from app.models.approval_history import ApprovalHistory
from app.models.leave_request import LeaveRequest
from app.models.leave_history import LeaveHistory

from app.routers.auth_router import router as auth_router
from app.routers.user_router import router as user_router
from app.routers.task_router import router as task_router
from app.routers.comment_router import router as comment_router
from app.routers.approval_router import router as approval_router
from app.routers.leave_router import router as leave_router
from app.routers.dashboard_router import router as dashboard_router

app = FastAPI(
    title="Enterprise Workflow API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

# Authentication
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])

# Remove duplicate prefixes
app.include_router(user_router)
app.include_router(task_router)
app.include_router(comment_router)
app.include_router(approval_router)
app.include_router(leave_router)
app.include_router(dashboard_router)

@app.get("/")
def root():
    return {"message": "Enterprise Workflow API Running"}