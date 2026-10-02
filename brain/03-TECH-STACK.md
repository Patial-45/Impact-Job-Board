# Technology stack

pnpm 11.19.0 + Turborepo 2.5.8; Node 22.12+; TypeScript 5.9.2 strict. Web: Next.js 16.3.6 App Router, React 19.3.0, CSS tokens and shared React UI package. API: NestJS 11, Express adapter, Swagger, Zod, Argon2id, cookie sessions. Data: PostgreSQL 16, Prisma 6.19.3. Async: Redis 7 and BullMQ 5 contract only. Test: Vitest. CI: GitHub Actions. Code style: ESLint 9, Prettier 3.6.2.

Use managed PostgreSQL and Redis in production. Cloudflare R2 is the target object store via S3-compatible adapter. Vercel hosts web; Railway, Render or Fly.io can host the API and later worker. No provider is configured by default. Version updates require compatibility testing and a decision note when architecture changes.
