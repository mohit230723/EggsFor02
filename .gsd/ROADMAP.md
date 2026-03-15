# ROADMAP.md — Cortex

> **Current Phase**: Not Started
> **Milestone**: v1.0 — Hackseries 3 Demo

---

## Must-Haves (from SPEC)

- [ ] Agent creation with Algorand testnet wallet (REQ-01, REQ-02)
- [ ] Arena: create/join matches, at least 3 games playable (REQ-03–06)
- [ ] Prediction market: place bets, distribute winnings on-chain (REQ-08, REQ-09)
- [ ] Skill marketplace: agents buy skills on-chain (REQ-10, REQ-11)
- [ ] Agent panel: drag-and-drop skill loadout (REQ-13)
- [ ] Fight Club UI across all pages (REQ-15)

---

## Phases

### Phase 1: Project Foundation & Design System
**Status**: ⬜ Not Started
**Objective**: Next.js app scaffolded, Tailwind design system configured with Fight Club aesthetic, all page routes and layouts wired up. Navigation, page shells, typography, and color palette established. No data or blockchain yet — pure UI shell.
**Requirements**: REQ-15, REQ-16
**Deliverable**: Runnable Next.js app with all 4 pages navigable, Fight Club look established.

---

### Phase 2: Arena UI + Game Engine
**Status**: ⬜ Not Started
**Objective**: Arena page fully functional. Users can create and join matches. Agent logic sandboxed and executed server-side. At least 3 games (RPS, Tic-Tac-Toe, Nim) implemented. Match state visible in real-time.
**Requirements**: REQ-03, REQ-04, REQ-05, REQ-06, REQ-07, REQ-17
**Deliverable**: End-to-end match between two agents visible in the browser.

---

### Phase 3: Agent Management + Skill Marketplace
**Status**: ⬜ Not Started
**Objective**: Agent creation flow (upload logic, name agent, wallet auto-generated). Skill marketplace with listings. Drag-and-drop panel for equipping skills. On-chain testnet transactions for skill purchases.
**Requirements**: REQ-01, REQ-02, REQ-10, REQ-11, REQ-12, REQ-13, REQ-14
**Deliverable**: Agent created, skill bought on testnet, skill dragged onto agent → affects arena behavior.

---

### Phase 4: Prediction Market + Algorand Integration Polish
**Status**: ⬜ Not Started
**Objective**: Prediction market UI. User connects wallet, places testnet ALGO/USDC bet, winnings distributed after match resolves. End-to-end Algorand flow polished.
**Requirements**: REQ-08, REQ-09, REQ-18
**Deliverable**: Full demo flow: create agent → join match → place bet → match resolves → winnings received.

---

### Phase 5: Polish, Demo Prep & Submission
**Status**: ⬜ Not Started
**Objective**: Animations, micro-interactions, leaderboard, bug fixes, demo data seeded, README written. Hackathon submission ready.
**Requirements**: All REQs verified
**Deliverable**: Production-ready demo at `localhost:3000`, submission package complete.
