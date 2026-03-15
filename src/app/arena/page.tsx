import { SectionHeader } from "@/components/ui/SectionHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

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
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl text-amber font-heading tracking-widest">MATCH BOARD</h2>
            <div className="px-2 py-0.5 bg-charcoal border border-steel/30 rounded text-xs text-smoke font-mono">
              Network: Algorand Testnet
            </div>
          </div>
          
          <div className="space-y-4">
            {MOCK_MATCHES.map((match) => (
              <Card 
                key={match.id} 
                variant={match.status === "LIVE" ? "danger" : match.status === "BETTING_OPEN" ? "highlight" : "default"}
                className={`p-5 flex flex-col md:flex-row items-center justify-between gap-6 ${match.status === "WAITING" ? "opacity-70" : ""}`}
              >
                
                {/* Info Block */}
                <div className="w-full md:w-1/4 space-y-2 text-center md:text-left">
                  <Badge 
                    label={match.status} 
                    color={match.status === "LIVE" ? "red" : match.status === "BETTING_OPEN" ? "amber" : "gray"} 
                  />
                  <p className="text-smoke text-sm font-mono truncate">{match.game}</p>
                  <p className="text-steel text-xs font-mono">Pool: {match.pool}</p>
                </div>

                {/* Matchup Block */}
                <div className="w-full md:w-2/4 flex items-center justify-center gap-4">
                  <div className="text-right w-2/5 truncate font-bold text-bone">{match.p1}</div>
                  <div className={`w-1/5 text-center font-heading text-xl ${match.status === "LIVE" ? "text-bloodRed animate-pulse" : "text-steel"}`}>VS</div>
                  <div className={`text-left w-2/5 truncate font-bold ${match.p2 === "OPEN SLOT" ? "text-smoke italic font-normal" : "text-bone"}`}>
                    {match.p2}
                  </div>
                </div>

                {/* Action Block */}
                <div className="w-full md:w-1/4 flex justify-center md:justify-end">
                  {match.status === "LIVE" && <Button variant="secondary" size="sm">Spectate</Button>}
                  {match.status === "BETTING_OPEN" && <Button variant="primary" size="sm" href="/predictions">Place Bet</Button>}
                  {match.status === "WAITING" && <Button variant="ghost" size="sm">Join specific</Button>}
                </div>
              </Card>
            ))}
          </div>

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <h2 className="text-3xl text-bone font-heading tracking-widest">LEADERBOARD</h2>
          
          <Card className="overflow-hidden">
            <div className="bg-nearBlack/50 p-3 border-b border-steel/20 flex justify-between text-xs text-smoke font-heading tracking-widest">
              <span>AGENT</span>
              <div className="flex gap-4">
                <span>WIN</span>
                <span>ELO</span>
              </div>
            </div>
            
            <div className="divide-y divide-steel/10">
              {MOCK_LEADERBOARD.map((bot) => (
                <div key={bot.rank} className="p-4 flex items-center justify-between hover:bg-nearBlack/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`font-heading text-lg ${bot.rank === 1 ? 'text-amber' : bot.rank === 2 ? 'text-bone' : bot.rank === 3 ? 'text-rust' : 'text-smoke'}`}>
                      #{bot.rank}
                    </span>
                    <span className="font-body text-sm font-bold text-bone">{bot.name}</span>
                  </div>
                  <div className="flex gap-4 font-mono text-xs">
                    <span className="text-green-400 w-8">{bot.winRate}</span>
                    <span className="text-amber w-10 text-right">{bot.elo}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-3 bg-nearBlack/50 border-t border-steel/20 text-center">
              <span className="text-smoke text-xs hover:text-amber cursor-pointer transition-colors">View Full Rankings →</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
