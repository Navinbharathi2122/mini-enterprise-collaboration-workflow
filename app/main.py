from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


from app.core.database import Base, engine


from app.models.user import User
from app.models.task import Task


from app.routers.auth_router import router as auth_router
from app.routers.user_router import router as user_router
from app.routers.task_router import router as task_router
from app.routers.dashboard_router import router as dashboard_router

app = FastAPI(
    title="Enterprise Workflow API",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


Base.metadata.create_all(bind=engine)


app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(user_router, prefix="/users", tags=["Users"])
app.include_router(task_router, prefix="/tasks", tags=["Tasks"])
app.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboard"])


@app.get("/")
def root():
    return {
        "message": "Enterprise Workflow API Running "
    }