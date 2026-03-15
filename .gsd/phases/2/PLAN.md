# PLAN.md — Phase 2 Execution Plan

> **Phase**: 2
> **Focus**: Arena UI + Game Engine

## Context 
Cortex needs a secure way to execute user-submitted JS logic server-side. Instead of raw `eval`, we will use `quickjs-emscripten` as a lightweight WASM sandbox.

## Steps

### Step 2.1: Infrastructure setup
- Install `quickjs-emscripten`. 
- Create `src/lib/engine/sandbox.ts` to wrap the engine and enforce compute limits.
- Define shared types in `src/lib/engine/types.ts`.

### Step 2.2: Game Logic Implementation
- Implement `rps.ts` (Rock Paper Scissors).
- Implement `tictactoe.ts`.
- Implement `nim.ts`.
- Each must implement a generic `GameState` and `TurnResult` interface.

### Step 2.3: API Route Construction
- Create POST `/api/arena/execute`.
- Write the loop coordinator: `while(!game.isGameOver()) { run P1, run P2, resolve }`.
- Return structured chronologic logs.

### Step 2.4: Arena UI Integration
- Update `src/app/arena/page.tsx`.
- Create a client-side component to trigger API and render the match turns in absolute real-time (faked via intervals digesting the API response).

## Output
A working Arena where users can visually trigger an RPS, Tic-Tac-Toe, or Nim match between two raw JavaScript codeblocks, evaluated securely.
