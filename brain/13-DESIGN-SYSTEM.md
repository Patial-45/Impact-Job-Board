# Design system

Visual direction: restrained editorial SaaS, neutral off-white background, dark green-black text, one forest-green accent, thin borders, broad spacing and calm surfaces. No fake endorsements or metrics. Original UI; reference products guide quality, not layout copying.

## Tokens

CSS source: `apps/web/src/app/globals.css`. Background `#f8f9f7`, paper `#fff`, ink `#182320`, muted `#60706a`, line `#dce3df`, accent `#315f4d`, soft `#e9efeb`. Radius: 5px controls, 12px cards. Shadow only for depth-sensitive surfaces. Spacing uses 4/8/12/16/24/32/40/55/70/95/130px cadence. Content container max 1320px, 80px desktop gutters, 36px mobile. Breakpoints around 760px and 1100px. Motion is limited to hover/focus transitions and native scroll; respect reduced motion.

## Typography

Current prototype uses Manrope display and DM Sans body with system fallback; self-host fonts before production to avoid an external CSS request. Type scale (desktop/mobile): display-xl 82/54, display-lg 68/44, h1 59/40, h2 43/32, h3 23/22, h4 19/18, body-lg 18/17, body 16/16, body-sm 14/14, caption 12/12, label 11/11, mono 12/12. Display line-height 1.08–1.2 and tracking −0.07 to −0.04em, weight 700–800. Body line-height 1.6–1.75, regular weight; labels 700 with expanded tracking. `font-display` should swap when self-hosted. Keep lines readable and contrast WCAG AA for functional text.

## Components

`packages/ui` currently exports Button, Input, Textarea, Badge, Card, PageHeader, SectionHeader and EmptyState. Add accessible primitives when a real interaction needs them. Future: select, checkbox, radio, switch, avatar, dialog/modal, dropdown, tooltip, tabs, table/data shell, pagination, breadcrumb, command palette shell, sidebar, top nav, error/loading/skeleton, toast, search/filter, stat/candidate/job/match shells. Use semantic HTML, visible focus states and keyboard behavior; do not create decorative pseudo-controls.
