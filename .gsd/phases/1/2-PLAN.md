---
phase: 1
plan: 2
wave: 1
---

# Plan 1.2: Navigation + Page Shells

## Objective
Create the Navbar component (pill-shaped, Fight Club styled) and all 5 page route shells (Home, Arena, Predictions, Marketplace, Agents). Each page gets a basic layout with header and placeholder content matching the Fight Club aesthetic. No data fetching or blockchain — pure UI structure.

## Context
- .gsd/SPEC.md
- .gsd/ROADMAP.md
- .gsd/phases/1/1-PLAN.md (depends on design system being configured)

## Tasks

<task type="auto">
  <name>Create Navbar Component</name>
  <files>
    - src/components/Navbar.tsx (NEW)
    - src/app/layout.tsx (MODIFY)
  </files>
  <action>
    1. Create src/components/Navbar.tsx:
       - Pill-shaped navbar (rounded-full, semi-transparent dark background with backdrop-blur)
       - "CORTEX" logo text in Bebas Neue, white, links to home "/"
       - Navigation links: Arena (/arena), Predictions (/predictions), Marketplace (/marketplace), Agents (/agents)
       - Hover: amber glow effect (oval highlight)
       - Mobile: hamburger menu with slide-in drawer
       - Active link indicator (amber underline or dot)

    2. Import Navbar into layout.tsx, render above {children}
  </action>
  <verify>npm run build && echo "Navbar OK"</verify>
  <done>Navbar renders on all pages, links navigate correctly, pill shape visible, amber hover effect works</done>
</task>

<task type="auto">
  <name>Create All Page Route Shells</name>
  <files>
    - src/app/page.tsx (MODIFY — Home page)
    - src/app/arena/page.tsx (NEW)
    - src/app/predictions/page.tsx (NEW)
    - src/app/marketplace/page.tsx (NEW)
    - src/app/agents/page.tsx (NEW)
  </files>
  <action>
    1. Home page (src/app/page.tsx):
       - Hero section with "CORTEX" in giant Bebas Neue with flicker animation
       - Tagline: "Where AI Agents Fight for Supremacy"
       - Two CTA buttons: "Enter Arena" (links to /arena) and "Deploy Agent" (links to /agents)
       - Brief feature cards grid: Arena, Predictions, Skills, Agents

    2. Arena page (src/app/arena/page.tsx):
       - Page title "THE ARENA" in Bebas Neue
       - Two-column layout shell: left = active matches list, right = match detail/creation
       - Empty state: "No active matches. Create one."
       - "Create Match" button placeholder

    3. Predictions page (src/app/predictions/page.tsx):
       - Page title "PREDICTIONS" in Bebas Neue
       - Bookie counter aesthetic cards layout
       - Empty state: "No open predictions."

    4. Marketplace page (src/app/marketplace/page.tsx):
       - Page title "SKILL MARKET" in Bebas Neue
       - Grid layout for skill cards
       - Empty state: "No skills listed."

    5. Agents page (src/app/agents/page.tsx):
       - Page title "YOUR AGENTS" in Bebas Neue
       - Agent cards grid with skill loadout area (drag-drop target placeholder)
       - "Deploy New Agent" button
       - Empty state: "No agents deployed."

    All pages use consistent layout: page title + subtitle + content area.
  </action>
  <verify>npm run build && echo "All pages OK"</verify>
  <done>All 5 routes render with Fight Club styling, navigation works between all pages</done>
</task>

## Success Criteria
- [ ] Navbar visible on all pages with pill shape and amber hover
- [ ] All 5 routes (/,  /arena, /predictions, /marketplace, /agents) render without errors
- [ ] Navigation between all pages works via Navbar links
- [ ] Each page has its title, empty state, and Fight Club aesthetic applied
- [ ] Mobile hamburger menu works
