# Architectural decisions

Date: 2026-09-29. Every substantive architecture change requires a new dated entry with decision, context, reasoning, alternatives and consequences.

## ADR-001 — Modular monolith

Decision: One NestJS API with domain modules. Context: one solo developer and early product uncertainty. Reasoning: simple transactions, deployments and debugging while retaining boundaries. Alternatives: microservices, backendless functions. Consequence: modules must avoid cross-domain coupling; extract services only when measured need arises.

## ADR-002 — PostgreSQL and future pgvector

Decision: PostgreSQL as source of truth; pgvector later. Context: relational hiring workflows and future semantic retrieval. Reasoning: strong constraints/transactions and extension path. Alternatives: document DB, separate vector DB now. Consequence: schema and indexes must be tenant-aware; vector indexes wait for data and evaluation.

## ADR-003 — Next.js and NestJS

Decision: Next.js 16 web and NestJS 11 API. Context: public SEO pages plus structured backend domains. Reasoning: React server rendering and explicit DI/modules. Alternatives: one Next.js app, Express-only API. Consequence: cross-origin cookie/deployment configuration needs care.

## ADR-004 — pnpm and Turborepo

Decision: pnpm workspaces + Turborepo. Context: multiple deployable apps and shared contracts. Reasoning: deterministic workspace installs and task graph. Alternatives: Nx, separate repos. Consequence: package dependencies and build graph must stay explicit.

## ADR-005 — Prisma 6.19.3

Decision: Pin Prisma 6.19.3 initially. Context: Prisma 8 is prerelease and Prisma 7 introduces a changed client/adapter setup. Reasoning: stable Postgres client with fewer setup variables during Phase 0. Alternatives: Prisma 7.10, raw SQL. Consequence: revisit upgrade with migration and build testing, not as a casual dependency bump.

## ADR-006 — Workspace tenancy and explicit roles

Decision: workspace membership is the tenant boundary; platform roles are separate. Context: users can work with multiple companies. Reasoning: clear access checks and ownership. Alternatives: single company per user, role-only filtering. Consequence: every employer record and API query needs workspace scope; administrators do not automatically gain tenant access.

## ADR-007 — REST first

Decision: versioned `/api/v1` REST with unwrapped resources and normalized errors. Context: clear client contracts and simple observability. Alternatives: GraphQL, tRPC. Consequence: maintain validation and version compatibility.

## ADR-008 — Redis/BullMQ for asynchronous work

Decision: Redis 7 and BullMQ job contract, no live jobs in Phase 0. Context: future resume parsing, notifications and indexing. Reasoning: durable retries and separate processors when needed. Alternatives: request-time processing, cloud queue. Consequence: later workers need idempotency, retry policy and monitoring.

## ADR-009 — Provider ports

Decision: AI, storage and email packages define interfaces independent of vendor SDKs. Context: OpenAI/Anthropic, R2/S3/local, Resend may evolve. Reasoning: keep domain logic testable and prevent SDK calls in controllers. Alternatives: direct vendor calls. Consequence: adapters and operational policies must be implemented with actual workflows.

## ADR-010 — Opaque database sessions

Decision: Argon2id passwords and hashed opaque cookie sessions. Context: simple revocation and server-side control. Reasoning: reduces JWT invalidation complexity. Alternatives: JWT, third-party auth SaaS. Consequence: database lookup on protected requests; production needs email verification, reset, CSRF review and rate limiting across replicas.

## ADR-011 — Separate liveness and readiness

Decision: `/health/live` reports process liveness; `/health` checks PostgreSQL readiness. Context: API startup and deployment health must distinguish process availability from database availability. Reasoning: lets the API start cleanly during a database outage while deployment traffic gating uses readiness. Alternatives: connect to database during module init. Consequence: deploy probes must target the correct endpoint.

## ADR-012 — Root local infrastructure file

Decision: keep `docker-compose.yml` at repository root instead of an `infrastructure/docker` tree. Context: local developer workflow is `docker compose up -d`. Reasoning: one discoverable command and no empty infrastructure wrapper. Alternatives: nested Compose file. Consequence: production manifests can be added under infrastructure when a target is chosen.

## ADR-013 — Self-hosted Next.js Google Fonts and design token standardization

Decision: Use `next/font/google` in `apps/web/src/app/layout.tsx` for `DM_Sans`, `Manrope`, and `Geist_Mono` with CSS variable injection and standard tokens in `globals.css`. Context: Eliminates external `@import` render-blocking stylesheet requests while maintaining strict typographic and color cadence across all public and shell pages. Reasoning: Zero-network-overhead font loading at build time with `display: 'swap'` ensures optimal LCP/CLS and privacy. Consequence: Fonts are bundled at build time; token changes remain centralized in `globals.css`.

## ADR-014 — Modular UI component library with client boundary annotations

Decision: Structure `@executive-match/ui` (`packages/ui`) into focused modules (primitives, forms, controls, navigation, feedback, data tables, and recruitment domain cards) with explicit `'use client';` annotations where React hooks/events are used. Context: Next.js 16 Server Components import packages without transpile boundaries by default; interactive components must declare client boundaries to be imported across both server and client pages. Reasoning: Avoids monolithic bundle overhead, maximizes server rendering for static parts, and enforces uniform accessible design primitives across all shells. Consequence: Pure server components must remain hook-free; interactive widgets declare `'use client'`.

## ADR-015 — SHA-256 hashed one-time tokens and anti-enumeration auth security

Decision: Store one-time verification tokens (`EmailVerificationToken`, `PasswordResetToken`, `WorkspaceInvitation`) only as SHA-256 hashes in PostgreSQL, transmitting unhashed cryptographically random tokens exclusively via direct email / invitation links. Password reset and email verification requests return generic success messages regardless of user existence to prevent account enumeration. Password resets immediately invalidate all existing active sessions for that user. Context: Protects against credential recovery attacks, database token leaks, and user enumeration while preserving strict multi-tenant invitation isolation. Alternatives: Storing plaintext tokens, JWT reset links with signatures. Consequence: Lost tokens cannot be recovered or inspected from database backups; users must request a new link upon token expiration.

## ADR-016 — Candidate profile ownership, signed object storage, and decoupled resume parsing

Decision: Candidates own their profile, experience, education, skills, and resume records. Direct binary upload to API servers is strictly bypassed: uploads request presigned/HMAC-signed short-lived (15 min) URLs directly targeting object storage (`@executive-match/storage`), capped at 10MB and restricted to PDF and Word documents. Resume downloads require time-limited signed URLs generated on-demand. Raw file contents are never stored in PostgreSQL or application logs. Resume metadata and parsing statuses are recorded in `CandidateResume`, setting up decoupled queue dispatch for background text extraction and AI indexing. Context: Enforces candidate privacy, GDPR storage boundaries, prevents denial-of-service file streaming through API nodes, and guarantees multi-version resume management. Alternatives: Storing PDFs in database blobs, streaming through NestJS controller endpoints. Consequence: Clients require a two-phase upload flow (request signed URL → PUT binary to storage → confirm registration).


