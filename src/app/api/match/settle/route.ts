import { NextResponse } from 'next/server';
import { buildSettleMatchTxn, submitSignedTxns, fetchOpenMatches } from '@/lib/AgentRegistryClient';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { callerAddress, matchId, signedTxns } = body;

    // If signedTxns provided, just submit them
    if (signedTxns) {
      const txns = signedTxns.map((s: string) => Buffer.from(s, 'base64'));
      const txId = await submitSignedTxns(txns);
      return NextResponse.json({ txId });
    }

    if (!callerAddress || matchId === undefined) {
      return NextResponse.json({ error: 'Missing callerAddress or matchId' }, { status: 400 });
    }

    // 1. Fetch match record from chain to resolve agentA and agentB addresses
    const matches = await fetchOpenMatches();
    const match = matches.find(m => m.matchId === matchId);
    if (!match) {
      return NextResponse.json({ error: `Match #${matchId} not found on-chain` }, { status: 404 });
    }

    const agentB = match.agentB;
    if (!agentB) {
      return NextResponse.json({ error: 'Match does not have a challenger agent' }, { status: 400 });
    }

    // 2. Fetch moves and salts from Supabase
    const { data: dbMoves, error: dbError } = await supabase
      .from('agent_moves')
      .select('*')
      .eq('match_id', matchId);

    if (dbError || !dbMoves || dbMoves.length === 0) {
      console.error('Supabase fetch moves error:', dbError);
      return NextResponse.json({ error: 'Moves/salts not found in database for this match' }, { status: 400 });
    }

    // 3. Match moves to P1 (agentA) and P2 (agentB)
    const moveAData = dbMoves.find(m => m.agent_address.toLowerCase() === match.agentA.toLowerCase());
    const moveBData = dbMoves.find(m => m.agent_address.toLowerCase() === agentB.toLowerCase());

    if (!moveAData || !moveBData) {
      return NextResponse.json({
        error: `Could not resolve moves for both participants. Found: ${dbMoves.map(m => m.agent_address).join(', ')}`
      }, { status: 400 });
    }

    const saltA = Buffer.from(moveAData.salt, 'base64');
    const saltB = Buffer.from(moveBData.salt, 'base64');

    // 4. Build the settle txn
    const txns = await buildSettleMatchTxn(
      callerAddress,
      matchId,
      moveAData.move,
      new Uint8Array(saltA),
      moveBData.move,
      new Uint8Array(saltB),
      match.agentA,
      agentB
    );

    return NextResponse.json({
      txns: txns.map(t => Buffer.from(t).toString('base64')),
    });
  } catch (err: any) {
    console.error('settle-match error:', err);
    return NextResponse.json({ error: err.message || 'Failed to settle' }, { status: 500 });
  }
}

