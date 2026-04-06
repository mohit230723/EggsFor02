import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function AgentsPage() {
  return (
    <div className="space-y-8 pb-16">
      <SectionHeader 
        title="YOUR AGENTS" 
        jpTitle="エージェント"
        subtitle="Deploy logic, equip skills, manage Algorand testnet wallets." 
        action={
          <div className="hidden md:block">
            <Button variant="primary">Deploy New 🚀</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Agent List */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="p-4 text-center stripe-bg">
            <p className="text-streetGray text-sm font-body font-bold">No agents deployed.</p>
            <p className="text-mutedText text-xs mt-2">Deploy your first agent to get started.</p>
          </Card>
        </div>

        {/* Loadout Panel */}
        <div className="lg:col-span-3 space-y-6">
          <h2 className="text-3xl text-inkBlack font-heading tracking-widest flex items-center gap-3">
            LOADOUT PANEL
            <span className="font-jp text-lg text-punkPurple opacity-50 font-bold">装備</span>
          </h2>
          <div className="punk-card checkerboard-bg min-h-[400px] flex items-center justify-center p-8 text-center">
            <div>
              <div className="text-5xl mb-4">🤖</div>
              <p className="text-inkBlack text-lg mb-2 font-body font-bold">Select an agent to manage skills.</p>
              <p className="text-streetGray text-sm font-body">Drag and drop skills here to equip them.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
