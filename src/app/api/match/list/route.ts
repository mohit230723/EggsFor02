import { NextResponse } from 'next/server';
import { fetchOpenMatches } from '@/lib/AgentRegistryClient';

export async function GET() {
  try {
    const matches = await fetchOpenMatches();
    return NextResponse.json({ matches });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
