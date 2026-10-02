# API contracts

Base path `/api/v1`. REST initially. Single resources return the resource or a named object when response context matters (`{ user }` for auth). Collections return `{ items, page, pageSize, total }` when paginated; simple bounded lists may return `{ items }`. Do not wrap every response in `data`.

Implemented: `POST /auth/register` (201), `POST /auth/login` (200 + cookie), `POST /auth/logout` (204), `GET /auth/me` (200/401), `GET /workspaces` (member workspaces), `GET /workspaces/:slug` (membership required), `GET /health` (database readiness). Swagger at `/api/docs`.

Errors: `{ "code": "VALIDATION_ERROR", "message": { ... }, "requestId": "..." }`. Use 400 validation, 401 unauthenticated, 403 forbidden, 404 absent resource, 409 conflict, 429 throttled, 500 sanitized server failure. IDs and timestamps use JSON strings in UTC. `x-request-id` is returned and logged. Future list endpoints use `page`/`pageSize` with caps, allowlisted filter/sort fields and stable secondary ID sort. Never expose raw database errors. Validation lives in `packages/validation` for shared contracts and at API boundaries for writes.

Future endpoints: `/users`, `/candidates`, `/jobs`, `/applications`, `/matches`, `/workspaces/:slug/...`; workspace context is explicit, with server-side membership on every nested request. Breaking response changes require `/api/v2` or a compatible migration period.
