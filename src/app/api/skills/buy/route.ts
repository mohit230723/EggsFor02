/**
 * POST /api/skills/buy
 * Builds unsigned atomic txn group for buying a skill.
 */
import { NextRequest, NextResponse } from 'next/server';
import { makeBuySkillTxns } from '@/lib/SkillMarketplaceClient';
import algosdk from 'algosdk';

export async function POST(req: NextRequest) {
  try {
    const { sender, skillId, priceAlgo } = await req.json();

    if (!sender || !skillId) {
      return NextResponse.json({ error: 'sender and skillId required' }, { status: 400 });
    }

    const txns = await makeBuySkillTxns({ sender, skillId: Number(skillId), priceAlgo: Number(priceAlgo) });
    const encodedTxns = txns.map(txn =>
      Buffer.from(algosdk.encodeUnsignedTransaction(txn)).toString('base64')
    );

    return NextResponse.json({ txns: encodedTxns });
  } catch (err: unknown) {
    console.error('[/api/skills/buy]', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 });
  }
}
