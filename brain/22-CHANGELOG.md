# Changelog

## 2026-10-05 — Phase 6: Search and matching foundation & candidate discovery

- Expanded `packages/database/prisma/schema.prisma` with `SavedJob` (`[candidateProfileId, jobId]` uniqueness) and `SavedCandidate` (`[workspaceId, candidateProfileId]` uniqueness) models, and updated `CandidateProfile`, `Job`, and `Workspace` relations. Regenerated Prisma Client v6.19.3.
- Expanded `packages/validation` with `CandidateSearchQuerySchema` and `SaveCandidateSchema` with unit tests (29 tests passing in validation suite).
- Built `MatchingModule` (`apps/api/src/modules/matching.module.ts`) featuring `MatchingService`, `WorkspaceCandidateSearchController`, `WorkspaceJobMatchesController`, and `CandidateSavedJobsController`:
  - Pure deterministic match scoring engine (`calculateJobMatch`) weighting required skills (50%), preferred skills (20%), seniority/experience level alignment (20%), and location/remote compatibility (10%), returning exact audit metrics (`matchedSkills`, `missingSkills`, `experienceScore`, `locationCompatible`) and an explainable summary. Zero uncalibrated or hallucinated LLM scores.
  - Recruiter candidate discovery API (`GET /workspaces/:slug/candidates/search`) with keyword, skill tags, minimum experience, and remote filters, with privacy boundary enforcing `searchVisible: true`.
  - Requisition-specific match evaluation (`GET /workspaces/:slug/jobs/:jobSlug/matches`).
  - Recruiter candidate bookmarking (`POST/DELETE /workspaces/:slug/candidates/:candidateProfileId/save`).
  - Candidate saved jobs management (`GET/POST/DELETE /candidates/me/saved-jobs`).
  - Comprehensive unit test coverage in `apps/api/src/modules/matching.service.test.ts` (6 tests passing; 44 API unit tests passing).
- Built frontend experiences in `apps/web`:
  - `CandidateSearch` (`candidate-search.tsx`): Recruiter candidate discovery dashboard at `/workspace/[workspaceSlug]/candidates` featuring search inputs, multi-skill tag filters, seniority ranges, remote filters, active requisition match selector, fit score pills, match diagnostic breakdowns, bookmark toggles, and rich talent dossier modals with privacy safeguards.
  - `CandidateSavedJobs` (`candidate-saved-jobs.tsx`): Candidate bookmark management dashboard at `/candidate/saved` displaying saved roles with company info, remote badges, salary ranges, direct links, and removal controls.
  - Extended web API client (`api.ts`) with search, matching, and bookmarking functions and types.
- Recorded ADR-019 in `brain/21-DECISIONS.md`.
- Verified quality gates across monorepo: 73 unit tests passing, clean typechecks, zero ESLint errors, and full production builds.

## 2026-10-05 — Phase 5: Applications, candidate tracking & recruiter ATS Kanban pipeline

- Expanded `packages/database/prisma/schema.prisma` with `ApplicationStatus` enum (`SUBMITTED`, `IN_REVIEW`, `INTERVIEWING`, `OFFERED`, `HIRED`, `REJECTED`, `WITHDRAWN`), `Application` model (`[jobId, candidateProfileId]` uniqueness, cascade relationships, and status indexing), `ApplicationStageHistory` model (immutable stage transition audit log with actor ID and notes), and `ApplicationNote` model (private workspace recruiter notes). Regenerated Prisma Client v6.19.3.
- Expanded `packages/validation` with `ApplyJobSchema`, `UpdateApplicationStageSchema`, `UpdateApplicationStatusSchema`, `WithdrawApplicationSchema`, `CreateApplicationNoteSchema`, and `ApplicationQuerySchema` with 6 unit tests (27 unit tests total in validation suite).
- Implemented `ApplicationsModule` (`apps/api/src/modules/applications.module.ts`) featuring `ApplicationsService`, `CandidateJobApplicationController`, `CandidateApplicationsController`, and `WorkspaceApplicationsController`:
  - `POST /jobs/:jobSlug/apply`: Candidate job submission with profile linking, primary resume auto-selection, duplicate submission prevention (409 Conflict), and atomic creation of `Application` and initial `ApplicationStageHistory` (`APPLIED`).
  - `GET /candidates/me/applications`: Candidate application history list with job details, company branding, and stage progress.
  - `PATCH /candidates/me/applications/:applicationId/withdraw`: Candidate application withdrawal with optional reason.
  - `GET /workspaces/:slug/jobs/:jobSlug/applications`: Tenant-isolated ATS pipeline applicant list filterable by stage/status with candidate profiles and resume metadata.
  - `GET /workspaces/:slug/applications/:applicationId`: Detailed candidate dossier with complete employment/education history, stage transition log, notes, and HMAC-signed resume download URL (15m TTL).
  - `PATCH /workspaces/:slug/applications/:applicationId/stage`: Advancing candidate stages with automatic status alignment and audit history.
  - `PATCH /workspaces/:slug/applications/:applicationId/status`: Status changes (`OFFERED`, `HIRED`, `REJECTED`) with rejection reasoning.
  - `POST /workspaces/:slug/applications/:applicationId/notes` and `GET .../notes`: Private recruiter collaboration notes.
  - Comprehensive unit test suite in `apps/api/src/modules/applications.service.test.ts` (8 tests passing; 38 API tests total).
- Built frontend experiences in `apps/web`:
  - `JobApplyModal` (`job-apply-modal.tsx`): Interactive candidate application modal on `/jobs/[slug]` with resume version selector, cover note pitch, authentication redirection, and duplicate submission handling.
  - `CandidateApplicationsList` (`candidate-applications-list.tsx`): Candidate application tracker at `/candidate/applications` with progress indicators, overview metric cards, cover letter excerpts, and withdrawal modal.
  - `AtsPipelineBoard` (`ats-pipeline-board.tsx`): Recruiter Kanban board at `/workspace/[workspaceSlug]/jobs/[jobSlug]` featuring stage columns (`Applied`, `Screening`, `Interview`, `Offer`, `Hired`), search filter, quick stage advancement, rejection modal, candidate dossier drawer, and private team notes.
  - Requisition selector at `/workspace/[workspaceSlug]/applications`.
- Recorded ADR-018 in `brain/21-DECISIONS.md`.
- Verified quality gates across all 14 packages: 67 tests passing, zero ESLint errors, clean typecheck, and full Next.js/NestJS production builds.

## 2026-10-04 — Phase 4: Company profile, job requisition management & public discovery board

- Expanded `packages/database/prisma/schema.prisma` with `JobRemoteType`, `JobEmploymentType`, `JobExperienceLevel` enums, `JobSkill` relation model (`[jobId, name]` unique index), and expanded `Company` (website, industry, size, location, bannerKey) and `Job` (department, location, remoteType, employmentType, experienceLevel, salary range, currency, publishedAt, closedAt, and skills relation). Regenerated Prisma Client v6.19.3.
- Expanded `packages/validation` with `UpdateCompanySchema`, `JobSlugSchema`, `CreateJobSchema`, `UpdateJobSchema`, `UpdateJobStatusSchema`, and `JobQuerySchema` with 5 unit tests (21 tests total in validation suite).
- Built `JobsModule` (`apps/api/src/modules/jobs.module.ts`) featuring `JobsService`, `WorkspaceJobsController`, `PublicJobsController`, and `PublicCompaniesController`:
  - `GET /workspaces/:slug/company` and `PATCH /workspaces/:slug/company` for tenant-scoped company profile and branding management.
  - `POST /workspaces/:slug/jobs` for job creation with slug generation and required/optional skills attachments.
  - `GET /workspaces/:slug/jobs` and `GET /workspaces/:slug/jobs/:jobSlug` for tenant-scoped job requisition discovery.
  - `PATCH /workspaces/:slug/jobs/:jobSlug` for updating specifications, salary bands, and skills tags.
  - `PATCH /workspaces/:slug/jobs/:jobSlug/status` for status lifecycle management (`DRAFT`, `PUBLISHED`, `CLOSED`, `ARCHIVED`) setting transition timestamps (`publishedAt`, `closedAt`).
  - `DELETE /workspaces/:slug/jobs/:jobSlug` for cascading requisition cleanup.
  - Public discovery endpoints: `GET /public/jobs` (with keyword, department, location, remoteType, employmentType, experienceLevel, page, and pageSize filtering), `GET /public/jobs/:slug` (with company details and requirements), and `GET /public/companies/:slug` (with public profile and active job openings).
  - Comprehensive unit test suite in `apps/api/src/modules/jobs.service.test.ts` (7 tests passing).
- Built frontend experiences in `apps/web`:
  - `WorkspaceJobs` (`workspace-jobs.tsx`): Employer requisition manager supporting job creation modal with remote policy, compensation bounds, skills tags, status toggle actions, and requisition cards.
  - Wired into `/workspace/[workspaceSlug]/jobs`.
  - Public Requisition View (`/jobs/[slug]`): Comprehensive job detail view showing company summary, compensation, employment terms, department, required/preferred skills badges, and application CTA.
  - Public Company View (`/companies/[slug]`): Company profile display with industry, headquarters, size, and open positions grid.
  - Updated `/jobs` public discovery directory with real-time API search and filters.
- Recorded ADR-017 in `brain/21-DECISIONS.md`.
- Verified quality gates across all 14 packages: 59 tests passing, zero ESLint errors, clean typecheck, and full Next.js/NestJS production builds.

## 2026-10-04 — Phase 3: Candidate profiles & signed object storage resume pipeline

- Expanded `packages/database/prisma/schema.prisma` with `ResumeParsingStatus` enum and models: `CandidateExperience`, `CandidateEducation`, `CandidateSkill`, and `CandidateResume` with indexing and cascade constraints. Updated `CandidateProfile` with headline, bio, location, years of experience, contact URLs, and search visibility. Regenerated Prisma Client v6.19.3.
- Added candidate validation schemas in `packages/validation`: `UpdateCandidateProfileSchema`, `CreateCandidateExperienceSchema`, `UpdateCandidateExperienceSchema`, `CreateCandidateEducationSchema`, `UpdateCandidateEducationSchema`, `AddCandidateSkillSchema`, `RequestResumeUploadSchema`, and `ConfirmResumeUploadSchema` with 16 comprehensive unit tests.
- Implemented object storage providers in `@executive-match/storage`: `MemoryStorageProvider` and `LocalStorageProvider` with HMAC-signed upload/download URLs, TTL verification, and delete operations. Unit test suite added in `packages/storage/src/index.test.ts`.
- Created NestJS `StorageModule` (`apps/api/src/platform/storage.module.ts`) providing injectable `OBJECT_STORAGE`.
- Built `CandidatesModule` (`apps/api/src/modules/candidates.module.ts`) with `CandidatesController` and `CandidatesService`:
  - `GET /candidates/me` and `PATCH /candidates/me` for profile lifecycle.
  - CRUD operations for work experiences, educations, and skills with candidate ownership verification.
  - Two-phase secure resume upload: `POST /candidates/me/resumes/upload-url` (generates signed URL, 10MB limit, PDF/DOCX only) and `POST /candidates/me/resumes/confirm`.
  - Resume management: `GET /candidates/me/resumes`, `PATCH /candidates/me/resumes/:id/primary`, `DELETE /candidates/me/resumes/:id` (removes from storage provider and database), and `GET /candidates/me/resumes/:id/download`.
  - Full test suite in `apps/api/src/modules/candidates.service.test.ts` (9 tests passing).
- Built frontend candidate experiences in `apps/web`:
  - `CandidateProfileForm` (`candidate-profile-form.tsx`): interactive profile editor for work history, education history, and skills.
  - `CandidateResumeManager` (`candidate-resume-manager.tsx`): drag-and-drop resume uploader with primary toggle, signed download, and status indicators.
  - Updated `/candidate` dashboard with profile strength scoring, stat cards, and primary resume status.
  - Wired routes in `/candidate/[section]/page.tsx` for `profile` and `resume`.
- Recorded ADR-016 in `brain/21-DECISIONS.md`.
- Verified quality gates across all 14 packages: 52 tests passing, zero ESLint errors, clean typecheck, and full Next.js/NestJS production builds.

## 2026-10-04 — Phase 2: Authentication, RBAC, workspace tenancy & invitations
 
- Added `EmailVerificationToken`, `PasswordResetToken`, and `WorkspaceInvitation` models to `packages/database/prisma/schema.prisma` with SHA-256 token hashing, expiration indexing, and relations. Regenerated Prisma Client v6.19.3.
- Expanded `@executive-match/auth` with granular `WorkspaceAction` permissions (`workspace.manage`, `workspace.members.read`, `workspace.members.invite`, `workspace.members.manage`, `jobs.write`, etc.) and comprehensive RBAC matrix unit tests.
- Expanded `@executive-match/validation` with schemas for email verification confirmation, password reset requests/confirmations, workspace creation/updating, member invitations, role updates, and slug formatting, supported by unit tests.
- Implemented email dispatch system in `@executive-match/email` (`ConsoleEmailSender`, `MemoryEmailSender`, and branded HTML/text templates for email verification, password reset, and workspace invitations) with complete test coverage.
- Integrated `EmailModule` in NestJS API (`apps/api/src/platform/email.module.ts`) providing injectable `EMAIL_SENDER`.
- Implemented API endpoints for authentication flows: `/auth/verify-email/request`, `/auth/verify-email/confirm`, `/auth/password-reset/request`, and `/auth/password-reset/confirm` with anti-enumeration security, Argon2id password hashing, and active session invalidation on reset.
- Implemented API endpoints for workspace operations: `POST /workspaces` (atomic workspace, company, and owner creation), `GET /workspaces`, `GET /workspaces/:slug`, `PATCH /workspaces/:slug`, `GET /workspaces/:slug/members`, `PATCH /workspaces/:slug/members/:memberId`, `DELETE /workspaces/:slug/members/:memberId` (with last-owner protection), `POST /workspaces/:slug/invitations`, `GET /workspaces/:slug/invitations`, `DELETE /workspaces/:slug/invitations/:inviteId`, `GET /invitations/:token`, and `POST /invitations/:token/accept`.
- Built web pages and UI components: `/verify-email` verification page, `/reset-password` request and reset page, `/invite/[token]` public acceptance page, `/workspace/new` creation page, and `workspace-team.tsx` management component integrated into `/workspace/[slug]/team` with invite modal, member table, role management, and invitation revocation.
- Recorded ADR-015 in `brain/21-DECISIONS.md`.
- Verified quality gates across all 14 packages: 37 tests passing, zero lint warnings/errors, clean typecheck, and full production builds.

## 2026-10-03 — Phase 1: Design system, typography & public shell refinement
 
- Configured self-hosted Google Fonts (`next/font/google` for `DM_Sans`, `Manrope`, and `Geist_Mono`) in `apps/web/src/app/layout.tsx` to eliminate external `@import` stylesheet bottlenecks.
- Standardized full design token scale in `apps/web/src/app/globals.css` with responsive desktop/mobile typographic utility classes, CSS variables, and accessibility focus rings.
- Expanded `@executive-match/ui` (`packages/ui`) with 16 modular components: Button/IconButton, Input/SearchInput/Textarea, Select/MultiSelect, Checkbox/RadioGroup/Switch, Badge/SkillBadge/ApplicationStatusBadge/PipelineStageBadge, Card/StatCard, Avatar/AvatarGroup, Dialog/Sheet, Dropdown/Tooltip/Popover, Tabs/Breadcrumb/Pagination, Skeleton/EmptyState/ErrorState/LoadingState/Toast, Table/DataTable, PageHeader/SectionHeader/FilterBar, CandidateCard/JobCard/CompanyCard/MatchScore/ProfileCompletion.
- Added comprehensive unit tests in `packages/ui/src/index.test.ts` (passing in Vitest).
- Redesigned public landing page (`apps/web/src/app/(public)/page.tsx`) with live alignment preview, ATS pipeline preview card, dual candidate/employer workflow, and 6-card capability grid.
- Enhanced public jobs, pricing, and about pages with authentic design system components and token-driven layouts.
- Enhanced application shells (`app-shell.tsx`) with avatar initials, topbar role indicators, breadcrumbs, and sign-out controls.
- Added dynamic admin section routing in `apps/web/src/app/(admin)/admin/[section]/page.tsx` across all 8 platform admin operations.
- Validated with zero errors across `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.
- Recorded ADR-013 and ADR-014 in `brain/21-DECISIONS.md`.
 
## 2026-10-02 — Foundation audit and GitHub publication

Completed repository audit and toolchain verification (`pnpm@11.19.0`, Turborepo 2.5.8, Node 22). Successfully validated `pnpm install`, `pnpm db:generate`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (all 4 pure unit tests passing), and `pnpm build` (production builds for Next.js web and NestJS API). Initialized Git tracking, created initial foundation commit, and published the repository to public GitHub repository `Patial-45/Impact-Job-Board` (`main` branch tracking `origin/main`).

## 2026-09-29 — Phase 0 foundation

Initialized pnpm/Turborepo workspace and Git repository, Next.js and NestJS apps, Prisma schema and initial migration, auth/session and workspace membership API, shared packages, UI tokens and public/protected shells, local PostgreSQL/Redis Compose, CI workflow, and all Brain documents. Aligned NestJS packages after startup verification, added liveness/readiness separation, and configured pnpm 11 build approvals. Verification details and limitations are recorded in [Current State](23-CURRENT-STATE.md).
