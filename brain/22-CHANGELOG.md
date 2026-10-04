# Changelog
 
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
