# Testing strategy

Unit tests: pure RBAC and validation, then domain calculations. Integration tests: Prisma repositories and auth session lifecycle against temporary PostgreSQL. API tests: Supertest for login, logout, workspace isolation, job creation and application writes. Component tests for complex forms and accessibility behavior. Playwright E2E for registration/login, profile, job creation, application and ATS stage transitions when each exists. Matching requires fixture-based relevance and explanation evaluations, not snapshot-only tests.

CI runs lint, typecheck, Vitest and builds. Critical missing gates are database/API integration tests and browser E2E; add them as modules mature. Never treat a green unit suite as proof that Postgres, Docker or provider integrations work. See [Current State](23-CURRENT-STATE.md) for this session's actual validation.
