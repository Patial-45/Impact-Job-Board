# System architecture

## Context

```mermaid
flowchart LR
  C[Candidate] --> W[Next.js web]
  E[Employer / recruiter] --> W
  A[Admin] --> W
  W --> API[NestJS API]
  API --> PG[(PostgreSQL)]
  API --> R[(Redis / BullMQ)]
  API --> S[(R2 or S3 storage)]
  API --> X[AI and email providers]
  R --> WK[Processing worker]
  WK --> PG
  WK --> S
  WK --> X
```

## Application boundaries

```mermaid
flowchart TB
  WEB[Web route groups and layouts] --> HTTP[Versioned REST contract]
  HTTP --> CTRL[Controllers and validation]
  CTRL --> DOM[Domain services]
  DOM --> DB[Prisma repositories / database]
  DOM --> PORTS[AI, storage, email and queue ports]
  PORTS --> ADAPT[Provider adapters, future]
```

The web app renders public pages and protected candidate, workspace, and admin shells. It uses the API for identity and authorization. The API is a modular monolith; domain modules are introduced when workflows exist. Initial modules are auth, workspaces, health. Future modules: users, companies, candidates, jobs, applications, matching, search, files, notifications, interviews, assessments, analytics, admin and integrations. Avoid empty modules.

## Request lifecycle

```mermaid
sequenceDiagram
  Browser->>API: HTTPS request + cookie + Origin
  API->>API: request ID, security middleware, throttle
  API->>API: auth guard and workspace membership
  API->>API: validate input and execute service
  API->>PostgreSQL: scoped query / transaction
  PostgreSQL-->>API: result
  API-->>Browser: resource or normalized error + request ID
```

## Background jobs

```mermaid
flowchart LR
  API -->|versioned payload, idempotency key| B[(BullMQ / Redis)]
  B --> W[Worker]
  W --> D[(PostgreSQL)]
  W --> O[(Object storage)]
  W --> P[Providers]
  W -->|retry / dead letter policy| B
```

Queue names: `resume`, `candidate`, `job`, `match`, `notification`, `assessment`, `analytics`. Job names and payload envelope live in `packages/shared`. Redis is optional during Phase 0; no request path depends on it. Add workers only with durable idempotency, retry policy, and observability.

## AI flow

```mermaid
flowchart LR
  Profile[Resume or job source] --> Normalize[Structured normalization]
  Normalize --> Retrieve[Hard filters + keyword/vector retrieval]
  Retrieve --> Score[Feature score]
  Score --> Rerank[Rerank]
  Rerank --> Evidence[Evidence and explanation]
  Evidence --> Human[Human review]
```

Domain AI services call `packages/ai` interfaces. Provider adapters handle timeout, retry, usage, and redacted telemetry. Never log raw resumes by default. An LLM never owns the entire rank.

## Authentication and application flows

```mermaid
sequenceDiagram
  Browser->>API: POST /auth/login
  API->>PostgreSQL: verify user password; store hashed session token
  API-->>Browser: HttpOnly SameSite cookie
  Browser->>Web: Navigate protected route
  Web->>API: GET /auth/me with cookie
  API-->>Web: viewer or 401
```

```mermaid
flowchart LR
  Candidate --> Job[Published job] --> Apply[Validate eligibility and consent]
  Apply --> Tx[Transaction: application and history]
  Tx --> Notice[Notification job]
  Tx --> ATS[Workspace pipeline]
```

The application flow is planned, not implemented. Public job viewing must require published status. Submission must be idempotent and prevent duplicate active applications.

## Operations

PostgreSQL is the source of truth. Object storage uses short lived signed URLs and private keys. Redis serves background jobs, rate limits, temporary cache, and locks when those features are implemented. Structured JSON logs include request ID, route, duration and status. Sentry and PostHog adapters are future work. API errors are normalized; stack traces stay server-side. Deploy the web and API separately; workers are separate processes when activated.
