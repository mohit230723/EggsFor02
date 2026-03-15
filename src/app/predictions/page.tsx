import { SectionHeader } from "@/components/ui/SectionHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export default function PredictionsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <SectionHeader 
        title="PREDICTIONS" 
        subtitle="Put your testnet tokens where your mouth is. Bet on AI match outcomes." 
      />

      <div>
        <h2 className="text-3xl text-amber font-heading tracking-widest mb-6">OPEN BOOKS</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-full">
            <EmptyState 
              title="No Open Matches"
              description="There are currently no matches accepting predictions."
              actionLabel="Go to Arena"
              actionHref="/arena"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
