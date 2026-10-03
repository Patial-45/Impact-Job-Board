# Design system

Visual direction: restrained editorial SaaS, neutral off-white background, dark green-black text, one forest-green accent, thin borders, broad spacing and calm surfaces. No fake endorsements or metrics. Original UI; reference products guide quality, not layout copying.

## Tokens

CSS source: `apps/web/src/app/globals.css`. Background `#f8f9f7`, paper `#fff`, ink `#182320`, muted `#60706a`, line `#dce3df`, accent `#315f4d`, soft `#e9efeb`. Radius: 5px controls, 12px cards. Shadow only for depth-sensitive surfaces. Spacing uses 4/8/12/16/24/32/40/55/70/95/130px cadence. Content container max 1320px, 80px desktop gutters, 36px mobile. Breakpoints around 760px and 1100px. Motion is limited to hover/focus transitions and native scroll; respect reduced motion.

## Typography
 
Configured in `apps/web/src/app/layout.tsx` using `next/font/google` for zero render-blocking requests at runtime (`display: 'swap'`).
- Display font: `Manrope` (`--font-display`), weights 700, 800.
- Body font: `DM Sans` (`--font-body`), weights 400, 500, 700.
- Code/Data font: `Geist Mono` (`--font-mono`), weights 400, 500.

Type scale (desktop/mobile classes in `globals.css`):
- `display-xl`: 82px / 54px, line-height 1.08, tracking -0.05em
- `display-lg`: 68px / 44px, line-height 1.12, tracking -0.04em
- `display-md`: 52px / 36px, line-height 1.16, tracking -0.03em
- `display-sm`: 38px / 28px, line-height 1.20, tracking -0.02em
- `h1`: 59px / 40px, line-height 1.12, weight 800
- `h2`: 43px / 32px, line-height 1.18, weight 700
- `h3`: 23px / 22px, line-height 1.25, weight 700
- `h4`: 19px / 18px, line-height 1.30, weight 700
- `body-lg`: 18px / 17px, line-height 1.65, weight 400
- `body`: 16px / 16px, line-height 1.70, weight 400
- `body-sm`: 14px / 14px, line-height 1.60, weight 400
- `caption`: 12px / 12px, line-height 1.50, weight 500
- `label`: 11px / 11px, line-height 1.40, weight 700, tracking 0.08em uppercase
- `mono`: 12px / 12px, line-height 1.50, family monospace

## Components

`packages/ui` (`@executive-match/ui`) exports accessible, modular primitives:
- **Buttons**: `Button` (primary, secondary, subtle, outline, ghost, danger; sm, md, lg; loading state), `IconButton`.
- **Forms & Inputs**: `Input`, `SearchInput` (with reset clear), `Textarea`, `Select`, `MultiSelect`.
- **Controls**: `Checkbox`, `RadioGroup`, `Switch`.
- **Badges**: `Badge` (neutral, brand, success, warning, danger, accent), `SkillBadge`, `ApplicationStatusBadge`, `PipelineStageBadge`.
- **Cards**: `Card` (compound slots: Header, Title, Description, Content, Footer), `StatCard` (trend indicators).
- **Avatars**: `Avatar` (initials fallback, presence status), `AvatarGroup`.
- **Modals & Drawers**: `Dialog` (accessible keyboard/backdrop modal), `Sheet` (side drawer).
- **Popovers & Menus**: `Dropdown`, `Tooltip`, `Popover`.
- **Navigation**: `Tabs`, `Breadcrumb`, `Pagination`.
- **Feedback & States**: `Skeleton`, `EmptyState`, `ErrorState`, `LoadingState`, `Toast`.
- **Data Display**: `Table` (primitives: Header, Body, Row, Head, Cell), `DataTable`.
- **Layout Headers**: `PageHeader`, `SectionHeader`, `FilterBar`.
- **Recruitment Domain Cards**: `CandidateCard`, `JobCard`, `CompanyCard`, `MatchScore`, `ProfileCompletion`.

