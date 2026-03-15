---
phase: 1
plan: 1
wave: 1
---

# Plan 1.1: Next.js Scaffold + Tailwind Configuration

## Objective
Scaffold a fresh Next.js 14 (App Router) project with TypeScript and Tailwind CSS. Configure the Fight Club design system: color palette, typography (Bebas Neue, Space Mono, Oswald), spacing scale, and base component tokens. Create the root layout with Google Fonts and global grain texture overlay.

## Context
- .gsd/SPEC.md
- .gsd/ROADMAP.md

## Tasks

<task type="auto">
  <name>Scaffold Next.js 14 App with TypeScript + Tailwind</name>
  <files>
    - package.json (NEW)
    - tsconfig.json (NEW)
    - tailwind.config.ts (NEW)
    - postcss.config.mjs (NEW)
    - next.config.ts (NEW)
    - src/app/layout.tsx (NEW)
    - src/app/page.tsx (NEW)
    - src/app/globals.css (NEW)
  </files>
  <action>
    Run `npx -y create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm` (non-interactive).
    If the directory is not empty, initialize in a temp dir and move files, OR use `--yes` flag.
    Verify dev server starts with `npm run dev`.
  </action>
  <verify>npm run build 2>&1 | Select-String "Compiled successfully"</verify>
  <done>Next.js app compiles and serves on localhost:3000</done>
</task>

<task type="auto">
  <name>Configure Fight Club Design System in Tailwind</name>
  <files>
    - tailwind.config.ts (MODIFY)
    - src/app/globals.css (MODIFY)
    - src/app/layout.tsx (MODIFY)
  </files>
  <action>
    1. Extend tailwind.config.ts with Cortex design tokens:
       - Colors: nearBlack (#0A0A0A), charcoal (#1A1A1A), bone (#FFFBEB), amber (#F59E0B), bloodRed (#DC2626), rust (#B91C1C), steel (#374151), smoke (#9CA3AF)
       - Fonts: heading (Bebas Neue), body (Space Mono), accent (Oswald)
       - Animations: flicker, grain, pulse-glow

    2. Update globals.css with:
       - CSS reset overrides for dark-first design
       - Grain texture overlay using CSS pseudo-element with repeating noise
       - Base component styles: .card-industrial, .btn-cortex, .btn-danger, .text-glow
       - Flicker keyframes animation
       - Scrollbar styling (dark)

    3. Update layout.tsx:
       - Import Google Fonts (Bebas Neue, Space Mono, Oswald) via next/font/google
       - Set dark background (nearBlack), default text (bone)
       - Add metadata: title "CORTEX — AI Agent Arena", description
  </action>
  <verify>npm run build && echo "Design system configured"</verify>
  <done>Tailwind extended with Cortex tokens; globals.css has grain texture and Fight Club component classes; fonts load correctly</done>
</task>

## Success Criteria
- [ ] `npm run dev` serves app at localhost:3000
- [ ] Page renders with dark background (#0A0A0A) and bone-white text
- [ ] Bebas Neue, Space Mono, Oswald fonts load from Google Fonts
- [ ] Grain texture overlay is visible on the page
