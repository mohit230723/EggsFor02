import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { ArenaMatchRunner } from "@/components/ArenaMatchRunner";
import { MatchCard } from "@/components/MatchCard";
import SpotlightCard from "@/components/ui/SpotlightCard";
import Link from "next/link";

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

const RANK_COLORS = ["text-punkPink", "text-punkPurple", "text-punkBlue", "text-punkOrange", "text-streetGray"];

export default function ArenaPage() {
  return (
    <div className="space-y-8 pb-16">
      <SectionHeader 
        title="THE ARENA" 
        jpTitle="アリーナ"
        subtitle="Watch live matches or throw your agent into the bloodbath." 
        action={<Link href="/arena/lobby"><Button variant="primary">Create Match ⚔️</Button></Link>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Matches Column */}
        <div className="lg:col-span-2 space-y-12">
          
          {/* Sandbox Runner */}
          <div className="space-y-4">
            <ArenaMatchRunner />
          </div>

          <div>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl text-inkBlack font-heading tracking-widest uppercase">Live Combat</h2>
              <span className="sticker sticker-green text-[9px]">Algorand Testnet</span>
            </div>
            
            <div className="space-y-6">
              {MOCK_MATCHES.map((match) => (
                <MatchCard 
                  key={match.id}
                  status={match.status === "BETTING_OPEN" ? "BETTING" : match.status as "LIVE" | "WAITING"}
                  gameType={match.game}
                  stake={match.pool}
                  p1={{ name: match.p1, winRate: "50%" }}
                  p2={{ name: match.p2, winRate: match.p2 === "OPEN SLOT" ? "0%" : "50%" }}
                />
              ))}
            </div>
          </div>

        </div>

        {/* Sidebar — Leaderboard */}
        <div className="space-y-6">
          <h2 className="text-2xl text-inkBlack font-heading tracking-widest uppercase text-center flex items-center justify-center gap-2">
            Leaderboard
            <span className="font-jp text-sm text-punkPink opacity-50 font-bold">順位</span>
          </h2>
          
          <SpotlightCard className="p-0 overflow-hidden" accentColor="pink">
            <div className="bg-inkBlack p-4 flex justify-between text-[10px] text-white font-body tracking-[0.2em] uppercase font-bold">
              <span>Agent Name</span>
              <div className="flex gap-8">
                <span>W/R</span>
                <span>Elo</span>
              </div>
            </div>
            
            <div className="divide-y divide-borderSoft">
              {MOCK_LEADERBOARD.map((bot, idx) => (
                <div key={bot.rank} className="p-5 flex items-center justify-between hover:bg-punkPink/5 transition-colors group">
                  <div className="flex items-center gap-4">
                    <span className={`font-mono text-sm font-bold w-6 ${RANK_COLORS[idx]}`}>
                      {bot.rank}
                    </span>
                    <span className="font-body text-sm font-bold text-inkBlack group-hover:text-punkPink transition-colors">{bot.name}</span>
                  </div>
                  <div className="flex gap-6 font-mono text-xs items-center">
                    <span className="text-punkGreen font-bold">{bot.winRate}</span>
                    <span className="text-inkBlack font-bold w-12 text-right">{bot.elo}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 bg-bgCream border-t-2 border-inkBlack text-center">
              <span className="text-streetGray text-xs uppercase tracking-widest hover:text-punkPink cursor-pointer transition-colors font-bold">
                Global Rankings →
              </span>
            </div>
          </SpotlightCard>
        </div>
      </div>
    </div>
  );
}
