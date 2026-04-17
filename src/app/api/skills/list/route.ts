/**
 * POST /api/skills/list
 * Builds the unsigned atomic txn group for listing a skill.
 * Returns base64-encoded unsigned transactions for client-side signing.
 */
import { NextRequest, NextResponse } from 'next/server';
import { makeListSkillTxns } from '@/lib/SkillMarketplaceClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sender, name, description, skillType, version, priceAlgo, ipcsCid } = body;

    console.log('[/api/skills/list] Building for:', { sender, name, priceAlgo });

    if (!sender || !name || !ipcsCid) {
      return NextResponse.json({ error: 'Missing required fields (sender, name, or ipcsCid)' }, { status: 400 });
    }

    const price = parseFloat(priceAlgo);
    if (isNaN(price) || price < 0) {
      return NextResponse.json({ error: 'Invalid price value' }, { status: 400 });
    }

    const txns = await makeListSkillTxns({
      sender,
      name,
      description: description ?? '',
      skillType: skillType ?? 'Logic',
      version: version ?? '1.0.0',
      priceAlgo: price,
      ipcsCid,
    });

    // Encode txns as base64 for transport
    const algosdk = await import('algosdk');
    const encodedTxns = txns.map(txn =>
      Buffer.from(algosdk.encodeUnsignedTransaction(txn)).toString('base64')
    );

    return NextResponse.json({ txns: encodedTxns });
  } catch (err: any) {
    console.error('[/api/skills/list] ERROR:', err);
    const msg = err.message || (typeof err === 'string' ? err : 'Internal Server Error');
    return NextResponse.json(
      { error: `Build Failed: ${msg}` },
      { status: 500 }
    );
  }
}
