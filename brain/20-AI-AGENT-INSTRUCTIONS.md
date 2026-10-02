# AI agent instructions

Before coding: read `brain/00-PROJECT-MASTER.md`, `brain/23-CURRENT-STATE.md`, and the Brain files relevant to the requested module. Inspect existing implementation before changing architecture. Do not rewrite functioning infrastructure without a documented reason. Preserve established patterns and tenant boundaries.

During work: keep controllers thin, enforce workspace membership in API services and database queries, validate input, do not scatter AI SDK calls, avoid duplicate abstractions, and never store secrets. Do not introduce a major dependency without explaining why. Never silently change database assumptions or migrate production data without a plan. Use `/packages/ai`, `/packages/storage`, `/packages/email` ports when adding providers. Do not claim route shells are features.

At completion: run lint, typecheck, relevant tests and build. Update module Brain documents for architecture changes, add decisions to `brain/21-DECISIONS.md`, record work in `brain/22-CHANGELOG.md`, and update `brain/23-CURRENT-STATE.md` with verified status, known issues and immediate next tasks. Include exact commands and limitations in the handoff.
