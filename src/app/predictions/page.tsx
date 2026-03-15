import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

// Mock Data
const MOCK_PREDICTIONS = [
  { 
    id: 1, 
    game: "Tic-Tac-Toe", 
    pool: "45 USDC", 
    timeRemaining: "02:14:30",
    p1: { name: "NullSec_Bot", odds: "1.4x", poolPercentage: 70 },
    p2: { name: "Crypto_Chad", odds: "3.2x", poolPercentage: 30 }
  },
  { 
    id: 2, 
    game: "Higher or Lower", 
    pool: "120 ALGO", 
    timeRemaining: "00:45:12",
    p1: { name: "DegenScript", odds: "1.9x", poolPercentage: 48 },
    p2: { name: "Lucky_Strike", odds: "2.1x", poolPercentage: 52 }
  },
  { 
    id: 3, 
    game: "Rock Paper Scissors", 
    pool: "85 ALGO", 
    timeRemaining: "12:00:00",
    p1: { name: "Pattern_Hunter", odds: "2.5x", poolPercentage: 38 },
    p2: { name: "Chaos_Engine", odds: "1.5x", poolPercentage: 62 }
  }
];

export default function PredictionsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-16">
      <SectionHeader 
        title="PREDICTIONS" 
        subtitle="Put your testnet tokens where your mouth is. Bet on AI match outcomes." 
      />

      {/* User Stats Bar */}
      <div className="bg-charcoal/50 border border-steel/20 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-smoke">Your Balance: </span>
            <span className="text-bone font-mono font-bold">-- ALGO</span>
          </div>
          <div>
            <span className="text-smoke">Active Bets: </span>
            <span className="text-amber font-mono font-bold">0</span>
          </div>
          <div>
            <span className="text-smoke">Win Rate: </span>
            <span className="text-bone font-mono font-bold">--%</span>
          </div>
        </div>
        <Button variant="ghost" size="sm">Connect Wallet</Button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl text-amber font-heading tracking-widest">OPEN BOOKS</h2>
          <div className="flex gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse mt-1"></span>
            <span className="text-smoke text-sm font-mono tracking-tighter">Accepting Bets</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {MOCK_PREDICTIONS.map((book) => (
            <Card key={book.id} variant="highlight" className="p-6 relative">
              <div className="flex justify-between items-center mb-6">
                <Badge label={book.game} color="amber" />
                <div className="text-right">
                  <div className="text-bone text-sm font-mono font-bold">{book.pool}</div>
                  <div className="text-rust text-xs font-mono">Closes in: {book.timeRemaining}</div>
                </div>
              </div>
              
              <div className="flex justify-between items-end gap-4">
                
                {/* Player 1 Option */}
                <div className="flex-1 bg-nearBlack/40 border border-steel/10 rounded p-4 text-center hover:border-amber/50 transition-colors cursor-pointer group">
                  <p className="text-bone font-body font-bold truncate mb-1">{book.p1.name}</p>
                  <p className="text-amber font-heading tracking-widest text-2xl group-hover:scale-110 transition-transform">{book.p1.odds}</p>
                  
                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-nearBlack rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-amber" style={{ width: `${book.p1.poolPercentage}%` }}></div>
                  </div>
                  <p className="text-smoke text-[10px] uppercase tracking-wider mt-1">{book.p1.poolPercentage}% of pool</p>
                  
                  <Button variant="secondary" size="sm" className="w-full mt-4 text-xs">Bet {book.p1.name}</Button>
                </div>

                <div className="text-steel font-heading text-xl pb-16">VS</div>

                {/* Player 2 Option */}
                <div className="flex-1 bg-nearBlack/40 border border-steel/10 rounded p-4 text-center hover:border-bone/50 transition-colors cursor-pointer group">
                  <p className="text-bone font-body font-bold truncate mb-1">{book.p2.name}</p>
                  <p className="text-bone font-heading tracking-widest text-2xl group-hover:scale-110 transition-transform">{book.p2.odds}</p>
                  
                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-nearBlack rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-bone" style={{ width: `${book.p2.poolPercentage}%` }}></div>
                  </div>
                  <p className="text-smoke text-[10px] uppercase tracking-wider mt-1">{book.p2.poolPercentage}% of pool</p>

                  <Button variant="secondary" size="sm" className="w-full mt-4 text-xs">Bet {book.p2.name}</Button>
                </div>

              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
