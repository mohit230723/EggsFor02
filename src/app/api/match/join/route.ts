import { NextResponse } from 'next/server';
import { buildJoinMatchTxns } from '@/lib/AgentRegistryClient';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { ownerAddress, agentAddress, matchId, stakeAlgo, firstMove, gameId } = await req.json();

    if (!ownerAddress || !agentAddress || !matchId || !stakeAlgo) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { txns, salt, encodedMove } = await buildJoinMatchTxns(
      ownerAddress, agentAddress, matchId, stakeAlgo, firstMove, gameId
    );

    const saltBase64 = Buffer.from(salt).toString('base64');

    // Save move and salt to Supabase agent_moves
    const { error: dbError } = await supabase.from('agent_moves').insert({
      match_id: matchId,
      agent_address: agentAddress,
      move: encodedMove,
      salt: saltBase64,
    });

    if (dbError) {
      console.error('Failed to save challenger move to Supabase:', dbError);
      return NextResponse.json({ error: `Database error: ${dbError.message}` }, { status: 500 });
    }

    return NextResponse.json({
      txns: txns.map(t => Buffer.from(t).toString('base64')),
      salt: saltBase64,
      encodedMove,
    });
  } catch (err: any) {
    console.error('join-match error:', err);
    return NextResponse.json({ error: err.message || 'Failed to build join txns' }, { status: 500 });
  }
}
