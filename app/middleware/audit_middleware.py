from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import SECRET_KEY, ALGORITHM
from app.services.audit_service import create_audit_log


class AuditMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # Log only successful requests
        if response.status_code not in [200, 201]:
            return response

        path = request.url.path
        method = request.method

        # Skip Swagger and auth endpoints
        if (
            path.startswith("/docs")
            or path.startswith("/openapi.json")
            or path.startswith("/redoc")
            or path.startswith("/auth/login")
            or path.startswith("/auth/register")
        ):
            return response

        # Default values
        user_id = None

        # Read JWT token from Authorization header
        auth_header = request.headers.get("Authorization")

        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.replace("Bearer ", "")

            try:
                payload = jwt.decode(
                    token,
                    SECRET_KEY,
                    algorithms=[ALGORITHM],
                )

                user_id = int(payload.get("sub"))

            except (JWTError, TypeError, ValueError):
                user_id = None

        # If token is missing or invalid, don't create audit log
        if user_id is None:
            return response

        # Decide action based on request
        action = f"{method}_{path.split('/')[1].upper()}"

        db: Session = SessionLocal()

        try:
            create_audit_log(
                db=db,
                user_id=user_id,
                action=action,
                entity=path.split("/")[1].capitalize(),
                entity_id=None,
                description=f"{method} {path}",
            )
        finally:
            db.close()

        return response