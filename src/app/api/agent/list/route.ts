/**
 * GET /api/agent/list?owner=ADDRESS
 * Returns all agents belonging to the specified owner from the Supabase vault.
 * Enriches each agent with their live ALGO balance from Algod.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAlgodClient } from '@/lib/SkillMarketplaceClient';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const owner = searchParams.get('owner');

  if (!owner) {
    return NextResponse.json({ agents: [] }, { status: 400 });
  }

  try {
    // 1. Fetch agents from Supabase (no private keys returned)
    let query = supabase
      .from('agents')
      .select('agent_address, agent_name, owner_address, created_at, equipped_skill_1, equipped_skill_2, equipped_skill_3');
    
    if (owner !== 'all') {
      query = query.eq('owner_address', owner);
    }
    
    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase fetch error:', error);
      return NextResponse.json({ agents: [] }, { status: 500 });
    }

    // 2. Enrich with live ALGO balance from Algod
    const algod = getAlgodClient();
    const enriched = await Promise.all(
      (data ?? []).map(async (agent) => {
        let balance: number | undefined;
        try {
          const info = await algod.accountInformation(agent.agent_address).do();
          balance = Number(info.amount) / 1_000_000;
        } catch {
          balance = undefined; // Account not yet funded/found
        }
        return {
          agentAddress: agent.agent_address,
          agentName: agent.agent_name,
          ownerAddress: agent.owner_address,
          balance,
          equippedSkill1: agent.equipped_skill_1,
          equippedSkill2: agent.equipped_skill_2,
          equippedSkill3: agent.equipped_skill_3,
        };
      })
    );

    return NextResponse.json({ agents: enriched });
  } catch (err) {
    console.error('List agents error:', err);
    return NextResponse.json({ agents: [] }, { status: 500 });
  }
}

