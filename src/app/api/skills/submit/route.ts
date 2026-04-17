/**
 * POST /api/skills/submit
 * Submits signed transactions to Algorand testnet.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAlgodClient } from '@/lib/SkillMarketplaceClient';

export async function POST(req: NextRequest) {
  try {
    const { signedTxns } = await req.json();
    if (!Array.isArray(signedTxns) || signedTxns.length === 0) {
      return NextResponse.json({ error: 'signedTxns required' }, { status: 400 });
    }

    const algod = getAlgodClient();
    const decoded = signedTxns.map((b64: string) =>
      new Uint8Array(Buffer.from(b64, 'base64'))
    );

    const result = await algod.sendRawTransaction(decoded).do();
    const txId = result.txid ?? '';

    // Wait for confirmation
    await waitForConfirmation(algod, txId, 4);

    return NextResponse.json({ txId, confirmed: true });
  } catch (err: unknown) {
    console.error('[/api/skills/submit]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Submit failed' },
      { status: 500 }
    );
  }
}

async function waitForConfirmation(algod: ReturnType<typeof getAlgodClient>, txId: string, rounds: number) {
  const status = await algod.status().do();
  let lastRound = status.lastRound;
  const maxRound = lastRound + BigInt(rounds);

  while (lastRound < maxRound) {
    try {
      const info = await algod.pendingTransactionInformation(txId).do();
      if (info.confirmedRound && info.confirmedRound > 0) return;
    } catch { /* not yet confirmed */ }
    await algod.statusAfterBlock(lastRound).do();
    lastRound++;
  }
}
