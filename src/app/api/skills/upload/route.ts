/**
 * POST /api/skills/upload
 * Encrypts skill source code and uploads to IPFS.
 * Returns the IPFS CID.
 */
import { NextRequest, NextResponse } from 'next/server';
import { encryptSkillCode } from '@/lib/encryption';
import { uploadSkillToIPFS } from '@/lib/ipfs';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { skillSource, metadata } = await req.json();

    if (!skillSource || typeof skillSource !== 'string') {
      return NextResponse.json({ error: 'skillSource is required' }, { status: 400 });
    }

    // Encrypt the source code
    const encrypted = await encryptSkillCode(skillSource);

    // Upload to IPFS
    const skillId = randomUUID();
    const cid = await uploadSkillToIPFS(skillId, encrypted, metadata);

    return NextResponse.json({ cid, skillId });
  } catch (err: unknown) {
    console.error('[/api/skills/upload]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
