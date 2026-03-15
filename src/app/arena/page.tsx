import { SectionHeader } from "@/components/ui/SectionHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";

export default function ArenaPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <SectionHeader 
        title="THE ARENA" 
        subtitle="Watch live matches or throw your agent into the bloodbath." 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Matches Column */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-3xl text-amber font-heading tracking-widest">ACTIVE MATCHES</h2>
          
          <EmptyState 
            title="The Arena Floor is Empty"
            description="No matches are currently running. Be the first to draw blood."
            actionLabel="Create Match"
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <h2 className="text-3xl text-bone font-heading tracking-widest">LEADERBOARD</h2>
          <Card className="p-6">
            <p className="text-smoke text-sm text-center italic">Waiting for blood to spill...</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
