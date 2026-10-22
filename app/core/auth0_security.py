
from functools import lru_cache
import json
from urllib.request import urlopen

from fastapi import Depends, HTTPException
from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials,
)
from jose import jwt, JWTError
from jose.exceptions import ExpiredSignatureError

from app.core.config import settings


bearer_scheme = HTTPBearer(auto_error=False)

AUTH0_DOMAIN = settings.auth0_domain
AUTH0_AUDIENCE = settings.auth0_audience
AUTH0_ISSUER = f"https://{AUTH0_DOMAIN}/"

EMAIL_CLAIM = "https://mecw-api/email"
NAME_CLAIM = "https://mecw-api/name"


@lru_cache(maxsize=1)
def get_jwks():
    """Retrieve and cache Auth0 public signing keys."""

    jwks_url = f"{AUTH0_ISSUER}.well-known/jwks.json"

    try:
        with urlopen(jwks_url, timeout=10) as response:
            return json.loads(response.read())

    except Exception as exc:
        print("Unable to retrieve Auth0 signing keys")
        raise HTTPException(
            status_code=503,
            detail="Unable to retrieve Auth0 signing keys",
        ) from exc


def get_current_auth0_payload(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        bearer_scheme
    ),
) -> dict:
    """Validate an Auth0 RS256 access token."""

    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Bearer access token is required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    try:
        header = jwt.get_unverified_header(token)

        if header.get("alg") != "RS256":
            raise HTTPException(
                status_code=401,
                detail="Expected an Auth0 RS256 access token",
            )

        token_kid = header.get("kid")

        if not token_kid:
            raise HTTPException(
                status_code=401,
                detail="Token signing key ID is missing",
            )

        jwks = get_jwks()

        rsa_key = next(
            (
                key
                for key in jwks.get("keys", [])
                if key.get("kid") == token_kid
                and key.get("kty") == "RSA"
            ),
            None,
        )

        if rsa_key is None:
            get_jwks.cache_clear()
            jwks = get_jwks()

            rsa_key = next(
                (
                    key
                    for key in jwks.get("keys", [])
                    if key.get("kid") == token_kid
                    and key.get("kty") == "RSA"
                ),
                None,
            )

        if rsa_key is None:
            raise HTTPException(
                status_code=401,
                detail="Auth0 signing key not found",
            )

        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            audience=AUTH0_AUDIENCE,
            issuer=AUTH0_ISSUER,
        )

        if not payload.get("sub"):
            raise HTTPException(
                status_code=401,
                detail="Auth0 token subject is missing",
            )

        # Log claim names only. Never print token or claim values.
        print(
            "Auth0 payload claim names:",
            sorted(payload.keys()),
        )
        print("Auth0 token validation successful")

        return payload

    except HTTPException:
        raise

    except ExpiredSignatureError as exc:
        raise HTTPException(
            status_code=401,
            detail="Auth0 access token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    except JWTError as exc:
        print("Auth0 token validation failed: JWT validation error")
        raise HTTPException(
            status_code=401,
            detail="Invalid Auth0 access token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    except Exception as exc:
        print(
            "Auth0 token validation failed:",
            type(exc).__name__,
        )
        raise HTTPException(
            status_code=401,
            detail="Unable to validate Auth0 access token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


def get_current_auth0_user(
    payload: dict = Depends(get_current_auth0_payload),
) -> dict:
    """Return basic information from a verified Auth0 token."""

    email = payload.get("email") or payload.get(EMAIL_CLAIM)
    name = payload.get("name") or payload.get(NAME_CLAIM)

    return {
        "auth0_id": payload.get("sub"),
        "email": email,
        "name": name,
    }
