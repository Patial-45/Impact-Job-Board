# Product requirements

**MVP:** Candidate onboarding, identity, profile and resume management; job discovery, saved jobs, applications and tracking; employer onboarding, company and workspace; job drafting/publishing; applicant tracking with stages, shortlist, notes and tags; recruiter workspace collaboration; basic search, notifications and explainable match foundation. Authorization and tenant isolation are launch requirements.

**V1.5:** Candidate search filters, richer AI matching and evidence, JD and resume parsing, skill normalization, email notifications, interview scheduling, assessment invitations, employer analytics, expanded admin operations.

**V2:** Embeddings and hybrid retrieval, reranking, match explanations, assessment generation, job recommendations, resume rewriting, subscription plans and usage metering, advanced analytics, calendar integration.

**Future:** External ATS integrations, webhooks, enterprise SSO, refined billing, broader provider selection, additional languages and regional privacy controls. Scraping and autonomous applying are not planned for V1.

## Key journeys

Candidate registers, completes profile and resume, searches/saves jobs, applies, and tracks progress. Employer creates a workspace/company, invites recruiters, drafts and publishes a job, reviews applicants and evidence, moves them through stages, and schedules interviews. Recruiter can only access workspaces they belong to. Admin operates platform-level tools without implicitly becoming a workspace member; support access needs audited elevation.

## Product rules

No fabricated match score, customer endorsement, or employment outcome. AI output is advisory and shows evidence and uncertainty. Every employer-owned record has a workspace boundary. Candidates control profile and resume visibility. Critical transitions produce audit events in later phases.
