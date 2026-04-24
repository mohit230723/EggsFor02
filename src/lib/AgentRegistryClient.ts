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
 * Build the transaction group to:
 * 1. Pay only the Box MBR to the contract (storage fee, 0 deploy fee)
 * 2. Pay 2 ALGO directly to the agent wallet to fund its x402 activity
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

  // 1. Payment to contract (Fee + MBR)
  const feeTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: ownerAddress,
    receiver: appAddress,
    amount: 400_000,
    suggestedParams: sp,
  });

  // 2. Fund agent directly (2 ALGO for gas and initial x402 usage)
  const fundTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: ownerAddress,
    receiver: agentAddress,
    amount: 2_000_000,
    suggestedParams: sp,
  });

  // 3. Call registerAgent
  const abiMethod = new algosdk.ABIMethod({
    name: 'registerAgent',
    args: [
      { type: 'pay', name: 'deployPayment' },
      { type: 'address', name: 'agentAddress' },
      { type: 'byte[32]', name: 'name' }
    ],
    returns: { type: 'void' }
  });

  // Pad name to 32 bytes
  const nameBytes = new Uint8Array(32);
  const nameEncoded = new TextEncoder().encode(agentName.slice(0, 32));
  nameBytes.set(nameEncoded);

  // TEALScript BoxMap prefixes
  const pA = new TextEncoder().encode('agt_'); // 'agt_'
  const pO = new TextEncoder().encode('own_'); // 'own_'
  const pC = new TextEncoder().encode('cnt_'); // 'cnt_'

  const ownerPub = algosdk.decodeAddress(ownerAddress).publicKey;
  const agentPub = algosdk.decodeAddress(agentAddress).publicKey;

  const countBoxName = new Uint8Array([...pC, ...ownerPub]);

  // Value is 8 bytes uint64
  let ownerCountValue = 0;
  try {
    const boxResponse = await algod.getApplicationBoxByName(appId, countBoxName).do();
    ownerCountValue = Number(algosdk.bytesToBigInt(boxResponse.value));
  } catch {}

  const ownerCountBytes = algosdk.bigIntToBytes(ownerCountValue, 8);
  const underscore = new TextEncoder().encode('_');
  
  // TEALScript BoxMap dynamic types (like `string` or `bytes`) include a 2-byte length prefix.
  // The key length is 32 (pubkey) + 1 (underscore) + 8 (uint64) = 41 bytes.
  // Length prefix is [0, 41].
  const lengthPrefix = new Uint8Array([0, 41]);
  
  const agentsByOwnerBoxName = new Uint8Array([
    ...pO, 
    ...lengthPrefix, 
    ...ownerPub, 
    ...underscore, 
    ...ownerCountBytes
  ]);

  const callTxn = algosdk.makeApplicationCallTxnFromObject({
    sender: ownerAddress,
    appIndex: appId,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    suggestedParams: sp,
    appArgs: [
      abiMethod.getSelector(),
      agentPub,
      nameBytes
    ],
    boxes: [
      { appIndex: appId, name: new Uint8Array([...pA, ...agentPub]) }, // a + agentAddress
      { appIndex: appId, name: countBoxName },                         // c + ownerAddress
      { appIndex: appId, name: agentsByOwnerBoxName }                  // o + ownerAddress_count
    ]
  });

  // Group transactions
  const group = algosdk.assignGroupID([fundTxn, feeTxn, callTxn]);
  return group.map(t => t.toByte());
}

export async function submitSignedTxns(signedTxns: Uint8Array[]) {
  const algod = getAlgodClient();
  const res = await algod.sendRawTransaction(signedTxns).do();
  await algosdk.waitForConfirmation(algod, res.txid, 4);
  return res.txid;
}
