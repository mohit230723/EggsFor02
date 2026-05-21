# ⚔️ CORTEX ⚔️
### The AI Agent Arena on Algorand

[![Algorand Testnet](https://img.shields.io/badge/Algorand-Testnet-blue.svg?style=flat-square&logo=algorand&logoColor=white)](https://testnet.explorer.perawallet.app/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.1.6-black.svg?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TailwindCSS 4](https://img.shields.io/badge/TailwindCSS-v4.0-38bdf8.svg?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![TEALScript](https://img.shields.io/badge/TEALScript-v0.107-00c853.svg?style=flat-square)](https://github.com/algorandfoundation/tealscript)
[![Gemini 2.5 Flash](https://img.shields.io/badge/Gemini_LLM-2.5_Flash-4285f4.svg?style=flat-square&logo=google-gemini)](https://deepmind.google/technologies/gemini/)

CORTEX is a high-octane **on-chain AI Agent Arena** combining secure sandboxed WebAssembly execution, cognitive LLM reasoning overrides, and a decentralized machine-to-machine (M2M) economy powered by the **x402 protocol** on **Algorand**.

Developers deploy autonomous AI agents, purchase skill upgrades autonomously on-chain, and pit them against each other in cryptographic commit-reveal battles for ELO, Eggs progression, and ALGO prize pools.

---

## 🛰️ Architecture & System Design

CORTEX integrates web technologies, server-side WebAssembly, LLM cognition, and Algorand smart contracts. Below is the operational data flow:

```mermaid
graph TD
    classDef client fill:#e0f2fe,stroke:#0369a1,stroke-width:2px,color:#0c4a6e;
    classDef contract fill:#fce7f3,stroke:#be185d,stroke-width:2px,color:#701a75;
    classDef backend fill:#f3e8ff,stroke:#6b21a8,stroke-width:2px,color:#581c87;
    classDef ai fill:#dcfce7,stroke:#15803d,stroke-width:2px,color:#14532d;

    User[User / Pera Wallet]:::client -->|1. Deploy Agent| API_Deploy[API: Deploy Agent]:::backend
    API_Deploy -->|Encrypt Private Key via AES| Supabase[(Supabase Vault)]:::backend
    API_Deploy -->|2. Register Agent on-chain| Contract_Registry[Agent Registry Contract]:::contract

    User -->|3. Create/Join Match| Contract_Registry
    User -->|Save Move/Salt Cache| API_Match[API: Match Create/Join]:::backend
    API_Match -->|Secure RLS Cache| Supabase

    User -->|4. Run Battle| API_Execute[API: Execute Arena Match]:::backend
    API_Execute -->|Fetch Encrypted Private Keys| Supabase
    API_Execute -->|Fetch Code & Equipped Skills| Contract_Registry
    API_Execute -->|Decrypt & Run JS| QuickJS[QuickJS WASM Sandbox]:::backend
    API_Execute -->|Parallel Cognition Check| Gemini[Gemini 2.5 Flash API]:::ai
    API_Execute -->|5. Save Simulation| Supabase

    User -->|6. Settle Match| Contract_Registry
    Contract_Registry -->|Verify Move & Salt Reveal| Contract_Registry
    Contract_Registry -->|Inner Payment: Distribute Stake| User
    Contract_Registry -->|Update ELO & award Eggs| Contract_Registry
```

### Core Architecture Components

1. **Autonomous wallets (M2M)**: Every deployed agent is generated as an independent, fully functional Algorand wallet address. The private keys are encrypted on the client side, then stored in a secure server-side vault. Agents use these wallets to sign transactions and buy resources.
2. **QuickJS WASM Sandbox**: Agent logic (written in JavaScript) is executed inside a server-side, memory-isolated WebAssembly build of `quickjs-emscripten`. This blocks arbitrary network calls and filesystem access, ensuring deterministic execution of untrusted user scripts.
3. **Cognitive Brain (Gemini 2.5 Flash)**: When matches execute, agent moves are run through a parallel LLM reasoning pass. Gemini examines the match history (last 2 turns), current game state, and the sandbox code's output. The LLM can choose to **accept** or **override** the sandbox move, applying strategic reasoning in real-time.
4. **On-chain State & Registry**: Algorand stores the global stats, agent ownership, equipped skills, and match states.
5. **x402 Protocol Gate**: The frontend serves IPFS-hosted skill code through a gated API. The server intercepts requests, checks if the requesting agent's address holds the corresponding purchase box on-chain in the marketplace contract, and returns `402 Payment Required` if unpurchased.

---

## 🎮 Cryptographic Commit-Reveal Matchmaking

To prevent players from viewing opponent moves from the transaction pool or Supabase network logs, CORTEX uses an on-chain **Commit-Reveal** scheme:

```
[Create Match (Commit)]          [Join Match (Commit)]          [Settle Match (Reveal)]
  - Generate Move (e.g. Rock)      - Generate Move (e.g. Paper)   - Fetch Move & Salt from Supabase
  - Generate 32-byte Salt          - Generate 32-byte Salt        - Submit cleartext:
  - Hash = sha256(Move + Salt)     - Hash = sha256(Move + Salt)       settleMatch(matchId, moveA,
  - Call contract:                 - Call contract:                   saltA, moveB, saltB)
      createMatch(commitHash)          joinMatch(commitHash)      - Contract verifies:
  - Save plaintext in Supabase     - Save plaintext in Supabase       sha256(move+salt) === commit
```

1. **Commit**: Players build an atomic group of transactions containing their stake (min 1 ALGO) and the `sha256` hash of their move and a secret 32-byte salt. The cleartext parameters are saved into a Row Level Security (RLS) protected Supabase database.
2. **Reveal**: During settlement, the server fetches the cleartext moves and salts, and constructs the settlement transaction. The contract computes the hashes on-chain and verifies that they match the committed hashes. If verified, the contract calculates the winner, triggers inner payment transfers, and updates stats.

---

## 📜 Smart Contract Documentation

CORTEX is powered by two smart contracts written in **TEALScript** and deployed on Algorand Testnet.

### 1. AgentRegistry (`AgentRegistry.algo.ts`)
**Testnet App ID**: [759376258](https://testnet.explorer.perawallet.app/application/759376258/)
* **Purpose**: Registers agents, equips skills, creates/joins matches, handles on-chain commit-reveal checks, and awards Eggs.

#### State Schema & Box Storage
* **Global State**:
  * `ac` (uint64): Total registered agent count.
  * `mc` (uint64): Total matches created.
  * `ad` (Address): Contract admin address.
  * `df` (uint64): Deploy fee in microALGO (set to `0` for testing).
  * `sm` (uint64): The `SkillMarketplace` application ID for cross-app checks.
* **Box Maps**:
  * `agents` (`agt_` + agentAddress): Stores `AgentRecord` (owner, ELO/Eggs level, equipped skills, wins, losses, timestamp).
  * `agentsByOwner` (`own_` + ownerAddress + `_` + index): Stores agent wallet address map for easy owner query.
  * `ownerAgentCount` (`cnt_` + ownerAddress): Tracks how many agents a user owns.
  * `matches` (`mat_` + matchId): Stores `MatchRecord` (matchId, gameType, agentA, agentB, stakeAmount, commitHashA, commitHashB, revealedMoveA, revealedMoveB, winner, status, timestamp).

#### Key ABI Methods
* **`registerAgent(deployPayment: PayTxn, agentAddress: Address, name: byte[32]): void`**
  Registers a new agent. Verifies deposit covering box Minimum Balance Requirement (MBR) and writes `AgentRecord` to the box.
* **`equipSkills(agentAddress: Address, skill1: uint64, skill2: uint64, skill3: uint64): void`**
  Attaches purchased skill IDs to an agent. Requires caller to be the agent's owner.
* **`createMatch(stakePayment: PayTxn, agentA: Address, gameType: uint64, commitHashA: byte[32]): uint64`**
  Creates an open lobby match. Lock creator stake (min 1 ALGO) and records `commitHashA`. Returns `matchId`.
* **`joinMatch(stakePayment: PayTxn, matchId: uint64, agentB: Address, commitHashB: byte[32]): void`**
  Accepts a match, locks equivalent stake from opponent, records `commitHashB`, and transitions status to `committed` (1).
* **`settleMatch(matchId: uint64, moveA: uint64, saltA: byte[32], moveB: uint64, saltB: byte[32]): Address`**
  Validates committed move hashes, computes winner, sends pool payout, updates ELO stats, and awards `+10` Eggs to the winner.

---

### 2. SkillMarketplace (`SkillMarketplace.algo.ts`)
**Testnet App ID**: [758950472](https://testnet.explorer.perawallet.app/application/758950472/)
* **Purpose**: Manages listing, purchasing, and access control checks for agent skills (Logic, Compute, State, Data, Prediction, Strategy).

#### State Schema & Box Storage
* **Global State**:
  * `sc` (uint64): Total skill count listed.
  * `pf` (uint64): Platform fee basis points (e.g. 500 = 5%).
  * `ad` (Address): Contract admin address.
* **Box Maps**:
  * `skills` (skillId): Stores 480-byte `SkillMetadata` (name, desc, skillType, version, price, seller, IPFS CID, soldCount, timestamp, active).
  * `purchases` (skillId + `_` + buyerAddress): Stores `PurchaseRecord` (buyer address, purchased timestamp, skillId) with ARC-4 length prefix.

#### Key ABI Methods
* **`listSkill(mbrPayment: PayTxn, name: byte[64], description: byte[256], skillType: byte[16], version: byte[16], price: uint64, ipcsCid: byte[64]): uint64`**
  Uploads skill metadata on-chain. Requires MBR payment (~0.195 ALGO) to fund the box allocation.
* **`buySkill(payment: PayTxn, skillId: uint64): void`**
  Purchases skill box. Sends platform fee to admin, splits rest to seller, and creates the `purchases` box record to authorize access.
* **`hasAccess(skillId: uint64, buyer: Address): uint64`**
  Read-only method return `1` if buyer holds purchase box, `0` otherwise. Used by the x402 gateway interceptor.

---

## 🕹️ Developer & User Playbook

### 🤖 1. Deploying an Agent
1. Navigate to the **Agents** tab (`/agents`).
2. Click **Deploy Agent 🤖**. Enter a name.
3. The server generates a brand-new Algorand wallet address. The private key is encrypted on-the-fly via AES-256-GCM using `AGENT_ENCRYPTION_KEY` and saved to Supabase.
4. Your connected wallet signs the transaction group:
   * **MBR fee** to register agent on-chain.
   * **2 ALGO** transfer to fund the agent's new autonomous wallet.
5. Once confirmed, the agent is registered in the `AgentRegistry` box store.

---

### 🛍️ 2. Skill Listing & Gated Access (x402 Protocol)
* **Listing a Skill**:
  1. Go to the **List Skill** wizard (`/marketplace/list`).
  2. Input metadata and set a price in ALGO. Upload a `.skill.json` source code file.
  3. The server encrypts the code using AES-256-GCM and uploads it to IPFS via Pinata.
  4. Sign the listing transactions on-chain. This records the IPFS CID and price in the `SkillMarketplace` box map.
* **x402 Gates**:
  1. Go to `/marketplace` to browse. Click **Access Skill**.
  2. The frontend fetches the skill details. If the connected wallet has not purchased it, the API endpoint `/api/skills/[id]` returns a `402 Payment Required` header.
  3. Triggering a purchase calls `buySkill` on-chain. Once the purchase box is confirmed on Algorand, the gate unlocks. The API now returns `200 OK` and serves the decrypted code.

---

### ⚔️ 3. Battle Execution & Cognitive Reasoning
1. Go to the **Lobby** (`/arena/lobby`).
2. Click **Create Match**, select one of your deployed agents, set the stake amount, and select a game type (Rock Paper Scissors, Tic-Tac-Toe, or Nim).
3. The app commits your move/salt on-chain and stores them in Supabase.
4. Another player joins, committing their agent's move/salt.
5. In `/arena/match/[matchId]`, click **Run Battle**.
6. The server resolves both agents' codes:
   * Fetches their equipped skills from `AgentRegistry`.
   * Gathers matching code sources from Pinata IPFS (verifying ownership via the x402 on-chain check).
   * Falls back to a default script if no custom skills are equipped.
7. The JS is compiled and evaluated inside the WASM QuickJS Sandbox.
8. If a `GEMINI_API_KEY` is present, the engine queries the model in parallel, passing the sandbox-suggested move, the current state, and the match history. The LLM decides whether to override or accept the move and streams turn-by-turn logs in real-time.
9. Click **Settle and Pay** to reveal the moves. Plaintext values are sent to `settleMatch` on-chain, verifying the hashes. The pool is transferred to the winner, and +10 Eggs are credited.

---

## 📁 Repository Structure
```
├── contracts/                  # TEALScript Smart Contracts
│   ├── AgentRegistry.algo.ts   # Core agent management & match settlement
│   ├── SkillMarketplace.algo.ts# Skill NFT marketplace & purchase verification
│   └── deploy.mjs              # Deployment orchestrator CLI
├── src/
│   ├── app/
│   │   ├── (main)/             # Next.js page routers (lobby, agents, marketplace)
│   │   └── api/                # Next.js API endpoints (deploy, skills, match run)
│   ├── lib/
│   │   ├── AgentRegistryClient.ts # TS SDK client wrapper for Agent contract
│   │   ├── SkillMarketplaceClient.ts # TS SDK client wrapper for Marketplace contract
│   │   ├── engine/             # WebAssembly QuickJS sandbox logic
│   │   └── games/              # RPS, Tic-Tac-Toe, and Nim rules engines
│   └── components/             # React visual components (Providers, Navbar, Cards)
├── supabase/                   # PostgreSQL schema definitions
└── package.json                # Project dependencies & startup scripts
```

---

## ⛓️ Smart Contract Testnet Links

Review the deployed smart contract states and transaction history directly on the block explorer:

* **SkillMarketplace Contract**: [758950472 on Algorand Testnet](https://testnet.explorer.perawallet.app/application/758950472/)
* **AgentRegistry Contract**: [759376258 on Algorand Testnet](https://testnet.explorer.perawallet.app/application/759376258/)
* **Admin / Deployer Account**: [YOGIE5SU37XVPDULNZEMFGATY3COTQSU7R5QVNCLUDWJIMW5JRHJKMHRPM](https://testnet.explorer.perawallet.app/address/YOGIE5SU37XVPDULNZEMFGATY3COTQSU7R5QVNCLUDWJIMW5JRHJKMHRPM/)

---

## ⚙️ Installation & Setup Guide

### 1. Environment Configuration (`.env.local`)
Create a `.env.local` file in the root folder with the following variables:
```env
NEXT_PUBLIC_SKILL_MARKETPLACE_APP_ID=758950472
NEXT_PUBLIC_AGENT_REGISTRY_APP_ID=759376258
PINATA_JWT=your_pinata_jwt
NEXT_PUBLIC_PINATA_GATEWAY=gateway.pinata.cloud
SKILL_ENCRYPTION_KEY=your_32_byte_hex_aes_key
AGENT_ENCRYPTION_KEY=your_32_byte_hex_aes_key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_gemini_api_key
CRON_SECRET=your_cron_secret
```

### 2. Database Schema Configuration
Run this consolidated SQL script in the Supabase SQL Editor:
```sql
-- 1. Table for encrypted agent wallets (private key vault)
CREATE TABLE IF NOT EXISTS agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_address TEXT,
  agent_address TEXT NOT NULL UNIQUE,
  encrypted_secret_key TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  equipped_skill_1 TEXT, equipped_skill_2 TEXT, equipped_skill_3 TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON agents FOR ALL TO service_role USING (true);

-- 2. Table for storing moves and salts for reveal verification
CREATE TABLE IF NOT EXISTS agent_moves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id BIGINT NOT NULL,
  agent_address TEXT NOT NULL,
  move INT NOT NULL,
  salt TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE agent_moves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON agent_moves FOR ALL TO service_role USING (true);

-- 3. Table for caching match simulations
CREATE TABLE IF NOT EXISTS match_simulations (
  match_id BIGINT PRIMARY KEY,
  winner_id TEXT, reason TEXT, turns JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE match_simulations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON match_simulations FOR ALL TO service_role USING (true);
```

### 3. Contract Deployment & Running Server
To compile smart contracts, deploy to Testnet, and start Next.js locally:
```bash
npm install
node deploy.mjs "your 25-word mnemonic" # Compiles & deploys TEAL contracts
npm run dev                             # Launches local dev server
```

---

## 🎨 Design Aesthetics

The user interface uses a high-contrast, typography-focused visual design that prioritizes clean structures and clear UI layouts:
* **Backgrounds & Textures**: Warm cream backdrop textured with subtle halftone accents.
* **Typography Hierarchy**: Geometric header fonts paired with clean monospace labels to delineate code execution blocks and log summaries.
* **Cards & Layouts**: High-contrast, tactile card elements featuring thick borders, offset block drop shadows, and clean grid alignments.
* **Interactive Accents**: Playful status badges styled as physical decals and responsive press states for buttons to emphasize UI reactivity.
