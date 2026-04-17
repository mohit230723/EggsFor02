'use client';

import { useState, useEffect, useCallback } from 'react';
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAlgorandWallet } from '@/components/Providers';
import type { SkillListing } from '@/lib/SkillMarketplaceClient';
import { Sparkles, Terminal, Code, Cpu, Database } from 'lucide-react';

const TYPE_ICONS: Record<string, any> = {
  Logic: Code,
  Compute: Cpu,
  State: Database,
  Data: Sparkles,
  Prediction: Terminal,
  Strategy: Sparkles,
};

export default function AgentsPage() {
  const { activeAddress } = useAlgorandWallet();
  const [ownedSkills, setOwnedSkills] = useState<SkillListing[]>([]);
  const [loading, setLoading] = useState(false);

  const loadOwnedSkills = useCallback(async () => {
    if (!activeAddress) {
      setOwnedSkills([]);
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`/api/skills/owned?address=${activeAddress}`);
      if (res.ok) {
        const data = await res.json();
        setOwnedSkills(data.skills ?? []);
      }
    } catch (err) {
      console.error('Failed to load owned skills:', err);
    } finally {
      setLoading(false);
    }
  }, [activeAddress]);

  useEffect(() => {
    loadOwnedSkills();
  }, [loadOwnedSkills]);

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
        {/* Sidebar: Purchased Skills */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="space-y-1">
            <h3 className="text-xl font-heading tracking-wider text-inkBlack uppercase">
              MY SKILLS <span className="text-streetGray text-xs">({ownedSkills.length})</span>
            </h3>
            <p className="text-streetGray text-[10px] font-mono uppercase tracking-tighter">Verified on-chain purchases</p>
          </div>

          <div className="space-y-3">
            {!activeAddress ? (
              <Card className="p-6 text-center border-dashed">
                <p className="text-streetGray text-xs font-body italic">Connect wallet to see your skills.</p>
              </Card>
            ) : loading ? (
              <div className="flex flex-col gap-3 py-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 w-full bg-inkBlack/5 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : ownedSkills.length === 0 ? (
              <Card className="p-6 text-center stripe-bg">
                <p className="text-streetGray text-sm font-body font-bold">No skills owned.</p>
                <p className="text-mutedText text-[10px] mt-2">Visit the marketplace to acquire skills.</p>
              </Card>
            ) : (
              ownedSkills.map(skill => {
                const Icon = TYPE_ICONS[skill.skillType] || Code;
                return (
                  <div 
                    key={skill.id} 
                    className="group punk-card p-3 bg-white border-2 border-inkBlack hover:bg-punkYellow transition-all cursor-pointer relative overflow-hidden"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-inkBlack text-white rounded">
                        <Icon size={16} />
                      </div>
                      <div>
                        <h4 className="font-heading text-sm text-inkBlack uppercase tracking-tighter shrink-0">{skill.name}</h4>
                        <p className="text-[9px] text-streetGray font-mono uppercase">v{skill.version} • {skill.skillType}</p>
                      </div>
                    </div>
                    {/* Hover accent line */}
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-punkPink scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Main: Loadout Panel */}
        <div className="lg:col-span-3 space-y-6">
          <h2 className="text-3xl text-inkBlack font-heading tracking-widest flex items-center gap-3">
            AGENT LOADOUT
            <span className="font-jp text-lg text-punkPurple opacity-50 font-bold">装備</span>
          </h2>
          <div className="punk-card checkerboard-bg min-h-[500px] flex items-center justify-center p-8 text-center border-4">
            <div>
              <div className="text-5xl mb-6 flex justify-center gap-4">
                <span className="opacity-20 animate-pulse">🤖</span>
                <span className="animate-bounce">🛠️</span>
                <span className="opacity-20 animate-pulse">🤖</span>
              </div>
              <p className="text-inkBlack text-xl mb-3 font-heading tracking-widest uppercase">Agent Selection Placeholder</p>
              <p className="text-streetGray text-sm font-body max-w-md mx-auto">
                Select an agent from your fleet to equip them with your purchased skills. 
                Deploy new agents via the factory to start scaling your swarm.
              </p>
              <div className="mt-8">
                <Button variant="secondary" className="opacity-50 cursor-not-allowed">Equip Skill [LOCKED]</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
