# Deployment and operations

Target: Vercel web; Railway/Render/Fly.io compatible Node API; managed PostgreSQL; managed Redis; Cloudflare R2. Later worker deploys as separate long-running process. CI validates install, Prisma generation, lint, typecheck, tests and build. No credential-dependent deployment workflow exists yet.

Required active environment: `DATABASE_URL`, `AUTH_SECRET` (32+ random chars), `WEB_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`, `API_PORT`, `NODE_ENV`. Reserved: `REDIS_URL`, Google OAuth IDs/secrets, OpenAI/Anthropic keys, S3 endpoint/region/bucket/access/secret, `RESEND_API_KEY`, `SENTRY_DSN`, `NEXT_PUBLIC_POSTHOG_KEY`. Only `NEXT_PUBLIC_*` values may reach browser code. Use secret stores and separate environments. Cookies across different production subdomains require explicit domain/SameSite/CSRF design before deployment; the current host-only cookie arrangement is verified for localhost only.

Database migrations run as a controlled release step with backup and rollback plan; never run `migrate dev` in production. Health checks must cover database readiness. Redis is not in a live request path yet. Add JSON log aggregation, Sentry adapter, PostHog consent and backup restore tests before launch.
