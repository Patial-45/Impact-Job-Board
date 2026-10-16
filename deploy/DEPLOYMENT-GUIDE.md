# Executive Match — Production Cloud Deployment Guide

This operations guide specifies the end-to-end procedure for deploying Executive Match to production infrastructure with 100% tenant boundary isolation, zero-downtime rolling deploys, and automated health checks.

---

## 1. Target Production Architecture

```
                    ┌───────────────────────────────┐
                    │     Cloudflare Edge (DNS)     │
                    └───────────────┬───────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌───────────────────────┐                         ┌───────────────────────┐
│      Vercel Edge      │                         │  Railway / Render     │
│   Next.js 16 Web App  │ ─── HTTPS / Cookies ───▶│   NestJS 11 REST API  │
│  executivematch.com   │                         │ api.executivematch.com│
└───────────────────────┘                         └───────────┬───────────┘
                                                              │
                     ┌────────────────────────────────────────┼────────────────────────┐
                     ▼                                        ▼                        ▼
        ┌─────────────────────────┐              ┌─────────────────────────┐  ┌──────────────────┐
        │   Managed PostgreSQL    │              │      Managed Redis      │  │  Cloudflare R2   │
        │  (Neon/Supabase/Cloud)  │              │    (Upstash/Railway)    │  │  (S3-Compatible) │
        │     PostgreSQL 16       │              │      BullMQ Queues      │  │ Private Storage  │
        │       + pgvector        │              └────────────┬────────────┘  └──────────────────┘
        └─────────────────────────┘                           │
                                                              ▼
                                                 ┌─────────────────────────┐
                                                 │ BullMQ Processing Worker│
                                                 │   (Standalone Service)  │
                                                 └─────────────────────────┘
```

---

## 2. Step 1: Database Provisioning (PostgreSQL 16 + pgvector)

1. Provision a managed PostgreSQL 16 database instance (e.g. Neon Serverless, Supabase, or Railway PostgreSQL).
2. Enable SSL (`sslmode=require`).
3. Ensure the `pgvector` extension is active:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
4. Run production migrations from your deployment pipeline or administrator terminal:
   ```bash
   pnpm db:migrate:deploy
   ```
   > **Note:** Never execute `pnpm db:migrate:dev` in a production environment.

---

## 3. Step 2: Managed Redis Provisioning (BullMQ Async Jobs)

1. Provision a managed Redis 7 instance with TLS enabled (e.g. Upstash Redis, Railway Redis, or Redis Enterprise).
2. Configure maximum memory eviction policy:
   ```
   maxmemory-policy: allkeys-lru
   ```
3. Copy the secure connection string (`rediss://default:<password>@<host>:<port>`).

---

## 4. Step 3: Cloudflare R2 Private Bucket Configuration

1. Log in to the Cloudflare Dashboard and navigate to **R2 Object Storage**.
2. Create a private bucket named `executive-match-production-resumes`.
3. Create an API Token with **Object Read & Write** permissions.
4. Configure CORS rules on the bucket to allow presigned browser `PUT` uploads:
   ```json
   [
     {
       "AllowedOrigins": [
         "https://executivematch.com",
         "https://www.executivematch.com"
       ],
       "AllowedMethods": ["GET", "PUT", "HEAD"],
       "AllowedHeaders": ["*"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

---

## 5. Step 4: NestJS API Deployment (Railway or Render)

### Option A: Deploying via Railway
1. Connect your GitHub repository to Railway.
2. Railway will automatically detect [`railway.toml`](file:///c:/Users/HP/Desktop/Projects/Executive%20Match/railway.toml).
3. Set the required Environment Variables from [`.env.production.example`](file:///c:/Users/HP/Desktop/Projects/Executive%20Match/.env.production.example):
   - `NODE_ENV=production`
   - `DATABASE_URL`
   - `REDIS_URL`
   - `AUTH_SECRET` (generate using `openssl rand -base64 48`)
   - `WEB_URL=https://executivematch.com`
   - `NEXT_PUBLIC_API_URL=https://api.executivematch.com/api/v1`
4. Set custom domain to `api.executivematch.com`.
5. Verify health check: Railway probes `/api/v1/health/ready`.

### Option B: Deploying via Render
1. Create a Blueprint Instance by linking your repository.
2. Render will parse [`render.yaml`](file:///c:/Users/HP/Desktop/Projects/Executive%20Match/render.yaml).
3. Confirm creation of:
   - `executive-match-api` (Web Service)
   - `executive-match-worker` (Background Worker)
   - `executive-match-postgres` (Database)
   - `executive-match-redis` (Cache & Queues)

---

## 6. Step 5: BullMQ Background Worker Service Deployment

The worker executes resume parsing, AI semantic embedding calculations, and email notification dispatch asynchronously outside the HTTP request lifecycle.

1. Deploy as a separate continuous process alongside the API.
2. Start command:
   ```bash
   pnpm --filter @executive-match/processing start
   ```
3. Share the same `DATABASE_URL`, `REDIS_URL`, and `AUTH_SECRET` environment variables.

---

## 7. Step 6: Next.js Frontend Deployment (Vercel)

1. Import the repository into Vercel.
2. Configure Project Settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `pnpm build`
   - **Install Command**: `pnpm install`
3. Configure Environment Variables:
   - `NEXT_PUBLIC_API_URL=https://api.executivematch.com/api/v1`
   - `NEXT_PUBLIC_APP_URL=https://executivematch.com`
   - `NODE_ENV=production`
4. Add Custom Domains: `executivematch.com` and `www.executivematch.com`.

---

## 8. Step 7: Domain, Cookie & Security Verification

1. **Host-Only vs Subdomain Cookies**:
   - Because the frontend is on `executivematch.com` and the API is on `api.executivematch.com`, the session cookie emitted by `/auth/login` uses `SameSite=Lax` and `Secure=true`.
   - In production, set the cookie domain to `.executivematch.com` or route the API through a Next.js reverse-proxy rewrite rule if host-only cookies are preferred.
2. **Health Check Probes**:
   - Liveness Probe: `https://api.executivematch.com/api/v1/health/live` (HTTP 200 `{ status: 'ok' }`)
   - Readiness Probe: `https://api.executivematch.com/api/v1/health/ready` (HTTP 200 `{ status: 'ready', database: 'connected' }`)
3. **Observability**:
   - Verify structured JSON logs in container stdout.
   - Verify crash alerts flow into Sentry if `SENTRY_DSN` is set.
