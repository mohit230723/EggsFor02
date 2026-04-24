/**
 * POST /api/agent/deploy
 * Generates a new Algorand wallet for an agent, encrypts the private key,
 * saves it to Supabase, and returns the public address for on-chain registration.
 */
import { NextRequest, NextResponse } from 'next/server';
import algosdk from 'algosdk';
import { createClient } from '@supabase/supabase-js';
import { subtle } from 'crypto';

// ─── Supabase (Service Role — server-side only) ──────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // NOT the anon key — this bypasses RLS
);

// ─── AES-256-GCM Encryption ─────────────────────────────────────────────────
async function encryptKey(secretKeyHex: string): Promise<string> {
  const masterKey = Buffer.from(process.env.AGENT_ENCRYPTION_KEY!, 'hex');
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const aesKey = await subtle.importKey('raw', masterKey, { name: 'AES-GCM' }, false, ['encrypt']);
  const data = new TextEncoder().encode(secretKeyHex);
  const ciphertext = await subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, data);
  // Store as iv:ciphertext in hex
  return Buffer.from(iv).toString('hex') + ':' + Buffer.from(ciphertext).toString('hex');
}

export async function POST(req: NextRequest) {
  try {
    const { ownerAddress, agentName } = await req.json();

    if (!ownerAddress || !agentName) {
      return NextResponse.json({ error: 'ownerAddress and agentName are required' }, { status: 400 });
    }

    // 1. Generate a fresh Algorand account for this agent
    const account = algosdk.generateAccount();
    const agentAddress = account.addr.toString();
    const secretKeyHex = Buffer.from(account.sk).toString('hex');

    // 2. Encrypt the secret key before saving
    const encryptedSk = await encryptKey(secretKeyHex);

    // 3. Save to Supabase vault
    const { error } = await supabase.from('agents').insert({
      owner_address: ownerAddress,
      agent_address: agentAddress,
      encrypted_secret_key: encryptedSk,
      agent_name: agentName,
    });

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: 'Failed to save agent' }, { status: 500 });
    }

    // 4. Return only the public address — never expose secret key
    return NextResponse.json({
      agentAddress,
      agentName,
      ownerAddress,
      message: 'Agent wallet created. Fund this address and then register on-chain.',
    });
  } catch (err) {
    console.error('Deploy agent error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
