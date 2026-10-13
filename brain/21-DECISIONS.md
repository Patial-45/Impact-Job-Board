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

## ADR-022 — Multi-Tenant Job Offers, Digital E-Signatures, and Onboarding Checklist Engine

Decision: Implement a multi-tenant job offer lifecycle, digital e-signature acceptance, and automated new-hire onboarding checklist engine.
1. Multi-Tenancy & RBAC: Enforce granular workspace actions `offers.read`, `offers.write`, `onboarding.read`, and `onboarding.write` across employer operations via `WorkspaceAccessService`. Candidate access is restricted strictly to their own offers (`/candidates/me/offers`) and onboarding checklists (`/candidates/me/onboarding`).
2. Offer Lifecycle: Maintain explicit states (`DRAFT`, `PENDING_APPROVAL`, `SENT`, `ACCEPTED`, `DECLINED`, `EXPIRED`, `RESCINDED`). Sending an offer automatically advances application stage to `OFFER` and status to `OFFERED` with an immutable stage history record.
3. Digital E-Signatures: Digital acceptance captures signer legal full name, signature representation text, verified email, client IP address, user-agent, signed timestamp, and explicit legal consent confirmation checkbox compliant with electronic signature standards. Acceptance transactionally sets offer status to `ACCEPTED`, transitions application to `HIRED`, and auto-seeds standard new-hire onboarding tasks (compliance, tax/direct deposit, right-to-work verification, IT setup).
4. Cancellation & Decline Auditing: Rescinding or declining an offer records explicit reasons for compliance and talent analytics.

Context: Phase 9 formalizes the hiring conversion funnel, taking candidates from completed interviews into legally structured employment agreements and seamless day-one onboarding.

Reasoning: Guarantees full auditability and legal defensibility for compensation proposals and digital signatures, preserves workspace isolation, and eliminates manual onboarding handoffs.

Alternatives: Relying on third-party external e-signature embeds (DocuSign/HelloSign) without unified database models; tracking offers as plain text notes without lifecycle state machines.

Consequence: Employers have centralized compensation and signature records; candidates have an end-to-end transparent offer acceptance and onboarding checklist experience.

## ADR-023 — Platform Administration, Recruitment Analytics Engine, and Workspace Tiered Subscriptions

Decision: Implement global platform administration, recruitment pipeline analytics, and multi-tenant tiered billing.
1. Global RBAC & Boundary Isolation: Distinguish global roles (`USER`, `PLATFORM_ADMIN`, `SUPER_ADMIN`) using `canPlatform(role, 'admin.read' | 'admin.manage')`. Platform admins do NOT implicitly inherit workspace tenancy. Exceptional customer workspace support requires explicit, time-bounded support elevation (`SupportElevation` model) with mandatory reason, scope (`READ_ONLY` or `SUPPORT_MAINTENANCE`), expiration (1-24 hours), and an immutable system audit trail (`AuditLog` model).
2. Super Admin Safety: Prevent demoting the last remaining `SUPER_ADMIN` to maintain platform operability.
3. System Audit Log Ledger: Immutable audit trail records `actorUserId`, `actorEmail`, `action`, `targetType`, `targetId`, and JSON payload details across user privilege modifications, workspace elevations, requisition moderations, and subscription changes.
4. Recruitment Analytics Engine: Compute real, non-fabricated metrics for workspace hiring teams via `GET /workspaces/:slug/analytics` (requiring `analytics.read`):
   - Pipeline Funnel: stage volumes (`APPLIED`, `SCREENING`, `INTERVIEW`, `OFFER`, `HIRED`) with pass-through conversion rates.
   - Time-to-Hire: average calendar days from application submission to hire event.
   - Offer Win Rate: acceptance ratio of accepted versus declined proposals.
   - Evaluator Calibration: completed interviews count, average rating (1-5 stars), and distribution of evaluator recommendations.
   - Requisition Breakdown: applicant volumes, active candidates, and hires by specific open requisition.
5. Tiered Subscriptions & Usage Limits:
   - Three tiers (`STARTER`, `GROWTH`, `ENTERPRISE`) with defined quotas for active job requisitions (3, 15, 100) and monthly candidate discovery searches (50, 500, 5,000).
   - Usage meters displayed in workspace billing settings with upgrade and scheduled end-of-period cancellation workflows.

Context: Phase 10 establishes centralized platform operations, oversight, analytics, and business model sustainability while enforcing strict multi-tenant boundary compliance.

Reasoning: Guarantees complete platform accountability, transparency, and tenant privacy. Prevents platform administrators from silently browsing employer candidate dossiers without an audited elevation record. Provides hiring teams with actionable, calibrated recruitment velocity metrics grounded in actual database stage histories.

Alternatives: Allowing platform admins global access to all workspaces without audited elevation; storing mock or random analytics numbers; using a rigid single-tier billing model without quota enforcement.

Consequence: Administrators have robust system oversight and compliance logs; employers have actionable recruitment analytics and flexible self-service plan management.

## ADR-024 — Multi-Tenant Webhooks, Cryptographic API Keys, Enterprise ATS Connectors & Modern 3D Spatial UI Overhaul

Decision: Implement a secure multi-tenant webhook dispatch ledger, cryptographically hashed API keys, ATS connector sync engine, and modern 3D spatial design system overhaul.
1. Workspace Tenant Isolation & RBAC:
   - Webhook endpoints, deliveries, API keys, and ATS configurations are strictly isolated by `workspaceId`.
   - Granular RBAC actions: `integrations.read` and `integrations.write` granted to workspace `OWNER` and `ADMIN` roles.
2. Cryptographic API Key Security:
   - Raw keys are generated with secure random entropy formatted as `em_live_<32 hex chars>`.
   - Raw keys are displayed to the user exactly once upon creation and never stored in plaintext.
   - The database stores a SHA-256 cryptographic digest (`keyHash`), key prefix for identification (`em_live_...`), and revocation timestamp.
3. Webhook Delivery & Signature Verification:
   - Webhook subscriptions support selective event filtering (e.g., `application.created`, `application.stage_changed`, `offer.created`, `offer.accepted`).
   - Every endpoint is provisioned with a cryptographic signing secret `whsec_<hex>`.
   - Outbound webhook HTTP payloads include timestamp and HMAC-SHA256 signature in the `X-Signature-256` header to guarantee authenticity.
   - Comprehensive delivery ledger (`WebhookDelivery`) records response status code, round-trip latency, payload, and error messages for auditability and debugging.
4. Enterprise ATS Connectors:
   - Dedicated connector adapters for Greenhouse, Lever, and Workday.
   - Secure credential storage (API key, webhook secret, environment target) with bi-directional or outbound candidate/requisition sync modes.
   - Audit trail tracking last synchronized timestamp, sync status, and item counters.
5. Modern 3D Spatial UI & Tactile Motion Overhaul:
   - Upgraded UI design tokens with authentic 3D spatial elevation, multi-layer ambient specular drop shadows, and interactive spring physics.
   - Tactile click feedback across buttons and cards with `transform: translateY(1px) scale(0.975)` and active glow borders.
   - Modernized typography system with variable fonts (`Plus Jakarta Sans`, `Inter`, `Geist Mono`).
   - Replaced legacy icons with `lucide-react` across navigation, workspace shells, and data tables.
   - Custom 3D isometric faceted geometry logo (`LogoMark`, `Logo`) with emerald glow gradients.

Context: Phase 11 enables enterprises to automate hiring workflows, sync pipeline candidates with their legacy ATS infrastructure, and programmatically consume recruitment events, wrapped in a modern, tactile, premium design system.

Reasoning: Guarantees zero plaintext secret leakage, cryptographic message verification, reliable delivery auditing, and an engaging executive user experience that feels solid and responsive.

Alternatives: Storing plaintext API keys (severe security vulnerability); third-party uninspected webhook forwarders; flat, dated UI typography and iconography.

Consequence: Hiring teams can safely integrate Executive Match with their tech stack, while candidates and recruiters enjoy a modern, tactile, 3D interface.

## ADR-025 — Production Hardening, Security Headers, Structured Observability & Health Readiness Probes

Decision: Implement comprehensive production hardening, HTTP security policies, structured telemetry with automated redaction, and deep container/orchestrator health readiness probes.
1. Security Headers & Helmet Policies:
   - Configured Helmet middleware in `main.ts` with strict HSTS (`maxAge: 31536000`, `includeSubDomains: true`, `preload: true`), `frameguard` (`DENY`), `noSniff` (`nosniff`), and strict referrer policy (`strict-origin-when-cross-origin`).
   - Configured Next.js 16 response headers in `next.config.ts` enforcing `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=()`, `X-XSS-Protection: 1; mode=block`, and DNS prefetch control.
2. Error Masking & Exception Sanitization:
   - Enhanced `HttpErrorFilter` to strictly mask 500 internal server error messages in production mode (`process.env.NODE_ENV === 'production'`), returning a safe, non-leaking user-facing message while recording full error names, messages, stacks, routes, and correlation IDs to server telemetry logs.
   - Response payloads uniformly include `code`, `message`, `requestId`, `path`, and ISO timestamp.
3. Structured Observability & Sensitive Data Redaction:
   - Created injectable `ObservabilityService` emitting standardized JSON events (`timestamp`, `level`, `event`, `correlationId`, `metadata`, `error`).
   - Recursively redacts sensitive payload attributes (`password`, `token`, `secret`, `key`, `apiKey`, `keyHash`, `authorization`, `cookie`, `signingSecret`).
   - Enhanced `RequestContextMiddleware` to echo and propagate `x-request-id` and `x-correlation-id`, with query string parameter redaction.
4. Production Health & Readiness Probes:
   - `GET /api/v1/health/live` & `GET /api/v1/health/liveness`: Lightweight process liveness verification returning `{ status: 'ok', uptimeSeconds, timestamp }`.
   - `GET /api/v1/health/ready` & `GET /api/v1/health/readiness`: Deep readiness check executing `SELECT 1` on PostgreSQL, reporting database latency in ms, measuring process heap and RSS memory utilization in MB, and returning HTTP 503 if the database is disconnected.
   - Backward-compatible `GET /api/v1/health` endpoint returning database status and query latency.
5. Modern 3D Web Error Boundaries:
   - Upgraded `not-found.tsx` with 3D spatial card elevation, subtle background glow, `lucide-react` icons, and navigation actions.
   - Upgraded `error.tsx` with error digest tracking, amber/rose ambient glows, and tactile retry physics.
   - Added `global-error.tsx` as root layout fallback.

Context: Phase 12 prepares the Executive Match platform for robust, secure, and observable multi-tenant production operation across containerized and edge environments.

Reasoning: Guarantees zero credential or stack trace leakage to clients, enables automated container orchestrator traffic routing via standardized readiness probes, and ensures full operational observability.

Alternatives: Leaving default development error stack traces in production (severe security vulnerability); relying on raw unredacted console logs; unmonitored container deployments without database latency checks.

Consequence: The platform is hardened against common web attack vectors, prevents sensitive information leakage, and provides clear operational health telemetry for DevOps and monitoring tools.

## ADR-026 — Distributed Background Queue Worker Runtime & Hybrid Match Processing Pipeline

Decision: Implement a dedicated, resilient background worker processing runtime (`workers/processing`) coordinating asynchronous candidate embedding, job embedding, hybrid match calculation, and transactional notification dispatch.
1. Architecture & Process Isolation:
   - Worker runtime operates as an independent Node.js process decoupled from API request-response loops.
   - Leverages BullMQ backed by Redis for durable, versioned job execution with exponential backoff retries (3 attempts).
   - Graceful fallback: when `REDIS_URL` is unconfigured (local test or development), workers register in standby mode without blocking monorepo operations.
2. Candidate Profile & Job Embedding Processors:
   - `CandidateEmbedProcessor`: constructs normalized profile text document with employment history, educations, and verified skills tags, computes sha256 source hash, generates 1536-dimensional vector embedding, and upserts `CandidateProfileEmbedding`. Skips recomputation if source hash is unchanged unless `force: true`.
   - `JobEmbedProcessor`: normalizes requisition specifications, requirements, and preferred skills, computes source hash, generates vector embedding, and upserts `JobEmbedding`.
3. Asynchronous Match Calculation Pipeline:
   - `MatchCalculateProcessor`: loads candidate and job profiles with vector embeddings.
   - Evaluates deterministic competencies, skills overlap, and seniority weights, alongside semantic embedding cosine similarity.
   - Computes calibrated hybrid match score and explanation using `calculateHybridScore()`.
   - Persists or updates `MatchResult` records for immediate query by recruiter ATS and candidate discovery pipelines.
4. Transactional Notification Dispatch:
   - `NotificationEmailProcessor`: consumes notification queue events and sends multi-format transactional emails through `@executive-match/email` provider port with idempotency keys.
5. Process Lifecycle & Graceful Shutdown:
   - Standalone CLI runner `workers/processing/src/worker.ts` traps `SIGTERM` and `SIGINT` signals, draining in-flight jobs and cleanly closing Redis connections and Prisma database clients.

Context: Background worker runtime is required to offload expensive text normalization, embedding generation, and bulk match recalculation out of synchronous API request threads.

Reasoning: Guarantees high API throughput, prevents HTTP request timeouts, isolates AI and external provider failures, and provides automatic exponential retry policies.

Alternatives: Synchronous in-request embedding generation (causes high HTTP latency and timeout risk); client-side matching.

Consequence: The platform processes heavy vector embedding and match scoring jobs reliably in the background while keeping API responses fast and predictable.











