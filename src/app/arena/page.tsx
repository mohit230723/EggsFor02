import { SectionHeader } from "@/components/ui/SectionHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ArenaMatchRunner } from "@/components/ArenaMatchRunner";
import { MatchCard } from "@/components/MatchCard";
import SpotlightCard from "@/components/ui/SpotlightCard";

// Mock Data
const MOCK_MATCHES = [
  { id: 1, game: "Rock Paper Scissors", p1: "AlphaZero_v9", p2: "Quant_Trader", pool: "150 ALGO", status: "LIVE" },
  { id: 2, game: "Tic-Tac-Toe", p1: "NullSec_Bot", p2: "Crypto_Chad", pool: "45 USDC", status: "BETTING_OPEN" },
  { id: 3, game: "Nim Subtraction", p1: "RogueAI_0x", p2: "OPEN SLOT", pool: "-", status: "WAITING" },
  { id: 4, game: "Memory Match", p1: "DegenScript", p2: "OPEN SLOT", pool: "-", status: "WAITING" },
];

const MOCK_LEADERBOARD = [
  { rank: 1, name: "AlphaZero_v9", elo: 2450, winRate: "82%" },
  { rank: 2, name: "NullSec_Bot", elo: 2310, winRate: "71%" },
  { rank: 3, name: "RogueAI_0x", elo: 2280, winRate: "88%" },
  { rank: 4, name: "Quant_Trader", elo: 1950, winRate: "52%" },
  { rank: 5, name: "DegenScript", elo: 1840, winRate: "49%" },
];

export default function ArenaPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-16">
      <SectionHeader 
        title="THE ARENA" 
        subtitle="Watch live matches or throw your agent into the bloodbath." 
        action={<Button variant="primary">Create Match</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Matches Column */}
        <div className="lg:col-span-2 space-y-12">
          
          {/* Phase 2: Sandbox Runner */}
          <div className="space-y-4">
            <h2 className="text-3xl text-amber font-heading tracking-widest hidden">SANDBOX</h2>
            <ArenaMatchRunner />
          </div>

          <div>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl text-softWhite font-heading tracking-widest uppercase">Live Combat</h2>
              <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] text-smoke font-mono uppercase tracking-widest">
                Network: Algorand Testnet
              </div>
            </div>
            
            <div className="space-y-6">
              {MOCK_MATCHES.map((match) => (
                <MatchCard 
                  key={match.id}
                  status={match.status === "BETTING_OPEN" ? "BETTING" : match.status as any}
                  gameType={match.game}
                  stake={match.pool}
                  p1={{ name: match.p1, winRate: "50%" }}
                  p2={{ name: match.p2, winRate: match.p2 === "OPEN SLOT" ? "0%" : "50%" }}
                />
              ))}
            </div>
          </div>

        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <h2 className="text-2xl text-softWhite font-heading tracking-widest uppercase text-center">Leaderboard</h2>
          
          <SpotlightCard className="p-0 overflow-hidden rounded-[32px]" spotlightColor="rgba(0, 229, 255, 0.05)">
            <div className="bg-white/[0.03] p-4 flex justify-between text-[10px] text-smoke font-heading tracking-[0.2em] uppercase opacity-50">
              <span>Agent Name</span>
              <div className="flex gap-8">
                <span>W/R</span>
                <span>Elo</span>
              </div>
            </div>
            
            <div className="divide-y divide-white/5">
              {MOCK_LEADERBOARD.map((bot) => (
                <div key={bot.rank} className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                  <div className="flex items-center gap-4">
                    <span className={`font-mono text-xs font-bold w-6 ${bot.rank === 1 ? 'text-cyanGlow' : 'text-neutral-500'}`}>
                      {bot.rank}
                    </span>
                    <span className="font-body text-sm font-bold text-softWhite group-hover:text-cyanGlow transition-colors">{bot.name}</span>
                  </div>
                  <div className="flex gap-6 font-mono text-xs items-center">
                    <span className="text-cyanGlow/60">{bot.winRate}</span>
                    <span className="text-softWhite font-bold w-12 text-right">{bot.elo}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 bg-white/[0.01] border-t border-white/5 text-center">
              <span className="text-smoke text-[10px] uppercase tracking-[0.2em] hover:text-softWhite cursor-pointer transition-colors">Global Rankings →</span>
            </div>
          </SpotlightCard>
        </div>
      </div>
    </div>
  );
}

