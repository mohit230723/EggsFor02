# SPEC.md — Project Specification

> **Status**: `FINALIZED`
> **Project**: Cortex — AI Agent Arena
> **Hackathon**: Algorand Hackseries 3

---

## Vision

Cortex is an AI agent arena where users upload and configure their own autonomous AI agents, each equipped with an Algorand testnet wallet. Agents compete in deterministic mini-games, users place on-chain predictions (ALGO/USDC testnet) on match outcomes, agents autonomously buy/sell skills via a marketplace, and owners manage their agent's loadout through a drag-and-drop panel.

---

## Goals

1. **Arena** — Users can create 1v1 matches across 6 game types, or join open slots. Matches execute agent logic and produce a winner.
2. **Prediction Market** — Users bet on match outcomes with ALGO/USDC on Algorand testnet. Winnings distributed automatically.
3. **Skill Marketplace** — Agents autonomously buy/sell skill NFTs (better API capabilities, enhanced moves). Powered by the x402 protocol.
4. **Agent Management Panel** — Users upload agent logic and configure loadout via drag-and-drop skill assignment.
5. **Fight Club UI** — Gritty, industrial aesthetic. Amber/blood-red palette. Bebas Neue + Special Elite typography.

---

## Non-Goals (Out of Scope for v1)

- Real mainnet ALGO transactions (testnet only)
- Multiplayer agent logic execution (agents run sequentially server-side)
- Mobile-native app
- External AI model integrations (agents are custom JS/Python logic, not LLM-powered by default)
- Tournament brackets (v2)

---

## Users

- **Builders/Hackers** — Upload custom agent logic (JS/Python), want to compete
- **Spectators/Bettors** — Watch live matches, place predictions with testnet ALGO
- **Judges/Evaluators** — Assess the depth of Algorand integration, UI quality, and concept novelty

---

## Games (Arena)

| Game | Description | Tags |
|---|---|---|
| Rock Paper Scissors | Pattern detection & randomness | Instant, Elo Ranked |
| Nim Subtraction | Take 1–3 tokens. Force opponent to take last. | Math Logic, Solved Game |
| Tic-Tac-Toe (3x3) | Classic grid control | Simple, Grid-Based |
| Memory Match | Find matching pairs. Tests state tracking. | Pattern Search, Memory |
| Math Duel | Solve equations or reach target number faster | Computation, Speed |
| Higher or Lower (War) | Compare hidden values. Probability & deck tracking. | EZ Build, Probability |

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Drag-and-Drop | `@hello-pangea/dnd` or `dnd-kit` |
| Blockchain | Algorand testnet via `algosdk` + Algorand MCP |
| Real-time | Supabase (WebSockets for live match state) |
| Agent Logic | User-uploaded JS functions, sandboxed server-side |
| Prediction Market | Custom smart contract OR Alpha Arcade integration |

---

## Constraints

- **Timeline**: UI complete within 2 days; full integration within hackathon window
- **Network**: Algorand testnet only (no mainnet risk)
- **Agent Logic**: Must be sandboxed to prevent malicious code execution
- **Wallet**: Each AI agent has its own Algorand testnet wallet (generated server-side)

---

## Success Criteria

- [ ] User can upload agent logic and create an agent with a testnet wallet
- [ ] Two agents can be matched in at least 3 game types and produce a winner
- [ ] User can place a testnet ALGO/USDC bet on a match outcome and receive winnings
- [ ] Agent can autonomously purchase a skill from the marketplace (on-chain testnet tx)
- [ ] Drag-and-drop skill assignment works on the agent management panel
- [ ] UI reflects Fight Club aesthetic with Bebas Neue typography and amber/blood-red palette
- [ ] Real-time match state updates visible to spectators/bettors
