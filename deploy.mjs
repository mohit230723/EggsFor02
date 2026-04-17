/**
 * deploy.mjs — Deploy SkillMarketplace to Algorand TestNet without Docker
 *
 * Usage:
 *   node deploy.mjs "word1 word2 word3 ... word25"
 *
 * After success, copy the printed App ID into .env.local as:
 *   NEXT_PUBLIC_SKILL_MARKETPLACE_APP_ID=<id>
 */

import { execSync } from 'child_process';
import algosdk from 'algosdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Config ──────────────────────────────────────────────────────────────────
const ALGOD_SERVER  = 'https://testnet-api.algonode.cloud';
const ALGOD_TOKEN   = '';
const ALGOD_PORT    = '';

const APPROVAL_TEAL = path.join(__dirname, 'contracts/artifacts/SkillMarketplace.approval.teal');
const CLEAR_TEAL    = path.join(__dirname, 'contracts/artifacts/SkillMarketplace.clear.teal');

// ─── Main ─────────────────────────────────────────────────────────────────────
async function deploy() {
  const mnemonic = process.argv[2] || process.env.TESTNET_DEPLOYER_MNEMONIC;
  if (!mnemonic) {
    console.error('\nUsage: node deploy.mjs "<your 25-word mnemonic>"\n');
    console.error('Or set process.env.TESTNET_DEPLOYER_MNEMONIC');
    process.exit(1);
  }

  const account = algosdk.mnemonicToSecretKey(mnemonic);
  const addrStr  = account.addr.toString();
  console.log(`\n🔑 Deploying from: ${addrStr}\n`);

  console.log('📦 Compiling TEALScript locally (Offline)...');
  try {
    if (!fs.existsSync(path.join(__dirname, 'contracts/artifacts'))) {
      fs.mkdirSync(path.join(__dirname, 'contracts/artifacts'));
    }
    execSync('npx tealscript contracts/SkillMarketplace.algo.ts contracts/artifacts --skip-algod', { stdio: 'inherit' });
  } catch (err) {
    console.error('❌ Compilation failed.');
    process.exit(1);
  }

  const algod = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

  // Compile TEAL source to bytecode using Testnet
  async function compileTealToBytes(source) {
    const result = await algod.compile(source).do();
    return new Uint8Array(Buffer.from(result.result, 'base64'));
  }

  // Read → compile both programs
  const approvalSource = fs.readFileSync(APPROVAL_TEAL, 'utf8');
  const clearSource    = fs.readFileSync(CLEAR_TEAL, 'utf8');

  console.log('⚙️  Compiling TEAL programs on Testnet...');
  const approvalProgram = await compileTealToBytes(approvalSource);
  const clearProgram    = await compileTealToBytes(clearSource);
  console.log('✅ Compiled OK\n');

  // Fetch suggested params
  console.log('📡 Fetching network params...');
  const sp = await algod.getTransactionParams().do();
  
  // Method: createApplication()void
  const abiMethod = new algosdk.ABIMethod({
    name: 'createApplication',
    desc: 'Initializes the contract.',
    args: [],
    returns: { type: 'void' },
  });
  
  // Create the application creation transaction
  const txn = algosdk.makeApplicationCreateTxnFromObject({
    sender: addrStr,
    suggestedParams: sp,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    approvalProgram,
    clearProgram,
    numGlobalByteSlices: 1, // admin
    numGlobalInts: 2,       // skillCount, platformFeeBps
    numLocalByteSlices: 0,
    numLocalInts: 0,
    appArgs: [abiMethod.getSelector()]
  });

  const signedTxn = txn.signTxn(account.sk);

  console.log('📡 Sending transaction to TestNet...');
  const sendResult = await algod.sendRawTransaction(signedTxn).do();
  const txid = sendResult.txid;
  console.log(`📨 TX ID: ${txid}`);

  // Wait for confirmation
  const result = await algosdk.waitForConfirmation(algod, txid, 8);
  const appId  = result.applicationIndex || result['application-index'];

  console.log('\n==========================================');
  console.log(`✅ CONTRACT DEPLOYED SUCCESSFULLY`);
  console.log(`   App ID:      ${appId}`);
  console.log(`   App Address: ${algosdk.getApplicationAddress(appId)}`);
  console.log('==========================================');
  console.log(`\nAdd this to your .env.local:\n  NEXT_PUBLIC_SKILL_MARKETPLACE_APP_ID=${appId}\n`);
}

deploy().catch(console.error);
