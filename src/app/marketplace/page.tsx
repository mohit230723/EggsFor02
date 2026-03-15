import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

// Mock Data
const MOCK_SKILLS = [
  { 
    id: "rng-seed", 
    name: "TrueRandom Seed", 
    type: "Compute", 
    description: "Access to an on-chain verifiable random number generator. Crucial for RPS and probability games.",
    price: "10 ALGO",
    seller: "Oracle_Prime"
  },
  { 
    id: "mem-buffer-xl", 
    name: "Memory Buffer XL", 
    type: "State", 
    description: "Expanded memory array allowing agent to track up to 100 previous game states. Perfect for pattern detection.",
    price: "45 ALGO",
    seller: "DataSmith"
  },
  { 
    id: "nim-solver", 
    name: "Nim Subtraction Solver", 
    type: "Logic", 
    description: "Pre-computed logic tree for Nim. Guarantees a win if agent moves first.",
    price: "150 USDC",
    seller: "GameTheory_Bot"
  },
  { 
    id: "fast-exec", 
    name: "Overclock Execution", 
    type: "Compute", 
    description: "Reduces execution latency by 50ms. Vital for speed-based Math Duels.",
    price: "75 ALGO",
    seller: "SysAdmin"
  },
  { 
    id: "bluff-engine", 
    name: "Deception Engine v1", 
    type: "Logic", 
    description: "Introduces controlled chaos into prediction models to trap opponent pattern trackers.",
    price: "30 ALGO",
    seller: "RogueAI_0x"
  }
];

export default function MarketplacePage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-16">
      <SectionHeader 
        title="SKILL MARKET" 
        subtitle="Powered by x402. Equip your agent with lethal logic." 
        action={
          <div className="hidden md:block">
            <Button variant="secondary">List Skill</Button>
          </div>
        }
      />

      {/* Market Stats Bar */}
      <div className="bg-charcoal/50 border border-steel/20 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-smoke">24h Vol: </span>
            <span className="text-bone font-mono font-bold">1,240 ALGO</span>
          </div>
          <div>
            <span className="text-smoke">Floor Price: </span>
            <span className="text-bone font-mono font-bold">5 ALGO</span>
          </div>
          <div>
            <span className="text-smoke">Listings: </span>
            <span className="text-amber font-mono font-bold">24</span>
          </div>
        </div>
        
        {/* Filter/Sort Placeholders */}
        <div className="flex gap-2">
          <select className="bg-nearBlack border border-steel/30 text-smoke text-sm px-3 py-1.5 rounded focus:outline-none focus:border-amber">
            <option>All Types</option>
            <option>Logic</option>
            <option>Compute</option>
            <option>State</option>
          </select>
          <select className="bg-nearBlack border border-steel/30 text-smoke text-sm px-3 py-1.5 rounded focus:outline-none focus:border-amber">
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>Newest</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_SKILLS.map((skill) => (
          <Card key={skill.id} className="flex flex-col h-full group">
            <div className="p-5 flex-1 space-y-4">
              <div className="flex justify-between items-start">
                <Badge 
                  label={skill.type} 
                  color={skill.type === "Compute" ? "amber" : skill.type === "Logic" ? "red" : "gray"} 
                />
                <span className="text-smoke text-xs font-mono">By: {skill.seller}</span>
              </div>
              
              <div>
                <h3 className="text-xl font-heading tracking-widest text-bone uppercase group-hover:text-amber transition-colors">{skill.name}</h3>
                <p className="text-smoke text-sm mt-2 line-clamp-3 leading-relaxed">{skill.description}</p>
              </div>
            </div>
            
            <div className="p-5 border-t border-steel/20 bg-nearBlack/30 flex items-center justify-between">
              <div>
                <span className="text-smoke text-xs uppercase tracking-wider block mb-0.5">Price</span>
                <span className="text-bone font-mono font-bold text-lg">{skill.price}</span>
              </div>
              <Button variant="primary" size="sm">Buy</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
