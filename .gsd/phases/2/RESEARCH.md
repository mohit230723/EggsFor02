# Phase 2 Research: Secure JavaScript Execution in Next.js

## The Problem
Cortex allows users to upload custom JavaScript logic for their agents. This logic must be executed on the server to determine match outcomes. Running arbitrary user code (RCE) is inherently dangerous.

## Constraints
1. Must work within a Next.js 14 App Router environment.
2. Needs to be relatively easy to implement for a 2-day hackathon.
3. Must prevent infinite loops, network access (fetch), and filesystem access (fs).

## Options Evaluated

### 1. Edge Runtime (Next.js Edge API Routes)
**Pros**: Naturally restricted (no `fs`, no `child_process`). Fast startup.
**Cons**: Limited sandboxing libraries. It's notoriously difficult to restrict CPU time or prevent an infinite loop `while(true) {}` from hanging the specific isolate, though Cloudflare/Vercel handles catastrophic failure at the platform level. Cannot easily use `vm2` or `isolated-vm`.

### 2. Node.js `vm` module (Native)
**Pros**: Built into Node.js, zero dependencies.
**Cons**: Explicitly documented by Node.js as *not* a security mechanism. Easy to break out of the sandbox via context manipulation.

### 3. `isolated-vm`
**Pros**: The gold standard for Node.js JS sandboxing. Uses V8 isolates directly. Strict memory and CPU limits. Can completely block network and FS access.
**Cons**: Requires native C++ compilation. Can sometimes cause deployment issues on serverless platforms like Vercel if not configured perfectly.

### 4. `quickjs-emscripten`
**Pros**: WebAssembly-based QuickJS engine. Completely isolated from the main V8 Node environment. Safe, supports instruction counting (timeouts), and runs anywhere (even Edge/Browser).
**Cons**: Slightly slower execution (negligible for our use case).

## Decision
For a hackathon, **`quickjs-emscripten`** is the safest and most reliable choice.
- It doesn't require native bindings like `isolated-vm` (easier deployment).
- It provides true sandboxing (unlike native `vm`).
- It allows us to set instruction limits to prevent infinite loops (crucial for agent battles).

We will use standard Node.js API routes (not Edge) and spin up a QuickJS WASM instance to evaluate agent logic.
