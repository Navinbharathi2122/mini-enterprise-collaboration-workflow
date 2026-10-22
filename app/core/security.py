
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException
from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials,
)
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.core.auth0_security import (
    get_current_auth0_payload,
    EMAIL_CLAIM,
)


pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)

SECRET_KEY = settings.secret_key
ALGORITHM = settings.algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = settings.access_token_expire_minutes

bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return pwd_context.verify(password, hashed_password)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({"exp": expire})

    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        bearer_scheme
    ),
    db: Session = Depends(get_db),
) -> User:
    """Authenticate a local JWT or an Auth0 access token."""

    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Bearer access token is required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    # Step 1: Try authenticating a local JWT.
    try:
        local_payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        if local_payload.get("type", "access") != "access":
            raise ValueError("Wrong token type")

        subject = local_payload.get("sub")

        if subject is None:
            raise ValueError("Token subject is missing")

        user_id = int(subject)

        user = (
            db.query(User)
            .filter(User.id == user_id)
            .first()
        )

        if user is None:
            raise HTTPException(
                status_code=401,
                detail="Local user not found",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(
                status_code=403,
                detail="User account is inactive",
            )

        return user

    except HTTPException:
        raise

    except (JWTError, TypeError, ValueError):
        # Not a valid local JWT; try Auth0 validation.
        pass

    # Step 2: Validate the Auth0 access token.
    payload = get_current_auth0_payload(
        credentials=credentials
    )

    email = payload.get("email") or payload.get(EMAIL_CLAIM)
    email = str(email).strip().lower() if email else None

    if not email:
        raise HTTPException(
            status_code=401,
            detail=(
                "Email claim is missing from the Auth0 access token. "
                "Configure a Post Login Action to add the email claim."
            ),
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Step 3: Match Auth0 email to a local database user.
    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=401,
            detail=(
                "No local user account matches the Auth0 email. "
                "Create or link the user account first."
            ),
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Step 4: Block inactive users.
    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="User account is inactive",
        )

    return user
