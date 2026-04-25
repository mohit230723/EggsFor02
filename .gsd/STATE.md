# STATE.md — M2M AI Agent Ecosystem

> Last updated: 2026-04-25

## Project Status: ✅ Core Deployment Pipeline Complete

All three phases of the deployment & fixes plan have been implemented and verified.

---

## Completed Work

### Phase 1: Smart Contract Compilation Fixes
- **BoxMap prefix collisions** — Added explicit 4-letter prefixes (`agt_`, `own_`, `cnt_`, `mat_`) to all `BoxMap` declarations in `contracts/AgentRegistry.algo.ts`
- **Type mismatch fix** — Removed `rawBytes()` cast in `settleMatch()` so `sha256()` return (`byte[32]`) matches `commitHashA`/`commitHashB` type (`StaticArray<byte, 32>`)

### Phase 2: Frontend UI & Deployment Flow
- **Drag-and-drop skill equipping** — HTML5 drag events (`onDragStart`, `onDragOver`, `onDrop`) in `src/app/agents/page.tsx` with local `equippedSkillsMap` state
- **Supabase `agents` table** — Schema defined in `supabase/schema.sql` with RLS (service_role only)
- **Agent deploy API** — `POST /api/agent/deploy` generates wallet, encrypts SK via AES-256-GCM, saves to Supabase
- **Agent list API** — `GET /api/agent/list?owner=ADDRESS` returns agents enriched with live ALGO balance

### Phase 3: Atomic Transaction Integration
- **Transaction ordering** — `AgentRegistryClient.ts` groups as `[fundTxn, feeTxn, callTxn]` so `feeTxn` (contract MBR) immediately precedes `callTxn`
- **ARC-4 box reference** — 2-byte length prefix `[0, 41]` prepended to `agentsByOwner` box name for dynamic `string` key encoding
- **Zero deploy fee** — `DEPLOY_FEE_ALGO = 0` in UI, `deployFeeAlgo = 0` in `deploy.mjs`

---

## Architecture

```
contracts/
  AgentRegistry.algo.ts     — Agent registration, match system (RPS), Eggs progression
  SkillMarketplace.algo.ts  — Skill NFT marketplace
  artifacts/                — Compiled TEAL outputs

src/
  app/
    agents/page.tsx         — Agent swarm management (deploy, equip, stats)
    arena/                  — Match arena UI
    marketplace/            — Skill marketplace UI
    api/agent/deploy/       — Wallet generation + vault storage
    api/agent/list/         — Agent listing with balance enrichment
    api/skills/             — Skill CRUD + purchase
    api/arena/execute/      — Match execution engine
  lib/
    AgentRegistryClient.ts  — Atomic txn builder for agent registration
    SkillMarketplaceClient.ts
    encryption.ts           — AES-256-GCM utils
    engine/                 — Game sandbox (quickjs-emscripten)
    games/                  — Game type definitions
  components/
    Providers.tsx           — Pera Wallet + context providers
    Navbar.tsx, Footer.tsx  — Layout
    ui/                     — Design system (Button, Card, Badge, etc.)

deploy.mjs                 — CLI deployer for both contracts to TestNet
supabase/schema.sql         — Agent key vault schema
```

---

## Environment Variables Required

```
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
AGENT_ENCRYPTION_KEY=          # 32-byte hex for AES-256-GCM
NEXT_PUBLIC_AGENT_REGISTRY_APP_ID=
NEXT_PUBLIC_SKILL_MARKETPLACE_APP_ID=
```

---

## What's Next

Ready for new features. Potential next steps:
- Live on-chain Eggs/stats fetch (currently mocked at 0)
- On-chain `equipSkills` transaction call from frontend
- Match creation and settlement UI in Arena
- x402 protocol integration for autonomous agent skill purchases
- Group collaboration (shared tasks, chat)
