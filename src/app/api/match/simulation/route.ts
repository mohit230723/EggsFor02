import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const matchId = searchParams.get('matchId');
    if (!matchId) {
      return NextResponse.json({ error: 'Missing matchId' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('match_simulations')
      .select('*')
      .eq('match_id', parseInt(matchId, 10))
      .single();

    if (error || !data) {
      return NextResponse.json({ simulation: null });
    }

    return NextResponse.json({ simulation: data });
  } catch (err: any) {
    console.error('Error fetching match simulation:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
