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
    <div className="space-y-8 pb-16">
      <SectionHeader 
        title="PREDICTIONS" 
        jpTitle="予測"
        subtitle="Put your testnet tokens where your mouth is. Bet on AI match outcomes." 
      />

      {/* User Stats Bar */}
      <div className="punk-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex gap-6 text-sm font-body">
          <div>
            <span className="text-streetGray">Your Balance: </span>
            <span className="text-inkBlack font-mono font-bold">-- ALGO</span>
          </div>
          <div>
            <span className="text-streetGray">Active Bets: </span>
            <span className="text-punkPurple font-mono font-bold">0</span>
          </div>
          <div>
            <span className="text-streetGray">Win Rate: </span>
            <span className="text-inkBlack font-mono font-bold">--%</span>
          </div>
        </div>
        <Button variant="ghost" size="sm">Connect Wallet</Button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl text-inkBlack font-heading tracking-widest uppercase flex items-center gap-3">
            Open Books
            <span className="font-jp text-lg text-punkPink opacity-50 font-bold">賭け</span>
          </h2>
          <div className="flex gap-2 items-center">
            <span className="w-3 h-3 rounded-full bg-punkGreen animate-pulse" />
            <span className="text-streetGray text-sm font-mono font-bold">Accepting Bets</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {MOCK_PREDICTIONS.map((book) => (
            <Card key={book.id} variant="highlight" className="p-6 relative">
              <div className="flex justify-between items-center mb-6">
                <Badge label={book.game} color="purple" />
                <div className="text-right">
                  <div className="text-inkBlack text-sm font-mono font-bold">{book.pool}</div>
                  <div className="text-punkRed text-xs font-mono font-bold">Closes in: {book.timeRemaining}</div>
                </div>
              </div>
              
              <div className="flex justify-between items-end gap-4">
                
                {/* Player 1 */}
                <div className="flex-1 punk-card punk-card-pink p-4 text-center group cursor-pointer">
                  <p className="text-inkBlack font-body font-bold truncate mb-1">{book.p1.name}</p>
                  <p className="text-punkPink font-heading tracking-widest text-2xl group-hover:scale-110 transition-transform">{book.p1.odds}</p>
                  
                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-borderSoft rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-punkPink rounded-full" style={{ width: `${book.p1.poolPercentage}%` }} />
                  </div>
                  <p className="text-streetGray text-[10px] uppercase tracking-wider mt-1 font-bold">{book.p1.poolPercentage}% of pool</p>
                  
                  <Button variant="primary" size="sm" className="w-full mt-4 text-xs">Bet {book.p1.name}</Button>
                </div>

                <div className="text-inkBlack font-heading text-xl pb-16">VS</div>

                {/* Player 2 */}
                <div className="flex-1 punk-card punk-card-purple p-4 text-center group cursor-pointer">
                  <p className="text-inkBlack font-body font-bold truncate mb-1">{book.p2.name}</p>
                  <p className="text-punkPurple font-heading tracking-widest text-2xl group-hover:scale-110 transition-transform">{book.p2.odds}</p>
                  
                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-borderSoft rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-punkPurple rounded-full" style={{ width: `${book.p2.poolPercentage}%` }} />
                  </div>
                  <p className="text-streetGray text-[10px] uppercase tracking-wider mt-1 font-bold">{book.p2.poolPercentage}% of pool</p>

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
