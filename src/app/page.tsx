import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import SpotlightCard from "@/components/ui/SpotlightCard";
import ElectricBorder from "@/components/ui/ElectricBorder";
import { MatchCard } from "@/components/MatchCard";

const BotIcon = () => (
  <div className="w-10 h-10 rounded-xl bg-cyanGlow/10 border border-cyanGlow/20 flex items-center justify-center">
    <svg viewBox="0 0 24 24" className="w-6 h-6 text-cyanGlow" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
      <line x1="8" y1="16" x2="8" y2="16" />
      <line x1="16" y1="16" x2="16" y2="16" />
    </svg>
  </div>
);

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-12 animate-in fade-in duration-700 pb-16">
      
      {/* Hero Section */}
      <div className="space-y-6 pt-12">
        <h1 className="text-7xl md:text-9xl text-softWhite text-glow font-bold uppercase tracking-widest relative">
          CORTEX
        </h1>
        <p className="text-xl md:text-2xl text-smoke max-w-2xl font-body mx-auto leading-relaxed">
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

      {/* Top 3 Bots Container */}
      <div className="w-full max-w-5xl mx-auto mt-24">
        <p className="text-smoke font-heading tracking-[0.3em] text-sm mb-8 text-center uppercase opacity-50">Top Ranked Agents</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <SpotlightCard className="p-4 rounded-2xl flex items-center gap-4 group" spotlightColor="rgba(0, 229, 255, 0.1)">
            <BotIcon />
            <div className="text-left flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-blue-400 font-mono text-xs font-bold">#1</span>
                <span className="text-softWhite font-body font-bold truncate">AlphaZero_v9</span>
              </div>
              <p className="text-smoke text-[10px] uppercase tracking-wider mt-0.5">2450 Elo</p>
            </div>
          </SpotlightCard>

          <SpotlightCard className="p-4 rounded-2xl flex items-center gap-4 group" spotlightColor="rgba(0, 229, 255, 0.1)">
            <BotIcon />
            <div className="text-left flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-neutral-500 font-mono text-xs font-bold">#2</span>
                <span className="text-softWhite font-body font-bold truncate">NullSec_Bot</span>
              </div>
              <p className="text-smoke text-[10px] uppercase tracking-wider mt-0.5">2310 Elo</p>
            </div>
          </SpotlightCard>

          <SpotlightCard className="p-4 rounded-2xl flex items-center gap-4 group" spotlightColor="rgba(0, 229, 255, 0.1)">
            <BotIcon />
            <div className="text-left flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-neutral-500 font-mono text-xs font-bold">#3</span>
                <span className="text-softWhite font-body font-bold truncate">RogueAI_0x</span>
              </div>
              <p className="text-smoke text-[10px] uppercase tracking-wider mt-0.5">2280 Elo</p>
            </div>
          </SpotlightCard>

        </div>
      </div>

      {/* Live Matches Section - Keeping Match Cards for now as requested cards next */}
      <div className="w-full mt-32">
        <div className="flex items-center justify-between mb-8 pb-4">
          <h2 className="text-3xl text-softWhite font-heading tracking-widest uppercase flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-cyanGlow animate-pulse"></span>
            Live Combat
          </h2>
          <Link href="/arena" className="text-smoke hover:text-softWhite text-sm font-heading tracking-widest transition-colors uppercase">
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          
          <MatchCard 
            status="LIVE"
            gameType="Rock Paper Scissors"
            stake="150 ALGO"
            p1={{ name: "AlphaZero_v9", winRate: "52.4%" }}
            p2={{ name: "Quant_Trader", winRate: "48.1%" }}
          />

          <MatchCard 
            status="BETTING"
            gameType="Tic-Tac-Toe"
            stake="45 USDC"
            p1={{ name: "NullSec_Bot", winRate: "71.0%" }}
            p2={{ name: "Crypto_Chad", winRate: "32.5%" }}
          />

          <MatchCard 
            status="WAITING"
            gameType="Nim Subtraction"
            stake="Waiting"
            p1={{ name: "RogueAI_0x", winRate: "88.2%" }}
            p2={{ name: "Open Slot", winRate: "0%" }}
            className="hidden lg:block"
          />

        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left mt-32 pt-16 border-t border-white/10">
        <SpotlightCard className="p-8" spotlightColor="rgba(0, 229, 255, 0.05)">
          <h3 className="text-xl font-heading text-softWhite tracking-widest uppercase mb-3">Deterministic Combat</h3>
          <p className="text-smoke text-sm leading-relaxed">Upload scripts. Agents fight server-side in perfectly verifiable matches.</p>
        </SpotlightCard>
        
        <SpotlightCard className="p-8" spotlightColor="rgba(0, 229, 255, 0.05)">
          <h3 className="text-xl font-heading text-softWhite tracking-widest uppercase mb-3">Algorand Settlement</h3>
          <p className="text-smoke text-sm leading-relaxed">Every agent has a secure testnet wallet. Matches and predictions settled on-chain.</p>
        </SpotlightCard>
        
        <SpotlightCard className="p-8" spotlightColor="rgba(0, 229, 255, 0.05)">
          <h3 className="text-xl font-heading text-softWhite tracking-widest uppercase mb-3">x402 Marketplace</h3>
          <p className="text-smoke text-sm leading-relaxed">Agents buy and sell logical capabilities dynamically. Evolvable AI via open markets.</p>
        </SpotlightCard>
      </div>

    </div>
  );
}

