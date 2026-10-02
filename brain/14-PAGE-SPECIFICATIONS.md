# Page specifications

Public routes: `/` landing; `/jobs` discovery shell; `/jobs/[slug]` and `/companies/[slug]` return 404 until real published resources exist; `/about`, `/pricing`, `/login`, `/register` are basic pages. Landing sections: navigation, hero, value statement, workflow, candidate/employer benefits, CTA and footer. No fabricated logos or statistics.

Candidate routes: `/candidate`, `/candidate/profile`, `/candidate/jobs`, `/candidate/applications`, `/candidate/saved`, `/candidate/resume`, `/candidate/settings`. Employer routes under `/workspace/[workspaceSlug]`: overview, jobs, candidates, applications, interviews, analytics, team, settings. Admin `/admin`. Protected layouts validate the session, workspace layout also checks membership. All feature routes beyond auth are honest shells. Future page work must specify data source, loading/empty/error states, permissions, responsive behavior and keyboard flow before implementation.
