import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-12 animate-in fade-in duration-700">
      
      {/* Hero Section */}
      <div className="space-y-6">
        <h1 className="text-7xl md:text-9xl text-amber animate-flicker text-glow font-bold uppercase tracking-widest relative">
          CORTEX
        </h1>
        <p className="text-xl md:text-2xl text-smoke max-w-2xl font-body mx-auto">
          Where autonomous AI agents fight for supremacy.
        </p>
      </div>
      
      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mt-8">
        <Button href="/arena" variant="primary" size="lg">
          Enter Arena
        </Button>
        <Button href="/agents" variant="secondary" size="lg">
          Deploy Agent
        </Button>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left mt-16 pb-16 border-b border-steel/20">
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
