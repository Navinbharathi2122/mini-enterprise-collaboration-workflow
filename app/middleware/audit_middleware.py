
import logging

from fastapi import Request
from fastapi.security import HTTPAuthorizationCredentials
from jose import jwt, JWTError
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import SECRET_KEY, ALGORITHM
from app.core.auth0_security import (
    get_current_auth0_payload,
    EMAIL_CLAIM,
)
from app.models.user import User
from app.services.audit_service import create_audit_log
from app.core.cache import delete_pattern


logger = logging.getLogger(__name__)


class AuditMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request: Request, call_next):
        # Process the API request first.
        response = await call_next(request)

        # Any successful mutation may change dashboard aggregates. Cache keys are
        # per-user and this invalidation never serves data across users.
        if request.method.upper() in {"POST", "PUT", "PATCH", "DELETE"} and 200 <= response.status_code < 300:
            delete_pattern("mecw:dashboard:*")

        # Log successful responses only.
        if not 200 <= response.status_code < 300:
            return response

        method = request.method.upper()
        path = request.url.path.rstrip("/") or "/"

        # Ignore documentation, authentication and audit-read endpoints.
        skip_paths = (
            "/docs",
            "/redoc",
            "/openapi.json",
            "/auth/login",
            "/auth/register",
            "/audit-logs",
        )

        if any(
            path == item or path.startswith(item + "/")
            for item in skip_paths
        ):
            return response

        # Read-only requests should not create audit records.
        if method not in {"POST", "PUT", "PATCH", "DELETE"}:
            return response

        auth_header = request.headers.get("Authorization", "")

        if not auth_header.startswith("Bearer "):
            return response

        token = auth_header[len("Bearer "):].strip()

        if not token:
            return response

        db: Session = SessionLocal()

        try:
            user = None

            # 1. Try a local JWT first.
            try:
                local_payload = jwt.decode(
                    token,
                    SECRET_KEY,
                    algorithms=[ALGORITHM],
                )

                subject = local_payload.get("sub")

                if subject is not None:
                    try:
                        user_id = int(subject)
                        user = (
                            db.query(User)
                            .filter(User.id == user_id)
                            .first()
                        )
                    except (TypeError, ValueError):
                        user = None

            except (JWTError, TypeError, ValueError):
                user = None

            # 2. If it isn't a local JWT, validate it as an Auth0 token.
            if user is None:
                credentials = HTTPAuthorizationCredentials(
                    scheme="Bearer",
                    credentials=token,
                )

                try:
                    payload = get_current_auth0_payload(
                        credentials=credentials
                    )
                except Exception:
                    logger.warning(
                        "Audit log skipped: token validation failed."
                    )
                    return response

                email = (
                    payload.get("email")
                    or payload.get(EMAIL_CLAIM)
                )

                if not email:
                    logger.warning(
                        "Audit log skipped: Auth0 email claim missing."
                    )
                    return response

                user = (
                    db.query(User)
                    .filter(User.email == email)
                    .first()
                )

            # 3. No matching local user means no audit record.
            if user is None:
                logger.warning(
                    "Audit log skipped: no matching local user."
                )
                return response

            # Determine the entity and numeric ID from the URL.
            parts = [part for part in path.split("/") if part]

            if not parts:
                return response

            entity = parts[0].replace("-", "_").title()

            entity_id = next(
                (
                    int(part)
                    for part in parts[1:]
                    if part.isdigit()
                ),
                None,
            )

            action = f"{method}_{parts[0].upper()}"

            create_audit_log(
                db=db,
                user_id=user.id,
                action=action,
                entity=entity,
                entity_id=entity_id,
                description=f"{method} {path}",
            )

            logger.info(
                "Audit log created: user_id=%s action=%s",
                user.id,
                action,
            )

        except Exception:
            # Logging failure must not change the original API response.
            logger.exception("Failed to create audit log.")

        finally:
            db.close()

        return response
