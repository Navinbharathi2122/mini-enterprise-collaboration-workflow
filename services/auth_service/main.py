"""Auth0 authentication microservice. The React SPA uses Auth0's official SDK;
these endpoints provide documented provider-specific OAuth redirects and token validation.
"""
import os
import secrets
from urllib.parse import urlencode

import httpx
from fastapi import Depends, FastAPI, HTTPException, Query, Request
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.auth0_security import get_current_auth0_payload, EMAIL_CLAIM, NAME_CLAIM

app = FastAPI(title="Authentication Microservice", version="2.0.0")
bearer_scheme = HTTPBearer(auto_error=False)

def _env(name: str, default: str = "") -> str:
    return os.getenv(name, default).strip()

def _domain() -> str:
    value = _env("AUTH0_DOMAIN") or _env("auth0_domain")
    if not value:
        raise HTTPException(status_code=503, detail="AUTH0_DOMAIN is not configured")
    return value.removeprefix("https://").rstrip("/")

def _client_id() -> str:
    value = _env("AUTH0_CLIENT_ID") or _env("VITE_AUTH0_CLIENT_ID")
    if not value:
        raise HTTPException(status_code=503, detail="AUTH0_CLIENT_ID is not configured")
    return value

def _callback_url(path: str = "/auth/callback") -> str:
    configured = _env("AUTH0_CALLBACK_URL")
    if configured:
        return configured
    return "http://localhost:8001" + path

def _login_redirect(connection: str, callback_path: str) -> RedirectResponse:
    domain = _domain()
    state = secrets.token_urlsafe(32)
    params = {
        "client_id": _client_id(), "response_type": "code", "response_mode": "query",
        "scope": "openid profile email", "redirect_uri": _callback_url(callback_path), "state": state,
        "connection": connection,
    }
    audience = _env("AUTH0_AUDIENCE") or _env("auth0_audience")
    if audience:
        params["audience"] = audience
    response = RedirectResponse(f"https://{domain}/authorize?{urlencode(params)}", status_code=302)
    response.set_cookie("mecw_oauth_state", state, httponly=True, secure=_env("COOKIE_SECURE", "false").lower() == "true", samesite="lax", max_age=600)
    return response

@app.get("/")
def root():
    return {"service": "Authentication Microservice", "status": "running"}

@app.get("/auth/google/login")
def google_login():
    return _login_redirect(_env("AUTH0_GOOGLE_CONNECTION", "google-oauth2"), "/auth/google/callback")

@app.get("/auth/microsoft/login")
def microsoft_login():
    return _login_redirect(_env("AUTH0_MICROSOFT_CONNECTION", "windowslive"), "/auth/microsoft/callback")

@app.get("/auth/callback")
async def oauth_callback(request: Request, code: str = Query(...), state: str = Query(...)):
    expected = request.cookies.get("mecw_oauth_state")
    if not expected or not secrets.compare_digest(expected, state):
        raise HTTPException(status_code=400, detail="Invalid OAuth state. Restart login.")
    domain = _domain()
    client_secret = _env("AUTH0_CLIENT_SECRET")
    if not client_secret:
        raise HTTPException(status_code=503, detail="AUTH0_CLIENT_SECRET is required for the microservice callback. Configure it in .env; never expose it to the frontend.")
    data = {"grant_type": "authorization_code", "client_id": _client_id(), "client_secret": client_secret, "code": code, "redirect_uri": request.url.scheme + "://" + request.url.netloc + request.url.path}
    async with httpx.AsyncClient(timeout=15) as client:
        token_response = await client.post(f"https://{domain}/oauth/token", json=data)
        if token_response.status_code >= 400:
            raise HTTPException(status_code=401, detail="Auth0 rejected the authorization code")
        tokens = token_response.json()
        access_token = tokens.get("access_token")
        if not access_token:
            raise HTTPException(status_code=502, detail="Auth0 callback did not return an access token")
        # Provision/update the signed-in user through the User Microservice.
        user_service_url = _env("USER_SERVICE_URL", "http://user-service:8002").rstrip("/")
        profile_response = await client.get(
            f"{user_service_url}/users/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if profile_response.status_code >= 400:
            raise HTTPException(status_code=profile_response.status_code if profile_response.status_code in (401, 403) else 502, detail="User Service could not provision the OAuth profile")
        profile = profile_response.json()
    response = JSONResponse({
        "authenticated": True,
        "provider": profile.get("provider", "unknown"),
        "email": profile.get("email"),
        "name": profile.get("name"),
        "role": profile.get("role"),
        "message": "OAuth callback completed and the User Service profile was synchronized.",
    })
    response.delete_cookie("mecw_oauth_state")
    return response

@app.get("/auth/google/callback")
async def google_callback(request: Request, code: str = Query(...), state: str = Query(...)):
    return await oauth_callback(request, code, state)

@app.get("/auth/microsoft/callback")
async def microsoft_callback(request: Request, code: str = Query(...), state: str = Query(...)):
    return await oauth_callback(request, code, state)

@app.get("/auth/google/logout")
def google_logout():
    return _logout_redirect()

@app.get("/auth/microsoft/logout")
def microsoft_logout():
    return _logout_redirect()

def _logout_redirect():
    domain = _domain()
    return_to = _env("FRONTEND_URL", "http://localhost:5173")
    params = urlencode({"client_id": _client_id(), "returnTo": return_to})
    return RedirectResponse(f"https://{domain}/v2/logout?{params}", status_code=302)

@app.get("/auth/me")
def auth_me(credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme)):
    payload = get_current_auth0_payload(credentials=credentials)
    return {"authenticated": True, "subject": payload.get("sub"), "email": payload.get("email") or payload.get(EMAIL_CLAIM), "name": payload.get("name") or payload.get(NAME_CLAIM), "provider": (payload.get("sub") or "").split("|", 1)[0] or "unknown"}

@app.get("/auth/provider")
def auth_provider(credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme)):
    payload = get_current_auth0_payload(credentials=credentials)
    subject = payload.get("sub", "")
    provider = subject.split("|", 1)[0] if "|" in subject else "unknown"
    return {"provider": provider, "subject": subject, "authenticated": True}

@app.get("/auth/validate")
def validate_token(credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme)):
    payload = get_current_auth0_payload(credentials=credentials)
    return {"authenticated": True, "subject": payload.get("sub"), "issuer": payload.get("iss"), "audience": payload.get("aud"), "email": payload.get("email") or payload.get(EMAIL_CLAIM), "name": payload.get("name") or payload.get(NAME_CLAIM), "provider": (payload.get("sub") or "").split("|", 1)[0] or "unknown"}

@app.get("/api/protected")
def protected_api(credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme)):
    payload = get_current_auth0_payload(credentials=credentials)
    return {"message": "Access granted", "subject": payload.get("sub"), "authenticated": True}
