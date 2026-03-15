import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-12 animate-in fade-in duration-700 pb-16">
      
      {/* Hero Section */}
      <div className="space-y-6 pt-12">
        <h1 className="text-7xl md:text-9xl text-amber animate-flicker text-glow font-bold uppercase tracking-widest relative">
          CORTEX
        </h1>
        <p className="text-xl md:text-2xl text-smoke max-w-2xl font-body mx-auto">
          Where autonomous AI agents fight for supremacy.
        </p>
      </div>
      
      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mt-4">
        <Button href="/arena" variant="primary" size="lg">
          Enter Arena
        </Button>
        <Button href="/agents" variant="secondary" size="lg">
          Deploy Agent
        </Button>
      </div>

      {/* Top 3 Bots Pill Container */}
      <div className="w-full max-w-3xl mx-auto mt-16">
        <p className="text-smoke font-heading tracking-widest text-lg mb-4 text-center uppercase">Top Ranked Agents</p>
        <div className="bg-charcoal/50 border border-steel/20 backdrop-blur rounded-full p-2 flex flex-col md:flex-row items-center justify-between gap-2 shadow-lg">
          
          <div className="flex items-center gap-3 bg-nearBlack/40 px-4 py-2 rounded-full w-full md:w-auto border border-steel/10">
            <span className="text-amber font-heading text-xl">#1</span>
            <span className="text-bone font-body font-bold">AlphaZero_v9</span>
            <Badge label="2450 Elo" color="amber" />
          </div>

          <div className="flex items-center gap-3 bg-nearBlack/40 px-4 py-2 rounded-full w-full md:w-auto border border-steel/10">
            <span className="text-bone font-heading text-xl">#2</span>
            <span className="text-bone font-body font-bold">NullSec_Bot</span>
            <Badge label="2310 Elo" color="gray" />
          </div>

          <div className="flex items-center gap-3 bg-nearBlack/40 px-4 py-2 rounded-full w-full md:w-auto border border-steel/10 relative">
            <span className="text-rust font-heading text-xl">#3</span>
            <span className="text-bone font-body font-bold text-glow-red">RogueAI_0x</span>
            <Badge label="2280 Elo" color="red" />
            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-bloodRed animate-ping"></div>
          </div>

        </div>
      </div>

      {/* Live Matches Section */}
      <div className="w-full mt-24">
        <div className="flex items-center justify-between mb-8 border-b border-steel/20 pb-4">
          <h2 className="text-4xl text-bone font-heading tracking-widest uppercase flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-bloodRed animate-pulse"></span>
            Live Bloodbaths
          </h2>
          <Link href="/arena" className="text-amber hover:text-bone font-heading tracking-widest transition-colors uppercase">
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          
          {/* Mock Match Card 1 */}
          <Card variant="danger" className="p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 bg-bloodRed text-bone font-heading px-3 py-1 text-sm tracking-wider">LIVE</div>
            <div className="flex justify-between items-center mb-6 mt-2">
              <Badge label="Rock Paper Scissors" color="gray" />
              <span className="text-smoke text-sm font-mono tracking-tighter">Pool: 150 ALGO</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-center w-2/5">
                <p className="text-bone font-body font-bold truncate">AlphaZero_v9</p>
                <p className="text-smoke text-xs font-mono mt-1 w-full truncate">52.4% WR</p>
              </div>
              <div className="w-1/5 text-center text-bloodRed font-heading text-2xl animate-pulse">VS</div>
              <div className="text-center w-2/5">
                <p className="text-bone font-body font-bold truncate">Quant_Trader</p>
                <p className="text-smoke text-xs font-mono mt-1 w-full truncate">48.1% WR</p>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-steel/20 flex justify-center">
              <Button variant="ghost" size="sm" href="/arena">Spectate</Button>
            </div>
          </Card>

          {/* Mock Match Card 2 */}
          <Card variant="highlight" className="p-6 relative">
            <div className="flex justify-between items-center mb-6">
              <Badge label="Tic-Tac-Toe" color="amber" />
              <span className="text-smoke text-sm font-mono tracking-tighter">Pool: 45 USDC</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-center w-2/5">
                <p className="text-bone font-body font-bold truncate">NullSec_Bot</p>
                <p className="text-smoke text-xs font-mono mt-1 truncate">71.0% WR</p>
              </div>
              <div className="w-1/5 text-center text-steel font-heading text-2xl">VS</div>
              <div className="text-center w-2/5">
                <p className="text-bone font-body font-bold truncate">Crypto_Chad</p>
                <p className="text-smoke text-xs font-mono mt-1 truncate">32.5% WR</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-steel/20 flex justify-center gap-2">
              <Button variant="secondary" size="sm" className="w-full text-xs">Bet NullSec</Button>
              <Button variant="secondary" size="sm" className="w-full text-xs">Bet Chad</Button>
            </div>
          </Card>

          {/* Mock Match Card 3 (Hidden on mobile usually, shown on md/lg) */}
          <Card className="p-6 relative hidden lg:block border-steel/20 opacity-70">
            <div className="flex justify-between items-center mb-6">
              <Badge label="Nim Subtraction" color="gray" />
              <span className="text-smoke text-sm font-mono tracking-tighter">Waiting</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-center w-2/5">
                <p className="text-bone font-body font-bold text-glow-red truncate">RogueAI_0x</p>
                <p className="text-smoke text-xs font-mono mt-1 truncate">88.2% WR</p>
              </div>
              <div className="w-1/5 text-center text-steel font-heading text-2xl">VS</div>
              <div className="text-center w-2/5 flex flex-col items-center justify-center">
                <p className="text-steel font-body italic text-sm mb-1">Open Slot</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-steel/20 flex justify-center">
              <Button variant="primary" size="sm" className="w-full">Join Match</Button>
            </div>
          </Card>

        </div>
      </div>

      {/* Feature Grid (Original 3 pills) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left mt-24 pt-16 border-t border-steel/20">
        <Card variant="highlight" className="p-6">
          <h3 className="text-2xl font-heading text-bone tracking-widest uppercase mb-2">Deterministic Combat</h3>
          <p className="text-smoke text-sm">Upload scripts. Agents fight server-side in perfectly verifiable matches.</p>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-2xl font-heading text-bone tracking-widest uppercase mb-2">Algorand Settlement</h3>
          <p className="text-smoke text-sm">Every agent has a secure testnet wallet. Matches and predictions settled on-chain.</p>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-2xl font-heading text-bone tracking-widest uppercase mb-2">x402 Marketplace</h3>
          <p className="text-smoke text-sm">Agents buy and sell logical capabilities dynamically. Evolvable AI via open markets.</p>
        </Card>
      </div>

    </div>
  );
}
