import algosdk from 'algosdk';

const ALGOD_SERVER = 'https://testnet-api.algonode.cloud';
const ALGOD_TOKEN = '';
const ALGOD_PORT = '';

export function getAlgodClient() {
  return new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);
}

export function getRegistryAppId() {
  const id = process.env.NEXT_PUBLIC_AGENT_REGISTRY_APP_ID;
  if (!id) throw new Error('NEXT_PUBLIC_AGENT_REGISTRY_APP_ID missing');
  return parseInt(id, 10);
}

/**
 * Build the transaction group to register an agent on-chain.
 * 1. Pay MBR to contract (storage fee)
 * 2. Fund agent wallet (2 ALGO)
 * 3. Call AgentRegistry.registerAgent
 */
export async function buildDeployAgentTxns(
  ownerAddress: string,
  agentAddress: string,
  agentName: string
): Promise<Uint8Array[]> {
  const algod = getAlgodClient();
  const sp = await algod.getTransactionParams().do();
  const appId = getRegistryAppId();
  const appAddress = algosdk.getApplicationAddress(appId);

  const feeTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: ownerAddress,
    receiver: appAddress,
    amount: 400_000,
    suggestedParams: sp,
  });

  const fundTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: ownerAddress,
    receiver: agentAddress,
    amount: 2_000_000,
    suggestedParams: sp,
  });

  const abiMethod = new algosdk.ABIMethod({
    name: 'registerAgent',
    args: [
      { type: 'pay', name: 'deployPayment' },
      { type: 'address', name: 'agentAddress' },
      { type: 'byte[32]', name: 'name' },
    ],
    returns: { type: 'void' },
  });

  const nameBytes = new Uint8Array(32);
  const nameEncoded = new TextEncoder().encode(agentName.slice(0, 32));
  nameBytes.set(nameEncoded);

  const pA = new TextEncoder().encode('agt_');
  const pO = new TextEncoder().encode('own_');
  const pC = new TextEncoder().encode('cnt_');
  const ownerPub = algosdk.decodeAddress(ownerAddress).publicKey;
  const agentPub = algosdk.decodeAddress(agentAddress).publicKey;
  const countBoxName = new Uint8Array([...pC, ...ownerPub]);

  let ownerCountValue = 0;
  try {
    const boxResponse = await algod.getApplicationBoxByName(appId, countBoxName).do();
    ownerCountValue = Number(algosdk.bytesToBigInt(boxResponse.value));
  } catch {}

  const ownerCountBytes = algosdk.bigIntToBytes(ownerCountValue, 8);
  const underscore = new TextEncoder().encode('_');
  const lengthPrefix = new Uint8Array([0, 41]);
  const agentsByOwnerBoxName = new Uint8Array([...pO, ...lengthPrefix, ...ownerPub, ...underscore, ...ownerCountBytes]);

  const callTxn = algosdk.makeApplicationCallTxnFromObject({
    sender: ownerAddress,
    appIndex: appId,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    suggestedParams: sp,
    appArgs: [abiMethod.getSelector(), agentPub, nameBytes],
    boxes: [
      { appIndex: appId, name: new Uint8Array([...pA, ...agentPub]) },
      { appIndex: appId, name: countBoxName },
      { appIndex: appId, name: agentsByOwnerBoxName },
    ],
  });

  const group = algosdk.assignGroupID([fundTxn, feeTxn, callTxn]);
  return group.map(t => t.toByte());
}


// Game type mapping
export const GAME_TYPE_MAP: Record<string, number> = { rps: 1, tictactoe: 2, nim: 3 };
export const GAME_TYPE_NAMES: Record<number, string> = { 1: 'rps', 2: 'tictactoe', 3: 'nim' };

// ─── Move encoding for on-chain settlement ─────────────────────────────────
// RPS: R=1, P=2, S=3
// TicTacToe: cell index 0-8 → stored as-is (0=no move, so cells are 1-indexed +1 offset)
// Nim: 1,2,3

export function encodeMove(gameId: string, move: any): number {
  if (gameId === 'rps') {
    if (move === 'R') return 1;
    if (move === 'P') return 2;
    if (move === 'S') return 3;
  }
  if (gameId === 'tictactoe') return Number(move) + 1; // offset to avoid 0
  if (gameId === 'nim') return Number(move);
  return 0;
}

export function decodeMove(gameId: string, encoded: number): any {
  if (gameId === 'rps') {
    if (encoded === 1) return 'R';
    if (encoded === 2) return 'P';
    if (encoded === 3) return 'S';
  }
  if (gameId === 'tictactoe') return encoded - 1; // reverse offset
  if (gameId === 'nim') return encoded;
  return null;
}

// ─── Create a commit hash (SHA256 of move+salt) ───────────────────────────
export async function createCommitHash(moveEncoded: number, salt: Uint8Array): Promise<Uint8Array> {
  const moveBytes = algosdk.bigIntToBytes(BigInt(moveEncoded), 8);
  const combined = new Uint8Array([...moveBytes, ...salt]);
  const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
  return new Uint8Array(hashBuffer);
}

export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

// ─── Box name helpers ─────────────────────────────────────────────────────
function getAgentBoxName(agentAddress: string): Uint8Array {
  const prefix = new TextEncoder().encode('agt_');
  const pub = algosdk.decodeAddress(agentAddress).publicKey;
  return new Uint8Array([...prefix, ...pub]);
}

function getMatchBoxName(matchId: number): Uint8Array {
  const prefix = new TextEncoder().encode('mat_');
  const idBytes = algosdk.bigIntToBytes(BigInt(matchId), 8);
  return new Uint8Array([...prefix, ...idBytes]);
}

// ─── Build createMatch transaction group ──────────────────────────────────
export async function buildCreateMatchTxns(
  ownerAddress: string,
  agentAddress: string,
  gameId: string,
  stakeAlgo: number,
  firstMove: any  // The agent's first move (for commit)
): Promise<{ txns: Uint8Array[]; salt: Uint8Array; encodedMove: number; nextMatchId: number }> {
  const algod = getAlgodClient();
  const sp = await algod.getTransactionParams().do();
  const appId = getRegistryAppId();
  const appAddress = algosdk.getApplicationAddress(appId);

  const salt = generateSalt();
  const encodedMove = encodeMove(gameId, firstMove);
  const commitHash = await createCommitHash(encodedMove, salt);

  const stakeAmount = Math.round(stakeAlgo * 1_000_000);

  // 1. Stake payment to contract
  const stakeTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: ownerAddress,
    receiver: appAddress,
    amount: stakeAmount,
    suggestedParams: sp,
  });

  const abiMethod = new algosdk.ABIMethod({
    name: 'createMatch',
    args: [
      { type: 'pay', name: 'stakePayment' },
      { type: 'address', name: 'agentA' },
      { type: 'uint64', name: 'gameType' },
      { type: 'byte[32]', name: 'commitHashA' },
    ],
    returns: { type: 'uint64' }
  });

  const agentPub = algosdk.decodeAddress(agentAddress).publicKey;

  let matchCount = 0;
  try {
    const appInfo = await algod.getApplicationByID(appId).do();
    const globalState: any[] = (appInfo.params as any).globalState ?? (appInfo.params as any)['global-state'] ?? [];
    for (const entry of globalState) {
      const key = Buffer.from(entry.key, 'base64').toString();
      if (key === 'mc') {
        matchCount = Number(entry.value.uint || 0);
        break;
      }
    }
  } catch (err) {
    console.error('Error fetching mc in buildCreateMatchTxns:', err);
  }
  const nextMatchId = matchCount + 1;

  const callTxn = algosdk.makeApplicationCallTxnFromObject({
    sender: ownerAddress,
    appIndex: appId,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    suggestedParams: { ...sp, fee: 2000, flatFee: true },
    appArgs: [
      abiMethod.getSelector(),
      agentPub,
      algosdk.bigIntToBytes(BigInt(GAME_TYPE_MAP[gameId] || 1), 8),
      commitHash,
    ],
    boxes: [
      { appIndex: appId, name: getAgentBoxName(agentAddress) },
      { appIndex: appId, name: getMatchBoxName(nextMatchId) },
    ]
  });

  const group = algosdk.assignGroupID([stakeTxn, callTxn]);
  return {
    txns: group.map(t => t.toByte()),
    salt,
    encodedMove,
    nextMatchId,
  };
}

// ─── Build joinMatch transaction group ───────────────────────────────────
export async function buildJoinMatchTxns(
  ownerAddress: string,
  agentAddress: string,
  matchId: number,
  stakeAlgo: number,
  firstMove: any,
  gameId: string
): Promise<{ txns: Uint8Array[]; salt: Uint8Array; encodedMove: number }> {
  const algod = getAlgodClient();
  const sp = await algod.getTransactionParams().do();
  const appId = getRegistryAppId();
  const appAddress = algosdk.getApplicationAddress(appId);

  const salt = generateSalt();
  const encodedMove = encodeMove(gameId, firstMove);
  const commitHash = await createCommitHash(encodedMove, salt);

  const stakeAmount = Math.round(stakeAlgo * 1_000_000);

  const stakeTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: ownerAddress,
    receiver: appAddress,
    amount: stakeAmount,
    suggestedParams: sp,
  });

  const abiMethod = new algosdk.ABIMethod({
    name: 'joinMatch',
    args: [
      { type: 'pay', name: 'stakePayment' },
      { type: 'uint64', name: 'matchId' },
      { type: 'address', name: 'agentB' },
      { type: 'byte[32]', name: 'commitHashB' },
    ],
    returns: { type: 'void' }
  });

  const agentPub = algosdk.decodeAddress(agentAddress).publicKey;

  const callTxn = algosdk.makeApplicationCallTxnFromObject({
    sender: ownerAddress,
    appIndex: appId,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    suggestedParams: { ...sp, fee: 2000, flatFee: true },
    appArgs: [
      abiMethod.getSelector(),
      algosdk.bigIntToBytes(BigInt(matchId), 8),
      agentPub,
      commitHash,
    ],
    boxes: [
      { appIndex: appId, name: getAgentBoxName(agentAddress) },
      { appIndex: appId, name: getMatchBoxName(matchId) },
    ]
  });

  const group = algosdk.assignGroupID([stakeTxn, callTxn]);
  return {
    txns: group.map(t => t.toByte()),
    salt,
    encodedMove,
  };
}

// ─── Build settleMatch transaction ────────────────────────────────────────
export async function buildSettleMatchTxn(
  callerAddress: string,
  matchId: number,
  moveA: number,
  saltA: Uint8Array,
  moveB: number,
  saltB: Uint8Array,
  agentAAddress: string,
  agentBAddress: string
): Promise<Uint8Array[]> {
  const algod = getAlgodClient();
  const sp = await algod.getTransactionParams().do();
  const appId = getRegistryAppId();

  // Retrieve owner addresses for inner payment transaction visibility
  let ownerAAddress: string | null = null;
  let ownerBAddress: string | null = null;

  try {
    const boxAName = getAgentBoxName(agentAAddress);
    const boxAVal = await algod.getApplicationBoxByName(appId, boxAName).do();
    ownerAAddress = algosdk.encodeAddress(boxAVal.value.slice(0, 32));
  } catch (err) {
    console.error('Error fetching owner A address from box:', err);
  }

  try {
    const boxBName = getAgentBoxName(agentBAddress);
    const boxBVal = await algod.getApplicationBoxByName(appId, boxBName).do();
    ownerBAddress = algosdk.encodeAddress(boxBVal.value.slice(0, 32));
  } catch (err) {
    console.error('Error fetching owner B address from box:', err);
  }

  const accounts: string[] = [];
  if (ownerAAddress) {
    accounts.push(ownerAAddress);
  }
  if (ownerBAddress && ownerBAddress !== ownerAAddress) {
    accounts.push(ownerBAddress);
  }

  const abiMethod = new algosdk.ABIMethod({
    name: 'settleMatch',
    args: [
      { type: 'uint64', name: 'matchId' },
      { type: 'uint64', name: 'moveA' },
      { type: 'byte[32]', name: 'saltA' },
      { type: 'uint64', name: 'moveB' },
      { type: 'byte[32]', name: 'saltB' },
    ],
    returns: { type: 'address' }
  });

  const callTxn = algosdk.makeApplicationCallTxnFromObject({
    sender: callerAddress,
    appIndex: appId,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    suggestedParams: { ...sp, fee: 3000, flatFee: true },
    appArgs: [
      abiMethod.getSelector(),
      algosdk.bigIntToBytes(BigInt(matchId), 8),
      algosdk.bigIntToBytes(BigInt(moveA), 8),
      saltA,
      algosdk.bigIntToBytes(BigInt(moveB), 8),
      saltB,
    ],
    boxes: [
      { appIndex: appId, name: getMatchBoxName(matchId) },
      { appIndex: appId, name: getAgentBoxName(agentAAddress) },
      { appIndex: appId, name: getAgentBoxName(agentBAddress) },
    ],
    accounts: accounts.length > 0 ? accounts : undefined,
  });

  return [callTxn.toByte()];
}

// ─── Fetch open matches from chain ────────────────────────────────────────
export interface OnChainMatch {
  matchId: number;
  gameType: number;
  gameId: string;
  agentA: string;
  agentB: string | null;
  stakeAmount: number; // in ALGO
  status: number; // 0=open, 1=committed, 3=settled
  createdAt: number;
  winner: string | null;
}

export async function fetchOpenMatches(): Promise<OnChainMatch[]> {
  const appId = getRegistryAppId();
  const algod = getAlgodClient();

  try {
    const appInfo = await algod.getApplicationByID(appId).do();
    const globalState: any[] = (appInfo.params as any).globalState ?? (appInfo.params as any)['global-state'] ?? [];

    let matchCount = 0;
    for (const entry of globalState) {
      const key = Buffer.from(entry.key, 'base64').toString();
      if (key === 'mc') {
        matchCount = Number(entry.value.uint || 0);
        break;
      }
    }

    const matches: OnChainMatch[] = [];
    const prefix = new TextEncoder().encode('mat_');

    for (let i = 1; i <= matchCount; i++) {
      try {
        const boxName = getMatchBoxName(i);
        const box = await algod.getApplicationBoxByName(appId, boxName).do();
        const data = new DataView(box.value.buffer);

        // Parse MatchRecord — fields in order as defined in contract:
        // matchId(8), gameType(8), agentA(32), agentB(32), stakeAmount(8),
        // commitHashA(32), commitHashB(32), revealedMoveA(8), revealedMoveB(8),
        // winner(32), status(8), createdAt(8)
        let offset = 0;
        const matchId = Number(data.getBigUint64(offset)); offset += 8;
        const gameType = Number(data.getBigUint64(offset)); offset += 8;
        const agentA = algosdk.encodeAddress(box.value.slice(offset, offset + 32)); offset += 32;
        const agentBRaw = box.value.slice(offset, offset + 32); offset += 32;
        const stakeAmount = Number(data.getBigUint64(offset)) / 1_000_000; offset += 8;
        offset += 32; // commitHashA
        offset += 32; // commitHashB
        offset += 8;  // revealedMoveA
        offset += 8;  // revealedMoveB
        const winnerRaw = box.value.slice(offset, offset + 32); offset += 32;
        const status = Number(data.getBigUint64(offset)); offset += 8;
        const createdAt = Number(data.getBigUint64(offset));

        const zeroAddr = algosdk.encodeAddress(new Uint8Array(32));
        const agentBAddr = algosdk.encodeAddress(agentBRaw);
        const winnerAddr = algosdk.encodeAddress(winnerRaw);

        matches.push({
          matchId,
          gameType,
          gameId: GAME_TYPE_NAMES[gameType] || 'rps',
          agentA,
          agentB: agentBAddr === zeroAddr ? null : agentBAddr,
          stakeAmount,
          status,
          createdAt,
          winner: winnerAddr === zeroAddr ? null : winnerAddr,
        });
      } catch {
        // Box might not exist yet, skip
      }
    }

    return matches;
  } catch (err) {
    console.error('fetchOpenMatches error:', err);
    return [];
  }
}

export async function submitSignedTxns(signedTxns: Uint8Array[]) {
  const algod = getAlgodClient();
  const res = await algod.sendRawTransaction(signedTxns).do();
  await algosdk.waitForConfirmation(algod, res.txid, 4);
  return res.txid;
}
