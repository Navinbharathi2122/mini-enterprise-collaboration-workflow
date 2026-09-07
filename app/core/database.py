from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import create_engine

from app.core.config import settings

DATABASE_URL = (
    f"mysql+pymysql://{settings.database_user}:{settings.database_password}"
    f"@{settings.database_host}:{settings.database_port}/{settings.database_name}"
)

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()