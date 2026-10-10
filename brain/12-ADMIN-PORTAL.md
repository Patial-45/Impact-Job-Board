# Admin Portal, Analytics & Billing

## Overview

Platform administration covers user and workspace oversight, requisition moderation, support elevation, cryptographic audit ledger search, subscription plans, usage metering, and service health diagnostics.

## RBAC and Boundary Isolation

- **Global Roles:** `USER`, `PLATFORM_ADMIN`, `SUPER_ADMIN`.
  - `PLATFORM_ADMIN`: Read-only platform administration (`canPlatform(role, 'admin.read')`).
  - `SUPER_ADMIN`: Global administrative management (`canPlatform(role, 'admin.manage')`), user role modifications, and platform configuration.
- **Tenant Isolation Invariant:** Platform administrators do NOT implicitly inherit tenant workspace membership. Accessing a customer workspace requires explicit support elevation with a mandatory business reason, defined scope (`READ_ONLY` or `SUPPORT_MAINTENANCE`), time-bound expiration (1-24 hours), and an immutable audit log record (`SupportElevation` model).

## Platform Administration APIs (`AdminModule`)

- `GET /api/v1/admin/stats`: System-wide KPI telemetry (total users, workspaces, active/published requisitions, total applications, offers extended, offers accepted, active subscriptions, and recent audit activity).
- `GET /api/v1/admin/users`: Paginated platform user directory with candidate headlines, workspace memberships, and global roles.
- `PATCH /api/v1/admin/users/:userId/role`: Update global role (protected by `SuperAdminGuard`; prevents demoting the last remaining `SUPER_ADMIN`). Emits `USER_ROLE_UPDATED` audit log.
- `GET /api/v1/admin/workspaces`: Paginated tenant workspace directory with company metadata, member counts, active requisition counts, and subscription plans.
- `POST /api/v1/admin/support-elevation`: Issue time-bound audited support elevation tokens for exceptional customer troubleshooting.
- `GET /api/v1/admin/audit-logs`: Searchable system audit log ledger filtered by action, target type, or actor.
- `GET /api/v1/admin/health`: Live infrastructure diagnostics including PostgreSQL query latency, process heap and RSS memory usage, uptime, and runtime version.
- `PATCH /api/v1/admin/jobs/:jobId/moderate`: Requisition moderation (status updates with reason).

## Recruitment Analytics Engine (`AnalyticsModule`)

- **Endpoint:** `GET /api/v1/workspaces/:slug/analytics` (requires `analytics.read` workspace permission).
- **Pipeline Funnel:** Stage-by-stage progression across `APPLIED`, `SCREENING`, `INTERVIEW`, `OFFER`, and `HIRED` with pass-through conversion rates.
- **Velocity Metrics:** Average time-to-hire in days calculated from application submission to hire event.
- **Offer Calibration:** Total offers created, accepted, declined, pending, and offer acceptance win rates.
- **Interview Calibration:** Completed interview counts, average scorecard rating (1-5 stars), and distribution of evaluator recommendations (`STRONG_HIRE`, `HIRE`, `NO_HIRE`, `STRONG_NO_HIRE`).
- **Requisition Breakdown:** Granular applicant volume and hire counts by individual open role.

## Tiered Subscriptions & Billing (`BillingModule`)

- **Tiers:**
  - `STARTER`: Up to 3 active requisitions, 50 monthly candidate discovery searches, basic pipeline.
  - `GROWTH`: Up to 15 active requisitions, 500 candidate searches, AI semantic matching, structured scorecards, e-signatures.
  - `ENTERPRISE`: Up to 100 active requisitions, 5,000 candidate searches, custom onboarding checklists, priority SLA.
- **Endpoints:**
  - `GET /api/v1/workspaces/:slug/billing`: Usage vs. limits meter and plan metadata.
  - `POST /api/v1/workspaces/:slug/billing/upgrade`: Switch plan tiers or billing cycles (`MONTHLY` vs `ANNUAL`).
  - `POST /api/v1/workspaces/:slug/billing/cancel`: Scheduled end-of-period cancellation with reason tracking.
