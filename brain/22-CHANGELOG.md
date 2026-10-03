# Changelog
 
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
