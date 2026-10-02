# Executive Match

Executive Match is a workspace-aware recruitment platform under development. This repository is the Phase 0 foundation: a Next.js web app, NestJS API, PostgreSQL schema, shared packages, and architectural memory in [`brain/`](brain/00-PROJECT-MASTER.md). Product modules beyond authentication are intentionally incomplete.

## Requirements

- Node.js 22.12+ and pnpm 11.19.0
- Docker Desktop for local PostgreSQL and Redis

## Local setup

```powershell
Copy-Item .env.example .env
pnpm install
docker compose up -d
pnpm db:generate
pnpm db
pnpm dev
```

Use a random 32+ character `AUTH_SECRET` in `.env`. `pnpm db` applies the committed initial migration and creates reviewed migrations for later schema changes. The web app runs at http://localhost:3000, API at http://localhost:4000/api/v1, and Swagger at http://localhost:4000/api/docs. API liveness is `/api/v1/health/live`; readiness is `/api/v1/health` and requires PostgreSQL. Redis runs locally but no application request requires it yet.

## Quality checks

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Environment

`DATABASE_URL`, `AUTH_SECRET`, `WEB_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL`, and `API_PORT` are active. `REDIS_URL`, OAuth, AI, storage, Resend, Sentry, and PostHog variables are reserved for future integrations. See `.env.example` and [`brain/16-DEPLOYMENT.md`](brain/16-DEPLOYMENT.md). Never commit `.env`.

## Architecture at a glance

- `apps/web`: Next.js App Router, public pages and protected shells.
- `apps/api`: NestJS REST API, credentials authentication, session cookies, workspace membership, health.
- `packages/database`: Prisma schema and client.
- `packages/auth`, `validation`, `config`, `types`, `shared`, `ui`: cross-app contracts and primitives.
- `packages/ai`, `storage`, `email`: provider interfaces only.
- `workers/processing`: BullMQ queue contract, no worker process yet.
- `brain`: source of truth for product and architecture.

Read [`brain/00-PROJECT-MASTER.md`](brain/00-PROJECT-MASTER.md) before modifying the repository. See [`brain/23-CURRENT-STATE.md`](brain/23-CURRENT-STATE.md) for the exact status and next tasks.
