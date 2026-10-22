# Mini Enterprise Collaboration & Workflow (MECW) — Phase 4

This is the cleaned File Two project. The existing Phase 1–3 workflow UI and API remain in place; Phase 4 adds Auth0-backed OAuth flows, user provisioning, tenant administration APIs, Docker Compose setup, and Swagger documentation for each service.

## Services and ports

| Service | URL | Swagger |
|---|---|---|
| Main workflow API | http://localhost:8000 | http://localhost:8000/docs |
| Authentication microservice | http://localhost:8001 | http://localhost:8001/docs |
| User microservice | http://localhost:8002 | http://localhost:8002/docs |
| Tenant Admin microservice | http://localhost:8003 | http://localhost:8003/docs |
| React + Vite frontend | http://localhost:5173 | — |
| MySQL | localhost:3306 | MySQL Workbench |

## 1. Configure environment

1. Copy `.env.example` to `.env` in the project root.
2. Fill in the Auth0 values and replace all example passwords/secrets.
3. Keep `.env` private. Do not commit it to GitHub.

`AUTH0_DOMAIN` must be the Auth0 tenant domain without `https://`, for example `example.us.auth0.com`. `AUTH0_AUDIENCE` must exactly match the Identifier of the Auth0 API you created (the example uses `https://mecw-api`). The React client ID belongs to an Auth0 **Single Page Application**. For manual frontend-only development, copy `mini-enterprise-frontend/.env.example` to `mini-enterprise-frontend/.env` and fill in those Vite variables.

### Auth0 SPA settings

For the SPA application, set:

- Allowed Callback URLs: `http://localhost:5173`
- Allowed Logout URLs: `http://localhost:5173`
- Allowed Web Origins: `http://localhost:5173`
- API access token signing algorithm: RS256

Enable the Google connection for the SPA. For Microsoft, enable a Microsoft/Entra ID connection in Auth0 and set `VITE_AUTH0_MICROSOFT_CONNECTION` to that exact Auth0 connection name. `windowslive` is only a default; use the actual name configured in your tenant.

Create an Auth0 **API** whose Identifier matches `AUTH0_AUDIENCE`. Add a Post Login Action to add verified profile claims to the access token:

```javascript
exports.onExecutePostLogin = async (event, api) => {
  const namespace = "https://mecw-api/";
  if (event.user.email) api.accessToken.setCustomClaim(`${namespace}email`, event.user.email);
  if (event.user.name) api.accessToken.setCustomClaim(`${namespace}name`, event.user.name);
};
```

Deploy and add this Action to the Login flow. MECW roles are read from the database; do not trust a role supplied by the browser or a social-provider token.

### Optional server-side OAuth callback endpoints

The endpoints under `/auth/google/*` and `/auth/microsoft/*` on port 8001 are also provided for the requested microservice API contract. To use these endpoints, create a separate Auth0 **Regular Web Application** and set `AUTH0_CLIENT_ID` and `AUTH0_CLIENT_SECRET` for that application in the root `.env`. Configure its Allowed Callback URLs as:

- `http://localhost:8001/auth/google/callback`
- `http://localhost:8001/auth/microsoft/callback`

Never put `AUTH0_CLIENT_SECRET` in a `VITE_` variable or frontend file. The React frontend uses the Auth0 SPA SDK directly for the normal interactive login/logout flow.

## 2. Start the project

From the project root:

```bash
cp .env.example .env
# Edit .env with your own Auth0 values and strong passwords.
docker compose up -d --build
```

Check the services:

```bash
docker compose ps
docker compose logs --tail=100 backend auth-service user-service tenant-admin-service frontend
```

Open http://localhost:5173. Google and Microsoft buttons use the configured Auth0 connection names. A Microsoft login works only after Microsoft Entra ID is configured and enabled in Auth0; code cannot bypass Microsoft tenant/account verification.

## 3. OAuth and role behavior

- The React app obtains an Auth0 access token and sends it as `Authorization: Bearer <token>`.
- The User Service validates the token through Auth0 JWKS validation, then creates the user record if this email has not been seen before.
- A newly provisioned social-login user receives `employee`. Existing database roles and inactive-account state are preserved; login never promotes a user to admin automatically.
- Dashboard/role displays use the backend user record rather than assuming that a missing Auth0 role claim means `employee`.
- The main workflow API validates Auth0 tokens and maps the email to the database user.
- Tenant Admin endpoints validate through User Service and enforce tenant membership/role checks.
- Missing, invalid, or expired tokens are rejected with HTTP 401. Inactive users and insufficient roles are rejected with HTTP 403.

To promote a trusted existing account to administrator, update the `users.role` value through your authorized admin workflow/database. Do not make the frontend choose its own role.

## 4. Swagger smoke tests

Open each `/docs` URL in the table above. Use the **Authorize** control with an Auth0 access token for the `https://mecw-api` audience. Include the `Bearer ` prefix only if Swagger's dialog requests it.

Authentication Service:

- `GET /auth/google/login`
- `GET /auth/google/callback`
- `GET /auth/google/logout`
- `GET /auth/microsoft/login`
- `GET /auth/microsoft/callback`
- `GET /auth/microsoft/logout`
- `GET /auth/me`
- `GET /auth/provider`
- `GET /api/protected`
- `GET /auth/validate`

User Service:

- `GET /users/me` (also provisions a first-time OAuth user)
- `POST /users/` (authenticated provisioning/sync)
- `GET /users/{user_id}` (self or manager/admin)

Tenant Admin Service:

- `POST /tenants/` — admin only
- `GET /tenants/{tenant_id}`
- `GET /tenants/{tenant_id}/users` — tenant admin only
- `POST /tenants/{tenant_id}/users` — add/update tenant membership
- `PATCH /tenants/{tenant_id}/users/{user_id}/status`
- `PATCH /tenants/{tenant_id}/users/{user_id}/role`
- `GET /tenant-admin/me?tenant_id=1`

Try `GET /api/protected` with no token; it should return 401. A valid Auth0 access token should return 200. Callback URLs need a real browser OAuth round-trip and cannot be fully tested by pressing Execute without an Auth0 authorization code/state.

## 5. MySQL

Connect using MySQL Workbench:

- Host: `127.0.0.1`
- Port: `3306`
- Username/password: values in your `.env`
- Database: `enterprise_workflow_db` (or `DATABASE_NAME` in `.env`)

Useful query:

```sql
USE enterprise_workflow_db;
SHOW TABLES;
SELECT id, name, email, role, is_active FROM users ORDER BY id;
SELECT id, name, slug, is_active FROM tenants ORDER BY id;
SELECT tenant_id, user_id, role FROM tenant_memberships ORDER BY tenant_id, user_id;
```

## 6. Tests and limitations

The source is organized so each service exposes its own FastAPI Swagger UI. Runtime OAuth success depends on your actual Auth0 tenant, allowed URLs, API audience, Google connection, and Microsoft Entra ID connection. Those external settings cannot be validated from source code alone. Run the checks below after configuring `.env`:

```bash
python -m compileall app services
cd mini-enterprise-frontend && npm ci && npm run build
```

Do not remove your existing MySQL volume when updating the project; it may contain your current data. Take a database backup before destructive database or schema changes.

## Phase 5 — Security and Performance

### Authentication lifecycle

The local `/auth/login` endpoint now issues a 15-minute access token and a 7-day refresh token by default. Refresh tokens are stored as SHA-256 hashes, rotated at `/auth/refresh`, and revocable through `/auth/logout`. Protected local-JWT APIs reject tokens whose `type` is not `access`. Configure `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS`, and a strong `RESET_TOKEN_PEPPER` in the runtime environment.

Password reset endpoints:

- `POST /auth/forgot-password` with `{"email":"person@example.com"}`
- `POST /auth/reset-password` with `{"token":"...","new_password":"at-least-12-characters"}`

The forgot-password response is deliberately identical whether or not the email exists. Reset tokens are hashed at rest, expire after `PASSWORD_RESET_EXPIRE_MINUTES`, are single-use, and reset revokes existing refresh sessions. The reset token is placed in the URL fragment (`#token=...`) rather than a query string so it is not sent in the initial HTTP request URL/access log. Configure SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`) before demonstrating local-account delivery. The frontend offers both the local MECW reset request and an Auth0 database-connection reset request (`VITE_AUTH0_DB_CONNECTION`, default `Username-Password-Authentication`). Google/Microsoft users recover passwords with their identity provider. If SMTP is not configured, the API does not return the reset token; email delivery therefore cannot complete until SMTP is configured. Auth0-managed user passwords remain managed by Auth0 and should use the Auth0 password-reset flow for those accounts.

### Rate limiting

Redis is added to Docker Compose. Login is limited to 5 requests/minute per client IP; forgot-password to 3 requests/15 minutes; reset-password to 5 requests/15 minutes; refresh to 20 requests/minute. Limits are enforced by Redis fixed-window counters and return HTTP 429 with `Retry-After`. If Redis is unavailable, sensitive auth endpoints fail closed with HTTP 503 rather than silently disabling protection.

### Pagination, filtering and sorting

- `GET /tasks/?page=1&limit=20&status=todo&priority=high&sort_by=created_at&sort_order=desc`
- `GET /users/?page=1&limit=20&sort_order=asc&role=employee`
- `GET /approvals/?page=1&limit=20&status=pending&sort_order=desc`
- `GET /documents/task/123?page=1&limit=20&sort_order=desc` (requires task access)

Page starts at 1; limit is bounded to 1–100. Queries apply `OFFSET`/`LIMIT` in SQL rather than loading every row into Python. Existing list response shapes are retained for current frontend compatibility. Task queries eager-load creator/assignee relationships to avoid the common per-row relationship lookup pattern.

### Redis dashboard cache

Dashboard summary and task distribution use per-user/per-role keys and a 45-second TTL. Authentication and user lookup happen before cache access; cache entries are not shared between users. Task mutations invalidate dashboard cache keys. Cache failures fall back to database queries and are logged without exposing tokens.

### Database migrations and production notes

Run migrations from the backend container after reviewing the target database:

```bash
docker compose run --rm backend alembic upgrade head
```

The Phase 5 migration adds `refresh_tokens`, `password_reset_tokens`, and indexes for common task/document/approval/user filters. The previous project already contains `Base.metadata.create_all` at startup; this phase disables automatic schema creation by default. `AUTO_CREATE_TABLES=true` is available only as a local-development compatibility switch. Do not enable it as a substitute for migrations in production.

### Query-plan evidence

Run these against the same database and retain the actual `EXPLAIN` output with the delivery screenshots. Index choice depends on real row counts and the database optimizer, so do not claim an index improved latency until measured on representative data.

```sql
EXPLAIN SELECT id, title, status, priority, created_at
FROM tasks
WHERE status = 'todo' AND priority = 'high'
ORDER BY created_at DESC LIMIT 20;

EXPLAIN SELECT id, title, created_at
FROM documents
WHERE task_id = 123
ORDER BY created_at DESC LIMIT 20;
```

### Verification checklist

1. `docker compose up -d --build` and confirm all services are healthy.
2. Run `docker compose run --rm backend alembic upgrade head` against a backup/dev database first.
3. Test refresh rotation, replay of the old refresh token (must return 401), logout revocation, expired token, and reset-token reuse/expiry in Swagger.
4. Configure SMTP and confirm reset email arrives; do not expose tokens in logs.
5. Demonstrate HTTP 429 by exceeding the configured request limit.
6. Test task/user pagination and query filters with multiple records.
7. Run the two `EXPLAIN` queries and save the actual outputs.
8. Verify Google/Microsoft Auth0 login and all existing workflow APIs still work.

**Important validation status:** source syntax and Compose YAML are checked during packaging. Full Docker runtime, live OAuth, SMTP delivery, Redis behavior under load, and query-plan/latency comparisons require running the stack against your own configured environment and database. Do not mark those as passed until the evidence is captured.
