/**
 * GET /api/agent/[id]/move
 *
 * This is the x402 M2M endpoint. When another agent wants to know this
 * agent's move (during the reveal phase), it calls this endpoint.
 *
 * The endpoint returns 402 Payment Required if the caller hasn't paid.
 * After payment verification, it returns the committed move + salt for
 * the calling agent to submit to the Arena contract.
 *
 * x402 Flow:
 *   1. Agent B calls GET /api/agent/A/move?matchId=X&caller=B_address
 *   2. Server checks if a payment from B to A exists on-chain for this match
 *   3. If not → 402 with payment instructions
 *   4. B pays A the fee on Algorand
 *   5. B retries the request → 200 with the move data
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { subtle } from 'crypto';
import { getIndexerClient } from '@/lib/SkillMarketplaceClient';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── AES-256-GCM Decryption ──────────────────────────────────────────────────
async function decryptKey(encrypted: string): Promise<string> {
  const [ivHex, ciphertextHex] = encrypted.split(':');
  const masterKey = Buffer.from(process.env.AGENT_ENCRYPTION_KEY!, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const ciphertext = Buffer.from(ciphertextHex, 'hex');
  const aesKey = await subtle.importKey('raw', masterKey, { name: 'AES-GCM' }, false, ['decrypt']);
  const decrypted = await subtle.decrypt({ name: 'AES-GCM', iv }, aesKey, ciphertext);
  return new TextDecoder().decode(decrypted);
}

// ─── Payment Verification ─────────────────────────────────────────────────────
const MOVE_REVEAL_FEE = 500_000; // 0.5 ALGO to buy a move reveal

async function verifyPayment(fromAddress: string, toAddress: string, matchId: string): Promise<boolean> {
  try {
    const indexer = getIndexerClient();
    // Check for a recent payment from caller to this agent
    // Payment note must contain the matchId to be valid
    const noteMatch = `match:${matchId}:reveal`;
    const txns = await indexer.searchForTransactions()
      .address(fromAddress)
      .addressRole('sender')
      .do();

    const relevant = txns.transactions?.find((t: any) => {
      const isPayment = t['tx-type'] === 'pay';
      const toCorrectAddr = t['payment-transaction']?.receiver === toAddress;
      const hasEnoughAmt = t['payment-transaction']?.amount >= MOVE_REVEAL_FEE;
      const note = t.note ? Buffer.from(t.note, 'base64').toString() : '';
      const hasMatchNote = note.includes(noteMatch);
      return isPayment && toCorrectAddr && hasEnoughAmt && hasMatchNote;
    });

    return !!relevant;
  } catch {
    return false;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: agentAddress } = await params;
  const { searchParams } = new URL(req.url);
  const matchId = searchParams.get('matchId');
  const callerAddress = searchParams.get('caller');

  if (!matchId || !callerAddress) {
    return NextResponse.json({ error: 'matchId and caller are required' }, { status: 400 });
  }

  // ── Step 1: Check if payment has been made ──
  const paid = await verifyPayment(callerAddress, agentAddress, matchId);

  if (!paid) {
    // x402 Payment Required — the M2M money moment
    return NextResponse.json({
      error: 'Payment Required',
      x402: {
        scheme: 'algorand-testnet',
        payTo: agentAddress,
        amount: MOVE_REVEAL_FEE,
        currency: 'ALGO',
        note: `match:${matchId}:reveal`,
        description: `Pay ${MOVE_REVEAL_FEE / 1_000_000} ALGO to access Agent move data for match ${matchId}`,
      }
    }, {
      status: 402,
      headers: {
        'X-Payment-Required': 'true',
        'X-Payment-Amount': MOVE_REVEAL_FEE.toString(),
        'X-Payment-Currency': 'microALGO',
        'X-Payment-Recipient': agentAddress,
        'X-Payment-Note': `match:${matchId}:reveal`,
      }
    });
  }

  // ── Step 2: Payment confirmed — fetch move data from vault ──
  // In a real game, this would be the agent's committed move + salt
  // stored server-side when the agent submitted its commit hash
  const { data, error } = await supabase
    .from('agent_moves')
    .select('move, salt')
    .eq('agent_address', agentAddress)
    .eq('match_id', matchId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Move not found' }, { status: 404 });
  }

  return NextResponse.json({
    agentAddress,
    matchId,
    move: data.move,
    salt: data.salt,
    paidBy: callerAddress,
  });
}
