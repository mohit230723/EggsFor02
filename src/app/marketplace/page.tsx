import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import SpotlightCard from "@/components/ui/SpotlightCard";

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

      {/* Market Stats Bar as a Spotlight Pill */}
      <SpotlightCard 
        className="p-4 flex flex-col md:flex-row items-center justify-between gap-4 mb-4 rounded-full"
        spotlightColor="rgba(0, 229, 255, 0.05)"
      >
        <div className="flex gap-8 text-xs tracking-widest uppercase">
          <div className="flex gap-2">
            <span className="text-smoke">24h Vol: </span>
            <span className="text-softWhite font-mono font-bold">1,240 ALGO</span>
          </div>
          <div className="flex gap-2">
            <span className="text-smoke">Floor: </span>
            <span className="text-softWhite font-mono font-bold">5 ALGO</span>
          </div>
          <div className="flex gap-2">
            <span className="text-smoke">Listings: </span>
            <span className="text-cyanGlow font-mono font-bold">24</span>
          </div>
        </div>
        
        <div className="flex gap-3">
          <select className="bg-transparent border-none text-smoke text-[10px] uppercase tracking-widest cursor-pointer hover:text-softWhite transition-colors focus:outline-none">
            <option className="bg-spaceBlue">All Types</option>
            <option className="bg-spaceBlue">Logic</option>
            <option className="bg-spaceBlue">Compute</option>
            <option className="bg-spaceBlue">State</option>
          </select>
          <div className="w-[1px] h-4 bg-white/10 hidden md:block"></div>
          <select className="bg-transparent border-none text-smoke text-[10px] uppercase tracking-widest cursor-pointer hover:text-softWhite transition-colors focus:outline-none">
            <option className="bg-spaceBlue">Price: Low to High</option>
            <option className="bg-spaceBlue">Price: High to Low</option>
            <option className="bg-spaceBlue">Newest First</option>
          </select>
        </div>
      </SpotlightCard>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_SKILLS.map((skill) => (
          <SpotlightCard key={skill.id} className="flex flex-col h-full group p-0 overflow-hidden" spotlightColor="rgba(0, 229, 255, 0.1)">
            <div className="p-6 flex-1 space-y-5">
              <div className="flex justify-between items-start">
                <Badge 
                  label={skill.type} 
                  color="gray" 
                />
                <span className="text-smoke text-[10px] font-mono tracking-tighter uppercase opacity-50">By: {skill.seller}</span>
              </div>
              
              <div>
                <h3 className="text-xl font-heading tracking-widest text-softWhite uppercase group-hover:text-cyanGlow transition-colors duration-300">{skill.name}</h3>
                <p className="text-smoke text-sm mt-3 line-clamp-3 leading-relaxed opacity-80">{skill.description}</p>
              </div>
            </div>
            
            <div className="px-6 py-5 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
              <div>
                <span className="text-smoke text-[10px] uppercase tracking-widest block mb-1 opacity-50">Acquisition</span>
                <span className="text-softWhite font-mono font-bold text-lg">{skill.price}</span>
              </div>
              <button className="bg-white/5 hover:bg-white/10 border border-white/10 text-softWhite px-6 py-2 rounded-full text-[10px] uppercase tracking-[0.2em] transition-all duration-300">
                Purchase
              </button>
            </div>
          </SpotlightCard>
        ))}
      </div>
    </div>
  );
}
