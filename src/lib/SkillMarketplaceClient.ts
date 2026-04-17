/**
 * SkillMarketplace contract client.
 * Thin TS wrapper over raw algosdk transactions — no ABI needed.
 */
import algosdk from 'algosdk';

// Testnet — update APP_ID after deployment
export const APP_ID = Number(process.env.NEXT_PUBLIC_SKILL_MARKETPLACE_APP_ID ?? 0);

export const TESTNET_ALGOD = 'https://testnet-api.algonode.cloud';
export const TESTNET_INDEXER = 'https://testnet-idx.algonode.cloud';

export function getAlgodClient() {
  return new algosdk.Algodv2('', TESTNET_ALGOD, 443);
}

export function getIndexerClient() {
  return new algosdk.Indexer('', TESTNET_INDEXER, 443);
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SkillListing {
  id: number;
  name: string;
  description: string;
  skillType: string;
  version: string;
  price: number; // microALGO
  seller: string;
  ipcsCid: string;
  soldCount: number;
  listedAt: number;
  active: boolean;
}

// ─── Box Helpers ─────────────────────────────────────────────────────────────

function skillBoxName(skillId: number): Uint8Array {
  return algosdk.encodeUint64(skillId);
}

function purchaseBoxName(skillId: number, buyer: string): Uint8Array {
  const idBytes = algosdk.encodeUint64(skillId);
  const sep = new TextEncoder().encode('_');
  const buyerBytes = algosdk.decodeAddress(buyer).publicKey;

  // Combined raw key: itob(id) + "_" + addr
  const key = new Uint8Array(idBytes.length + sep.length + buyerBytes.length);
  key.set(idBytes);
  key.set(sep, idBytes.length);
  key.set(buyerBytes, idBytes.length + sep.length);

  // ARC4 encoding: big-endian uint16 length prefix
  const len = key.length;
  const combined = new Uint8Array(2 + len);
  combined[0] = (len >> 8) & 0xff;
  combined[1] = len & 0xff;
  combined.set(key, 2);
  return combined;
}

// ─── Read Functions (no wallet needed) ───────────────────────────────────────

/**
 * Parse a skill metadata box from raw bytes.
 * Layout mirrors the TEALScript struct (fixed-width fields).
 */
function parseSkillBox(id: number, data: Uint8Array): SkillListing {
  const dec = new TextDecoder();
  const readStr = (offset: number, len: number) =>
    dec.decode(data.subarray(offset, offset + len)).replace(/\0/g, '').trim();
  const readU64 = (offset: number) => {
    let val = BigInt(0);
    for (let i = 0; i < 8; i++) val = (val << BigInt(8)) | BigInt(data[offset + i]);
    return Number(val);
  };

  // Field offsets based on struct layout:
  // name: 64, description: 256, skillType: 16, version: 16
  // price: 8, seller: 32, ipcsCid: 64, soldCount: 8, listedAt: 8, active: 8
  let offset = 0;
  const name = readStr(offset, 64); offset += 64;
  const description = readStr(offset, 256); offset += 256;
  const skillType = readStr(offset, 16); offset += 16;
  const version = readStr(offset, 16); offset += 16;
  const price = readU64(offset); offset += 8;
  const sellerBytes = data.subarray(offset, offset + 32); offset += 32;
  const seller = algosdk.encodeAddress(sellerBytes);
  const ipcsCid = readStr(offset, 64); offset += 64;
  const soldCount = readU64(offset); offset += 8;
  const listedAt = readU64(offset); offset += 8;
  const active = readU64(offset);

  return { id, name, description, skillType, version, price, seller, ipcsCid, soldCount, listedAt, active: active === 1 };
}

/**
 * Fetch all active skills from the contract.
 */
export async function fetchAllSkills(): Promise<SkillListing[]> {
  if (!APP_ID || APP_ID === 0) {
    console.error('fetchAllSkills: APP_ID is not set');
    return [];
  }
  const algod = getAlgodClient();

  // Helper to decode key that might be base64 string or byte array object
  const decodeKey = (key: any): string => {
    if (typeof key === 'string') return Buffer.from(key, 'base64').toString();
    if (key && typeof key === 'object') {
      const bytes = Array.isArray(key) ? key : Object.values(key);
      return String.fromCharCode(...(bytes as number[]));
    }
    return '';
  };

  try {
    // Get total skill count from global state
    const appInfo = await algod.getApplicationByID(APP_ID).do();
    const globalState = appInfo.params.globalState as unknown as Array<{ key: string; value: { type: number; uint: number } }>;
    const scEntry = globalState?.find(s => decodeKey(s.key) === 'sc');
    const skillCount = Number(scEntry?.value.uint ?? 0);

    const skills: SkillListing[] = [];

    for (let i = 1; i <= skillCount; i++) {
      try {
        const boxName = skillBoxName(i);
        const box = await algod.getApplicationBoxByName(APP_ID, boxName).do();
        const skill = parseSkillBox(i, box.value);
        if (skill.active) skills.push(skill);
      } catch {
        // box may not exist
      }
    }

    return skills;
  } catch (err) {
    console.error('fetchAllSkills failed:', err);
    return [];
  }
}

/**
 * Check if an address has purchased a skill.
 */
export async function checkAccess(skillId: number, buyer: string): Promise<boolean> {
  if (!APP_ID) return false;
  const algod = getAlgodClient();
  try {
    const boxName = purchaseBoxName(skillId, buyer);
    await algod.getApplicationBoxByName(APP_ID, boxName).do();
    return true;
  } catch {
    return false;
  }
}

// ─── Write Functions (require wallet / signed txns) ───────────────────────────

/**
 * Returns unsigned txns for listing a skill.
 * Caller signs and submits: [mbrPayTxn, appCallTxn] as atomic group.
 */
export async function makeListSkillTxns(params: {
  sender: string;
  name: string;
  description: string;
  skillType: string;
  version: string;
  priceAlgo: number;     // in ALGO (not microALGO)
  ipcsCid: string;
}): Promise<algosdk.Transaction[]> {
  if (!APP_ID || APP_ID === 0) {
    throw new Error('NEXT_PUBLIC_SKILL_MARKETPLACE_APP_ID is not configured');
  }

  const algod = getAlgodClient();
  const sp = await algod.getTransactionParams().do();
  const priceMicro = Math.floor(params.priceAlgo * 1_000_000);

  // Helper to decode key that might be base64 string or byte array object
  const decodeKey = (key: any): string => {
    if (typeof key === 'string') return Buffer.from(key, 'base64').toString();
    if (key && typeof key === 'object') {
      const bytes = Array.isArray(key) ? key : Object.values(key);
      return String.fromCharCode(...(bytes as number[]));
    }
    return '';
  };

  // 1. Fetch current skillCount from global state
  let currentCount = 0;
  try {
    const appInfo = await algod.getApplicationByID(APP_ID).do();
    const globalState = appInfo.params.globalState as unknown as Array<{ key: string; value: { type: number; uint: number } }>;
    const scEntry = globalState?.find(s => decodeKey(s.key) === 'sc');
    currentCount = Number(scEntry?.value.uint ?? 0);
  } catch (err: any) {
    console.error('Failed to fetch global state for next ID:', err);
    throw new Error(`Contract unavailable (App ID: ${APP_ID}). Check connection or refresh.`);
  }

  const nextId = currentCount + 1;

  // 2. Helper: pad/encode strings to fixed-width byte arrays
  const encodeFixed = (str: string, len: number): Uint8Array => {
    const bytes = new Uint8Array(len);
    const src = new TextEncoder().encode(str.slice(0, len));
    bytes.set(src);
    return bytes;
  };

  // MBR for Skill Metadata Box (480 bytes + overhead)
  const BOX_MBR = 195_000;

  const mbrTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: params.sender,
    receiver: algosdk.getApplicationAddress(APP_ID),
    amount: BOX_MBR,
    suggestedParams: sp,
  });

  const appCallTxn = algosdk.makeApplicationCallTxnFromObject({
    sender: params.sender,
    appIndex: APP_ID,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    appArgs: [
      new Uint8Array([0x4b, 0xb6, 0x6c, 0x56]), // listSkill ABI selector hash
      encodeFixed(params.name, 64),
      encodeFixed(params.description, 256),
      encodeFixed(params.skillType, 16),
      encodeFixed(params.version, 16),
      algosdk.encodeUint64(priceMicro),
      encodeFixed(params.ipcsCid, 64),
    ],
    boxes: [{ appIndex: 0, name: skillBoxName(nextId) }],
    suggestedParams: sp,
  });

  // Assign atomic group
  const group = [mbrTxn, appCallTxn];
  algosdk.assignGroupID(group);
  return group;
}

/**
 * Returns unsigned txns for buying a skill.
 * Caller signs and submits: [payTxn, appCallTxn] as atomic group.
 */
export async function makeBuySkillTxns(params: {
  sender: string;
  skillId: number;
  priceAlgo: number; // in ALGO
}): Promise<algosdk.Transaction[]> {
  const algod = getAlgodClient();
  const sp = await algod.getTransactionParams().do();
  const priceMicro = Math.floor(params.priceAlgo * 1_000_000);

  // 1. Fetch seller and admin to satisfy AVM account accessibility
  let sellerAddr = '';
  let adminAddr = '';
  try {
    const boxData = await algod.getApplicationBoxByName(APP_ID, skillBoxName(params.skillId)).do();
    const skill = parseSkillBox(params.skillId, boxData.value);
    sellerAddr = skill.seller;

    const appInfo = await algod.getApplicationByID(APP_ID).do();
    const globalState = appInfo.params.globalState as any[];
    const adEntry = globalState?.find(s => {
      // robust decode
      const keyStr = typeof s.key === 'string' ? Buffer.from(s.key, 'base64').toString() : String.fromCharCode(...Object.values(s.key) as number[]);
      return keyStr === 'ad';
    });
    if (adEntry) {
      adminAddr = algosdk.encodeAddress(Buffer.from(adEntry.value.bytes, 'base64'));
    }
  } catch (err) {
    console.error('Failed to pre-fetch accounts for purchase:', err);
    // Continue with fallback, though it might fail if accounts are missing
  }

  const payTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: params.sender,
    receiver: algosdk.getApplicationAddress(APP_ID),
    amount: priceMicro,
    suggestedParams: sp,
  });

  const appCallTxn = algosdk.makeApplicationCallTxnFromObject({
    sender: params.sender,
    appIndex: APP_ID,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    appArgs: [
      new Uint8Array([0xbb, 0x5c, 0xac, 0x56]), // buySkill ABI selector hash
      algosdk.encodeUint64(params.skillId),
    ],
    // seller and admin must be in accounts array for itxn_field Receiver
    accounts: [sellerAddr, adminAddr].filter(a => !!a && a !== params.sender),
    boxes: [
      { appIndex: 0, name: skillBoxName(params.skillId) },
      { appIndex: 0, name: purchaseBoxName(params.skillId, params.sender) },
    ],
    suggestedParams: {
      ...sp,
      fee: 3000,
      flatFee: true
    },
  });

  const group = [payTxn, appCallTxn];
  algosdk.assignGroupID(group);
  return group;
}
