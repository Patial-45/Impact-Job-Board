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

## ADR-017 — Job Requisition Lifecycle, Tenant Isolation, and Public Discovery

Decision: Enforce tenant-isolated job management via `WorkspaceAccessService` and `jobs.read`/`jobs.write`/`workspace.manage` permissions. Requisitions use unique slugs (`${slugified-title}-${nanoid(6)}`) per job. Job status transitions (`DRAFT`, `PUBLISHED`, `CLOSED`, `ARCHIVED`) manage visibility: only `PUBLISHED` jobs belonging to active workspaces are surfaced via public discovery endpoints (`/api/v1/public/jobs`, `/api/v1/public/jobs/:slug`, `/api/v1/public/companies/:slug`). Skills are modeled as normalized relational tags (`JobSkill` with uniqueness on `[jobId, name]`). Company profile attributes (`website`, `industry`, `size`, `location`, `bannerKey`) are managed within tenant boundary and surfaced on public company pages (`/companies/[slug]`).
Context: Employer ATS requires strict multi-tenant requisition lifecycle and salary band governance, while prospective applicants require fast, public, indexable search and detailed job specifications with required skills.
Reasoning: Decouples tenant ATS operations from public candidate browsing. Enforces deterministic multi-tenant security in NestJS controllers without risking leakage of draft requisitions or internal workspace data.
Alternatives: Serving public listings directly through authenticated workspace endpoints with public flags; storing skills as raw unindexed JSON arrays.
Consequence: Public queries use optimized projections; employer updates are strictly validated through tenant scope checks.

## ADR-018 — Application Idempotency, ATS Kanban Pipeline, and Private Recruiter Notes

Decision: Enforce duplicate application prevention via `[jobId, candidateProfileId]` unique database constraint. Application submissions transactionally create the `Application` and initial `ApplicationStageHistory` audit log (`APPLIED`). Candidates can select an existing uploaded resume or profile snapshot, track real-time stage progress (`/candidate/applications`), and withdraw applications (`WITHDRAWN`). Recruiter ATS pipeline operations (`applications.read`, `applications.write`) are scoped to the owning workspace via `WorkspaceAccessService`. Advancing stages appends immutable `ApplicationStageHistory` entries recording the actor and transition notes. Internal collaboration notes (`ApplicationNote`) are strictly workspace-owned and private to tenant members.
Context: Streamlines high-volume executive recruitment, guarantees audit compliance for stage movements and disqualifications, and provides recruiters with a unified pipeline board without leaking private evaluation notes to candidate surfaces.
Reasoning: Ensures clean separation of candidate-facing transparency and internal hiring decisions. Prevents stale writes and duplicate applicant records.
Alternatives: Using a single mutable stage column without historical audit tracking; storing recruiter notes in candidate-accessible payload bodies.
Consequence: Pipeline stage adjustments require transactional audit appends; applicant dossiers expose presigned resume download URLs on demand.

## ADR-019 — Deterministic Match Scoring Engine, Candidate Search Privacy, and Talent Bookmarking

Decision: Implement an explainable, deterministic match scoring algorithm (`calculateJobMatch`) weighting required skills (50%), preferred skills (20%), seniority/experience level alignment (20%), and location/remote compatibility (10%). Forbid opaque or ungrounded LLM-only match scores. Every match evaluation yields an audit breakdown (`matchedSkills`, `missingSkills`, `experienceScore`, `locationCompatible`) and a human-readable explanation summary.
Enforce candidate privacy boundaries: Public talent search queries strictly filter by `searchVisible: true`. While recruiters can search headlines, skills, and experience history, raw resume binary downloads remain restricted to candidates who explicitly apply to workspace jobs. Recruiter talent saves (`SavedCandidate` with `[workspaceId, candidateProfileId]` unique index) and candidate job bookmarks (`SavedJob` with `[candidateProfileId, jobId]` unique index) are enforced idempotently via database constraints. All workspace searches and matching operations verify tenant membership and permissions via `WorkspaceAccessService`.
Context: Phase 6 requires foundational candidate discovery and job matching without premature LLM costs, hallucinations, or non-deterministic rankings.
Reasoning: Ensures calibrated, auditable hiring evaluations compliant with non-discrimination and explainability guidelines, while respecting candidate privacy.
Alternatives: Uncalibrated prompt-based LLM rankings; storing saved candidates and jobs as raw JSON columns without referential integrity.
Consequence: Transparent score explanations are rendered inline in recruiter views; future AI embeddings (Phase 7) can seamlessly augment retrieval while preserving deterministic feature scoring.

## ADR-020 — Semantic Vector Embeddings, Hybrid Match Scoring, and Source Hash Caching

Decision: Implement semantic vector embeddings and calibrated hybrid matching that blends deterministic feature evaluation (70%) with dense vector cosine similarity (30%). Vector generation is encapsulated in `@executive-match/ai` with zero-overhead deterministic fallbacks (`DeterministicEmbeddingProvider` producing 384-dimensional dense hashing vectors) and standard OpenAI providers (`text-embedding-3-small`). Text documents are serialized reproducibly via `buildCandidateEmbeddingDocument` and `buildJobEmbeddingDocument`. Embeddings are stored in relational tables (`CandidateProfileEmbedding` and `JobEmbedding`) and cached using SHA-256 source content hashing to prevent redundant external API calls and token waste. Hybrid match outcomes are recorded in `MatchResult` with an audit breakdown of overall, skills, semantic, experience, and location scores, accompanied by transparent, audit-ready explanations.

Context: Phase 7 introduces AI semantic matching to complement keyword and Boolean filters with contextual understanding, while strictly avoiding unexplainable "black-box" LLM judgments and ensuring deterministic offline/CI operability.

Reasoning: Grounding 70% of candidate evaluation in verifiable deterministic criteria (skills requirements, seniority alignment, location) ensures defensibility, compliance, and zero hallucinations. Allocating 30% to semantic vector similarity rewards contextual nuance and adjacent experience without allowing vector artifacts to override hard job requirements. Source hashing ensures idempotency and minimizes external API costs.

Alternatives: Relying exclusively on pure LLM prompts to judge fit; using non-explainable embeddings without hybrid weighting; calling external AI APIs synchronously on every search query.

Consequence: Recruiter interfaces provide clear visibility into both deterministic skills matches and semantic similarity scores with instant on-demand recalculation; CI and testing environments run zero-cost deterministic embeddings offline.

## ADR-021 — Structured Interview Scheduling, Role-Based Scorecards, and Assessment Management

Decision: Implement a multi-tenant interview scheduling, participant coordination, and structured scorecard evaluation engine alongside assessment tracking.
1. Multi-Tenancy & RBAC: Enforce granular workspace actions `interviews.read`, `interviews.write`, `assessments.read`, and `assessments.write` across all employer interactions via `WorkspaceAccessService`. Candidate access is restricted strictly to their own interviews via `getCandidateInterviews`.
2. Relational Schema: Store interviews in `Interview` (scoped to `workspaceId` and `applicationId`), participants in `InterviewParticipant` (with unique `[interviewId, userId]`), structured scorecards in `InterviewScorecard` (with unique `[interviewId, evaluatorId]`), and assessments in `Assessment` and `AssessmentInvite` (with unique secure verification tokens).
3. Evaluator Accountability: Forbid ungrounded or anonymous ratings. Every scorecard records the specific evaluator's hiring recommendation (`STRONG_HIRE`, `HIRE`, `NO_HIRE`, `STRONG_NO_HIRE`), multi-dimensional ratings (1-5 across overall, technical, communication, leadership, and culture), strengths, weaknesses, and private evaluation notes. Scorecard submission automatically transitions scheduled interviews to `COMPLETED`.
4. Cancellation Audit: Interview cancellations require an explicit cancellation reason and update status to `CANCELLED`.

Context: Phase 8 establishes the interview coordination and evaluator assessment loop, ensuring hiring teams evaluate candidates using objective, structured rubrics before reaching offer stages.

Reasoning: Guarantees objective, structured hiring criteria, eliminates interview bias through standardized rubrics, preserves tenant boundary isolation, and ensures candidates only receive relevant schedule details without leaking internal evaluator scorecards.

Alternatives: Storing interviews and notes as unstructured free-text comments on the application; allowing anonymous or unassigned scorecards; coupling video conferencing tools tightly before defining core scheduling models.

Consequence: Hiring teams have structured scorecard archives for every interviewed candidate; candidate dashboard provides clear calendar tracking for scheduled interview sessions.






