/**
 * x402 Content Gate: /api/skills/[id]/content
 *
 * Flow:
 * 1. Request arrives with Algorand address in Authorization header
 * 2. We check on-chain: has this address purchased skill [id]?
 * 3. If yes → fetch from IPFS, decrypt, return source
 * 4. If no  → 402 Payment Required with metadata
 */
import { NextRequest, NextResponse } from 'next/server';
import { checkAccess, fetchAllSkills } from '@/lib/SkillMarketplaceClient';
import { decryptSkillCode } from '@/lib/encryption';
import { fetchSkillFromIPFS } from '@/lib/ipfs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const skillId = parseInt(id);
  if (isNaN(skillId) || skillId < 1) {
    return NextResponse.json({ error: 'Invalid skill ID' }, { status: 400 });
  }

  // Extract buyer address from Authorization header
  // Format: "Bearer ALGORAND_ADDRESS"
  const auth = req.headers.get('Authorization') ?? '';
  const buyer = auth.replace(/^Bearer\s+/i, '').trim();

  if (!buyer) {
    return NextResponse.json(
      {
        error: 'Authorization required',
        x402: true,
        paymentInfo: {
          description: `Purchase access to Skill #${skillId}`,
          paymentRoute: '/api/skills/pay',
          skillId,
        },
      },
      { status: 402 }
    );
  }

  // Check on-chain access
  const hasAccess = await checkAccess(skillId, buyer);

  if (!hasAccess) {
    // Get skill pricing info for the 402 response
    const skills = await fetchAllSkills();
    const skill = skills.find(s => s.id === skillId);
    const priceAlgo = skill ? (skill.price / 1_000_000).toFixed(2) : 'unknown';

    return NextResponse.json(
      {
        error: 'Payment required to access this skill',
        x402: true,
        paymentInfo: {
          skillId,
          skillName: skill?.name ?? `Skill #${skillId}`,
          priceAlgo,
          priceMicro: skill?.price ?? 0,
          seller: skill?.seller ?? '',
          purchaseEndpoint: '/api/skills/purchase',
        },
      },
      { status: 402 }
    );
  }

  // Access granted — fetch from IPFS and decrypt
  try {
    const skills = await fetchAllSkills();
    const skill = skills.find(s => s.id === skillId);

    if (!skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    const encryptedContent = await fetchSkillFromIPFS(skill.ipcsCid);
    const decryptedSource = await decryptSkillCode(encryptedContent);

    return NextResponse.json(
      {
        skillId,
        name: skill.name,
        type: skill.skillType,
        version: skill.version,
        source: decryptedSource,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
          'X-Content-Gated': 'true',
        },
      }
    );
  } catch (err) {
    console.error('[x402 Gate] Error fetching/decrypting skill:', err);
    return NextResponse.json({ error: 'Failed to retrieve skill content' }, { status: 500 });
  }
}
