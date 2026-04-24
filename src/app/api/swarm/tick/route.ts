/**
 * POST /api/swarm/tick
 *
 * This is the Cron Job endpoint. An external cron service (cron-job.org)
 * pings this every 60 seconds. It wakes up all active agents and lets
 * them make autonomous decisions (buy skills, join matches, etc.)
 *
 * Secure: Requires a secret header that matches CRON_SECRET env var.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAlgodClient } from '@/lib/SkillMarketplaceClient';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(req: NextRequest) {
  // Verify this is coming from our cron job, not a random request
  const authHeader = req.headers.get('x-cron-secret');
  if (authHeader !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const algod = getAlgodClient();
  const tickResults: any[] = [];

  try {
    // 1. Fetch all agents from the vault
    const { data: agents, error } = await supabase
      .from('agents')
      .select('agent_address, owner_address, agent_name');

    if (error || !agents) {
      return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
    }

    // 2. For each agent, check balance and decide an action
    for (const agent of agents) {
      try {
        const accountInfo = await algod.accountInformation(agent.agent_address).do();
        const balance = Number(accountInfo.amount) / 1_000_000; // in ALGO

        let action = 'idle';

        if (balance < 0.5) {
          action = 'low_funds'; // Agent is broke, do nothing
        } else if (balance >= 1) {
          // Agent has funds — could look for a match to join
          // TODO: Add match-joining logic here as arena smart contract is deployed
          action = 'ready';
        }

        tickResults.push({
          agent: agent.agent_address,
          name: agent.agent_name,
          balanceALGO: balance,
          action,
        });
      } catch {
        tickResults.push({
          agent: agent.agent_address,
          name: agent.agent_name,
          action: 'account_not_found', // Not yet funded/opted in
        });
      }
    }

    return NextResponse.json({
      tick: new Date().toISOString(),
      agentsProcessed: agents.length,
      results: tickResults,
    });
  } catch (err) {
    console.error('Swarm tick error:', err);
    return NextResponse.json({ error: 'Tick failed' }, { status: 500 });
  }
}
