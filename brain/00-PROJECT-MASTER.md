# Executive Match — Project Master

> **Any AI coding agent modifying this repository MUST first read 00-PROJECT-MASTER.md and then read all module-specific Brain documents relevant to the requested task.**

## Vision and users

Executive Match is a recruitment platform that helps candidates and hiring teams make better decisions using structured profiles, transparent matching evidence, and a coherent application workflow. It serves candidates, employers, recruiters, and platform administrators. AI supports analysis; people retain hiring decisions.

## Product surfaces

- **Public:** editorial landing page, job and company discovery, pricing and account entry.
- **Candidate:** onboarding, profile, resume, jobs, saved jobs, applications, settings.
- **Employer/recruiter:** company workspace, jobs, candidate search, ATS pipeline, collaboration, interviews, analytics, team settings.
- **Admin:** platform operations, moderation, audit, plans, support.

## Architecture and stack

Modular monolith: Next.js 16/React 19 web app; NestJS 11 REST API; PostgreSQL 16 with Prisma 6; future pgvector; Redis 7/BullMQ for asynchronous work; object storage through an S3-compatible interface; AI/email through provider interfaces. Turborepo and pnpm coordinate packages. Deploy web to Vercel, API to Railway/Render/Fly-compatible Node service, database and Redis to managed services, files to R2. See [architecture](02-SYSTEM-ARCHITECTURE.md), [stack](03-TECH-STACK.md), [decisions](21-DECISIONS.md).

## Repository and dependency map

`apps/web -> packages/ui,types`; `apps/api -> packages/database,auth,validation,config,shared`; `workers/processing -> packages/shared`; domain services may depend on `packages/ai,storage,email` later. Provider packages must never import app code. Controllers call services; services call database/provider ports. Workspace ownership is enforced in API queries, never solely in React. See [database](04-DATABASE-SCHEMA.md), [API](05-API-CONTRACTS.md), [auth](06-AUTH-AND-RBAC.md).

## Phase and MVP

Current phase: **Phase 0 — architecture and repository foundation.** Current implementation is listed in [Current State](23-CURRENT-STATE.md). MVP: candidate account/profile/resume, company workspace, jobs, application workflow, essential ATS pipeline, basic search, explainable matching foundation, notifications. Billing, production AI ranking, assessments, interview platform, and integrations follow later phases. Do not mistake route shells for completed modules.

## Future modules and V1 non-goals

Later modules include assessment generation, interview scheduling, advanced matching, analytics, billing, and external ATS integrations. V1 excludes scraping, autonomous applications, mobile apps, microservices, and LLM-only rankings. See [requirements](01-PRODUCT-REQUIREMENTS.md) and [roadmap](19-ROADMAP.md).

## Brain index

1. [Product requirements](01-PRODUCT-REQUIREMENTS.md), [system architecture](02-SYSTEM-ARCHITECTURE.md), [tech stack](03-TECH-STACK.md), [database](04-DATABASE-SCHEMA.md), [API contracts](05-API-CONTRACTS.md), [auth and RBAC](06-AUTH-AND-RBAC.md).
2. [AI matching](07-AI-MATCHING-ENGINE.md), [candidate](08-CANDIDATE-MODULE.md), [employer ATS](09-EMPLOYER-ATS.md), [assessments](10-ASSESSMENT-MODULE.md), [interviews](11-INTERVIEW-SCHEDULER.md), [admin](12-ADMIN-PORTAL.md).
3. [Design system](13-DESIGN-SYSTEM.md), [pages](14-PAGE-SPECIFICATIONS.md), [security](15-SECURITY.md), [deployment](16-DEPLOYMENT.md), [testing](17-TESTING-STRATEGY.md), [SEO](18-SEO.md), [roadmap](19-ROADMAP.md).
4. [Agent instructions](20-AI-AGENT-INSTRUCTIONS.md), [decisions](21-DECISIONS.md), [changelog](22-CHANGELOG.md), [current state](23-CURRENT-STATE.md).
