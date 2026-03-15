---
phase: 1
plan: 3
wave: 2
---

# Plan 1.3: Shared UI Components + Polish

## Objective
Build reusable UI components that all pages share: cards, buttons, badges, section headers, and the footer. Add micro-animations, grain texture polish, and ensure responsive layout. This plan finalizes Phase 1.

## Context
- .gsd/SPEC.md
- .gsd/phases/1/1-PLAN.md (design system)
- .gsd/phases/1/2-PLAN.md (page shells exist)

## Tasks

<task type="auto">
  <name>Create Shared UI Component Library</name>
  <files>
    - src/components/ui/Card.tsx (NEW)
    - src/components/ui/Button.tsx (NEW)
    - src/components/ui/Badge.tsx (NEW)
    - src/components/ui/SectionHeader.tsx (NEW)
    - src/components/ui/EmptyState.tsx (NEW)
    - src/components/Footer.tsx (NEW)
  </files>
  <action>
    1. Card.tsx — Industrial card with dark charcoal bg, subtle border, hover glow effect
       - Props: children, className, variant ('default' | 'highlight' | 'danger')
       - Highlight variant: amber border-left accent
       - Danger variant: blood-red border-left accent

    2. Button.tsx — Fight Club styled buttons
       - Props: children, variant ('primary' | 'secondary' | 'danger' | 'ghost'), size, href (optional for link-buttons), disabled
       - Primary: amber bg, near-black text, hover glow
       - Secondary: transparent with bone border, hover fill
       - Danger: blood-red bg
       - Ghost: no border, text-only with hover underline

    3. Badge.tsx — Small pill-shaped status badges
       - Props: label, color ('amber' | 'red' | 'green' | 'gray')
       - Used for game tags (Instant, Elo Ranked, etc.)

    4. SectionHeader.tsx — Consistent section headings
       - Props: title, subtitle (optional)
       - Title in Bebas Neue, subtitle in Space Mono muted

    5. EmptyState.tsx — Empty content placeholder
       - Props: icon (emoji or icon), title, description, actionLabel, actionHref
       - Centered, muted, with optional CTA button

    6. Footer.tsx — Simple footer
       - "CORTEX" text, "Built for Algorand Hackseries 3", social links placeholder
       - Dark bg with grain, muted text
  </action>
  <verify>npm run build && echo "Components OK"</verify>
  <done>All 6 components render correctly; pages use shared components; build passes</done>
</task>

<task type="auto">
  <name>Integrate Components into Page Shells + Responsive Polish</name>
  <files>
    - src/app/page.tsx (MODIFY)
    - src/app/arena/page.tsx (MODIFY)
    - src/app/predictions/page.tsx (MODIFY)
    - src/app/marketplace/page.tsx (MODIFY)
    - src/app/agents/page.tsx (MODIFY)
    - src/app/layout.tsx (MODIFY — add Footer)
  </files>
  <action>
    1. Replace raw HTML in all pages with Card, Button, Badge, SectionHeader, EmptyState components
    2. Home page: feature cards use Card component, CTAs use Button component
    3. Arena: match cards use Card with game Badge tags
    4. Predictions: betting cards use Card highlight variant
    5. Marketplace: skill cards use Card with Badge for skill type
    6. Agents: agent cards use Card with amber highlight for equipped skills
    7. Add Footer to layout.tsx
    8. Ensure all pages are responsive (mobile-first with sm/md/lg breakpoints)
    9. Add subtle hover animations and transitions to all interactive elements
  </action>
  <verify>npm run build && echo "Integration OK"</verify>
  <done>All pages use shared components, responsive on mobile/desktop, animations smooth, build passes</done>
</task>

<task type="checkpoint:human-verify">
  <name>Visual Verification</name>
  <files>None</files>
  <action>
    Run `npm run dev` and check localhost:3000:
    - Fight Club aesthetic is consistent across all pages
    - Navigation works on desktop and mobile
    - Grain texture visible
    - Fonts load correctly
    - Animations are smooth
  </action>
  <verify>User confirms UI looks correct</verify>
  <done>User approves Phase 1 visual output</done>
</task>

## Success Criteria
- [ ] All shared components (Card, Button, Badge, SectionHeader, EmptyState, Footer) exist and render
- [ ] All 5 pages use shared components consistently
- [ ] Responsive layout works on mobile (375px) and desktop (1440px)
- [ ] `npm run build` passes with zero errors
- [ ] User approves Fight Club aesthetic visually
