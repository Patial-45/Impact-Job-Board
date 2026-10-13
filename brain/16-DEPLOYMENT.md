# Deployment and operations

Target: Vercel web; Railway/Render/Fly.io compatible Node API; managed PostgreSQL; managed Redis; Cloudflare R2. Later worker deploys as separate long-running process. CI validates install, Prisma generation, lint, typecheck, tests and build. No credential-dependent deployment workflow exists yet.

Required active environment: `DATABASE_URL`, `AUTH_SECRET` (32+ random chars), `WEB_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`, `API_PORT`, `NODE_ENV`. Reserved: `REDIS_URL`, Google OAuth IDs/secrets, OpenAI/Anthropic keys, S3 endpoint/region/bucket/access/secret, `RESEND_API_KEY`, `SENTRY_DSN`, `NEXT_PUBLIC_POSTHOG_KEY`. Only `NEXT_PUBLIC_*` values may reach browser code. Use secret stores and separate environments. Cookies across different production subdomains require explicit domain/SameSite/CSRF design before deployment; the current host-only cookie arrangement is verified for localhost only.

Database migrations run as a controlled release step with backup and rollback plan; never run `migrate dev` in production. Redis is not in a live request path yet.

Production Probes & Observability (Verified Phase 12):
1. **Health Probes**:
   - `GET /api/v1/health/live` & `/api/v1/health/liveness`: Lightweight Kubernetes/container orchestrator liveness probe returning `{ status: 'ok', uptimeSeconds, timestamp }`.
   - `GET /api/v1/health/ready` & `/api/v1/health/readiness`: Traffic readiness check executing `SELECT 1` on PostgreSQL, measuring latency in ms, inspecting heap and RSS memory consumption (`process.memoryUsage()`), returning HTTP 200 `{ status: 'ready', database: { status: 'connected', latencyMs }, memory: { heapUsedMb, rssMb }, uptimeSeconds }` or HTTP 503 if database is unreachable.
   - `GET /api/v1/health`: Legacy health endpoint backward-compatible with external monitoring services.
2. **Structured JSON Logging & Observability**:
   - `ObservabilityService` formats all events as structured JSON logs with standardized fields (`timestamp`, `level`, `event`, `correlationId`, `metadata`, `error`).
   - Integrated Sentry error hook (`SENTRY_DSN` detection).
3. **Web Error Boundaries & Headers**:
   - Production error boundaries: `apps/web/src/app/not-found.tsx`, `error.tsx` (with digest display and retry physics), and `global-error.tsx`.
   - Next.js security headers in `next.config.ts`: HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy.

