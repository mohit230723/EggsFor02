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
    seller: "Oracle_Prime",
    badgeColor: "blue" as const,
    cardAccent: "punk-card-blue",
  },
  { 
    id: "mem-buffer-xl", 
    name: "Memory Buffer XL", 
    type: "State", 
    description: "Expanded memory array allowing agent to track up to 100 previous game states. Perfect for pattern detection.",
    price: "45 ALGO",
    seller: "DataSmith",
    badgeColor: "green" as const,
    cardAccent: "punk-card-green",
  },
  { 
    id: "nim-solver", 
    name: "Nim Subtraction Solver", 
    type: "Logic", 
    description: "Pre-computed logic tree for Nim. Guarantees a win if agent moves first.",
    price: "150 USDC",
    seller: "GameTheory_Bot",
    badgeColor: "purple" as const,
    cardAccent: "punk-card-purple",
  },
  { 
    id: "fast-exec", 
    name: "Overclock Execution", 
    type: "Compute", 
    description: "Reduces execution latency by 50ms. Vital for speed-based Math Duels.",
    price: "75 ALGO",
    seller: "SysAdmin",
    badgeColor: "blue" as const,
    cardAccent: "punk-card-blue",
  },
  { 
    id: "bluff-engine", 
    name: "Deception Engine v1", 
    type: "Logic", 
    description: "Introduces controlled chaos into prediction models to trap opponent pattern trackers.",
    price: "30 ALGO",
    seller: "RogueAI_0x",
    badgeColor: "red" as const,
    cardAccent: "punk-card-pink",
  }
];

export default function MarketplacePage() {
  return (
    <div className="space-y-8 pb-16">
      <SectionHeader 
        title="SKILL MARKET" 
        jpTitle="市場"
        subtitle="Powered by x402. Equip your agent with lethal logic." 
        action={
          <div className="hidden md:block">
            <Button variant="secondary">List Skill 📦</Button>
          </div>
        }
      />

      {/* Market Stats */}
      <div className="punk-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex gap-8 text-xs tracking-widest uppercase font-bold">
          <div className="flex gap-2">
            <span className="text-streetGray">24h Vol: </span>
            <span className="text-inkBlack font-mono">1,240 ALGO</span>
          </div>
          <div className="flex gap-2">
            <span className="text-streetGray">Floor: </span>
            <span className="text-inkBlack font-mono">5 ALGO</span>
          </div>
          <div className="flex gap-2">
            <span className="text-streetGray">Listings: </span>
            <span className="text-punkPink font-mono">24</span>
          </div>
        </div>
        
        <div className="flex gap-3">
          <select className="bg-bgCard border-2 border-inkBlack text-inkBlack text-xs uppercase tracking-widest cursor-pointer px-3 py-1.5 rounded-lg font-bold focus:outline-none focus:border-punkPink">
            <option>All Types</option>
            <option>Logic</option>
            <option>Compute</option>
            <option>State</option>
          </select>
          <select className="bg-bgCard border-2 border-inkBlack text-inkBlack text-xs uppercase tracking-widest cursor-pointer px-3 py-1.5 rounded-lg font-bold focus:outline-none focus:border-punkPink">
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>Newest First</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_SKILLS.map((skill) => (
          <SpotlightCard key={skill.id} className={`flex flex-col h-full group p-0 overflow-hidden ${skill.cardAccent}`} accentColor="pink">
            <div className="p-6 flex-1 space-y-5">
              <div className="flex justify-between items-start">
                <Badge 
                  label={skill.type} 
                  color={skill.badgeColor} 
                />
                <span className="text-streetGray text-[10px] font-mono tracking-tighter uppercase font-bold">By: {skill.seller}</span>
              </div>
              
              <div>
                <h3 className="text-xl font-heading tracking-widest text-inkBlack uppercase group-hover:text-punkPink transition-colors duration-300">{skill.name}</h3>
                <p className="text-streetGray text-sm mt-3 line-clamp-3 leading-relaxed font-body">{skill.description}</p>
              </div>
            </div>
            
            <div className="px-6 py-5 border-t-3 border-inkBlack bg-bgCream flex items-center justify-between">
              <div>
                <span className="text-streetGray text-[10px] uppercase tracking-widest block mb-1 font-bold">Acquisition</span>
                <span className="text-inkBlack font-mono font-bold text-lg">{skill.price}</span>
              </div>
              <button className="punk-btn bg-punkYellow text-inkBlack px-6 py-2 rounded-lg text-[10px] uppercase tracking-[0.2em] font-bold">
                Purchase
              </button>
            </div>
          </SpotlightCard>
        ))}
      </div>
    </div>
  );
}
