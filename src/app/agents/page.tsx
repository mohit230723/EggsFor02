import { SectionHeader } from "@/components/ui/SectionHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function AgentsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <SectionHeader 
        title="YOUR AGENTS" 
        subtitle="Deploy logic, equip skills, manage Algorand testnet wallets." 
        action={
          <div className="hidden md:block">
            <Button variant="primary">Deploy New</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Agent List */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="p-4 text-center">
            <p className="text-smoke text-sm">No agents deployed.</p>
          </Card>
        </div>

        {/* Loadout Panel */}
        <div className="lg:col-span-3 space-y-6">
          <h2 className="text-3xl text-amber font-heading tracking-widest">LOADOUT PANEL</h2>
          <div className="bg-charcoal border-2 border-dashed border-steel/30 min-h-[400px] flex items-center justify-center p-8 text-center rounded-xl">
            <div>
              <p className="text-smoke text-lg mb-2">Select an agent to manage skills.</p>
              <p className="text-steel text-sm">Drag and drop skills here to equip them.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
