# Security baseline

Authenticate every protected API route. Authorize against database membership and workspace-scoped queries for employer data. Validate input with schemas and database constraints. Prisma parameterization prevents routine SQL injection; review raw SQL separately. Escape user content on rendering, avoid unsafe HTML. Use HttpOnly, Secure production, SameSite cookies, origin checks and CSRF tokens if cross-site use expands. Rate limit auth and later expensive actions (`ThrottlerModule` active across API endpoints).

Password hashing is Argon2id. Opaque session token hashes are stored, never raw tokens. OAuth needs state/PKCE, verified identity and safe account linking. Secrets belong in environment/secret manager. Do not log credentials, resumes, sensitive PII, tokens or AI prompts by default. Restrict AI provider data and redact telemetry; uploaded documents are untrusted against prompt injection.

Production Security Hardening (Verified Phase 12):
1. **Security Headers**:
   - NestJS API (`main.ts`): Helmet configured with strict policies: HSTS (`max-age=31536000; includeSubDomains; preload`), `frameguard` (`DENY`), `noSniff` (`nosniff`), `referrerPolicy` (`strict-origin-when-cross-origin`), and cross-origin resource policy.
   - Next.js Web (`next.config.ts`): Response headers configured with `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=()`, `X-XSS-Protection: 1; mode=block`, and DNS prefetch control.
2. **Exception Sanitization & Error Masking**:
   - `HttpErrorFilter` suppresses internal database and system stack traces in production (`process.env.NODE_ENV === 'production'`), returning safe message `'An unexpected internal error occurred. Please contact support with your request ID.'` while logging full error details with correlation IDs server-side.
3. **Telemetry & Log Redaction**:
   - `RequestContextMiddleware` and `ObservabilityService` sanitize query strings and payload metadata, automatically masking sensitive fields (`password`, `token`, `secret`, `apiKey`, `keyHash`, `authorization`, `cookie`, `signingSecret`).
4. **Origin Guard & Tenant Boundaries**:
   - Mutation requests (`POST`, `PUT`, `PATCH`, `DELETE`) enforce matching origin against `WEB_URL`. Tenant access is verified at the database layer via `WorkspaceAccessService`.

