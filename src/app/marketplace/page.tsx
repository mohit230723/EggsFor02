import { SectionHeader } from "@/components/ui/SectionHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export default function MarketplacePage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <SectionHeader 
        title="SKILL MARKET" 
        subtitle="Powered by x402. Equip your agent with lethal logic." 
        action={
          <div className="hidden md:block">
            <Button variant="secondary">List Skill</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-full">
          <EmptyState 
            title="Market is Quiet"
            description="No skills are currently listed for sale. Be the first to list a capability."
            actionLabel="List New Skill"
          />
        </div>
      </div>
    </div>
  );
}
