'use client';

import { useState, useEffect, useCallback } from 'react';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAlgorandWallet } from '@/components/Providers';
import type { SkillListing } from '@/lib/SkillMarketplaceClient';
import {
  Sparkles, Terminal, Code, Cpu, Database,
  Bot, Zap, Shield, Trophy, Clock, Wallet,
  ChevronRight, AlertCircle, CheckCircle, Loader2, Plus,
} from 'lucide-react';
import { buildDeployAgentTxns, submitSignedTxns } from '@/lib/AgentRegistryClient';

// ─── Constants ────────────────────────────────────────────────────────────────
const DEPLOY_FEE_ALGO = 0;
const EGGS_PER_LEVEL = 50;

const TYPE_ICONS: Record<string, any> = {
  Logic: Code,
  Compute: Cpu,
  State: Database,
  Data: Sparkles,
  Prediction: Terminal,
  Strategy: Sparkles,
};

const EGG_LIMITS: { minEggs: number; maxAgents: number; maxSkills: number; label: string }[] = [
  { minEggs: 0, maxAgents: 1, maxSkills: 2, label: 'Hatchling' },
  { minEggs: 50, maxAgents: 2, maxSkills: 3, label: 'Runner' },
  { minEggs: 150, maxAgents: 3, maxSkills: 4, label: 'Operative' },
  { minEggs: 350, maxAgents: 5, maxSkills: 5, label: 'Ghost' },
  { minEggs: 700, maxAgents: 8, maxSkills: 6, label: 'Phantom' },
];

function getTier(eggs: number) {
  let tier = EGG_LIMITS[0];
  for (const t of EGG_LIMITS) {
    if (eggs >= t.minEggs) tier = t;
  }
  return tier;
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface AgentInfo {
  agentAddress: string;
  agentName: string;
  ownerAddress: string;
  balance?: number; // ALGO balance of the agent wallet
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function EggsLevelBar({ eggs }: { eggs: number }) {
  const tier = getTier(eggs);
  const nextTier = EGG_LIMITS.find(t => t.minEggs > eggs);
  const progress = nextTier
    ? ((eggs - tier.minEggs) / (nextTier.minEggs - tier.minEggs)) * 100
    : 100;

  return (
    <div className="punk-card p-4 bg-inkBlack text-white space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🥚</span>
          <div>
            <p className="font-heading text-xs uppercase tracking-widest text-punkYellow">{tier.label}</p>
            <p className="font-mono font-bold text-lg">{eggs} Eggs</p>
          </div>
        </div>
        <div className="text-right text-xs font-mono text-streetGray">
          <p>Max Agents: <span className="text-punkGreen font-bold">{tier.maxAgents}</span></p>
          <p>Max Skills/Bot: <span className="text-punkBlue font-bold">{tier.maxSkills}</span></p>
        </div>
      </div>
      {nextTier && (
        <>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-punkPink to-punkYellow rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[9px] text-streetGray font-mono uppercase text-right">
            {nextTier.minEggs - eggs} eggs to {nextTier.label}
          </p>
        </>
      )}
    </div>
  );
}

function AgentCard({ agent, onSelect, isSelected }: { agent: AgentInfo; onSelect: () => void; isSelected: boolean }) {
  const shortAddr = `${agent.agentAddress.slice(0, 6)}…${agent.agentAddress.slice(-4)}`;
  return (
    <div
      onClick={onSelect}
      className={`punk-card p-4 cursor-pointer border-2 transition-all ${isSelected
        ? 'border-punkPink bg-punkPink/5'
        : 'border-inkBlack hover:border-punkPurple bg-white'
        }`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded ${isSelected ? 'bg-punkPink text-white' : 'bg-inkBlack text-white'}`}>
          <Bot size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-heading text-sm text-inkBlack uppercase tracking-tight truncate">{agent.agentName}</h4>
          <p className="font-mono text-[9px] text-streetGray">{shortAddr}</p>
        </div>
        {isSelected && <ChevronRight size={14} className="text-punkPink shrink-0" />}
      </div>
      {agent.balance !== undefined && (
        <div className="mt-2 pt-2 border-t border-borderSoft flex items-center gap-1">
          <Wallet size={10} className="text-streetGray" />
          <span className="font-mono text-[10px] text-streetGray">{agent.balance.toFixed(3)} ALGO</span>
          {agent.balance < 1 && (
            <span className="ml-auto text-[9px] text-punkRed font-bold animate-pulse">LOW FUNDS</span>
          )}
        </div>
      )}
    </div>
  );
}

function DeployModal({
  onClose,
  onDeployed,
  tier,
  agentCount,
}: {
  onClose: () => void;
  onDeployed: (agent: AgentInfo) => void;
  tier: ReturnType<typeof getTier>;
  agentCount: number;
}) {
  const { activeAddress, signTransaction } = useAlgorandWallet();
  const [agentName, setAgentName] = useState('');
  const [step, setStep] = useState<'form' | 'deploying' | 'signing' | 'done'>('form');
  const [newAgent, setNewAgent] = useState<AgentInfo | null>(null);
  const [error, setError] = useState('');
  const [txId, setTxId] = useState('');

  const canDeploy = agentCount < tier.maxAgents;

  async function handleDeploy() {
    if (!agentName.trim() || !activeAddress) return;
    setStep('deploying');
    setError('');

    try {
      // 1. Generate secure wallet offline and save to vault
      const res = await fetch('/api/agent/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerAddress: activeAddress, agentName: agentName.trim() }),
      });

      if (!res.ok) throw new Error((await res.json()).error ?? 'Deploy failed');
      const data = await res.json();

      // 2. Build deployment txns (Fee + Funding + Register)
      setStep('signing');
      const unsignedTxns = await buildDeployAgentTxns(activeAddress, data.agentAddress, data.agentName);

      // 3. Decode for Pera wallet sign flow
      const algosdk = await import('algosdk');
      const toSign = unsignedTxns.map(bytes => ({
        txn: algosdk.decodeUnsignedTransaction(bytes)
      }));

      // 4. Request user signature
      const signed = await signTransaction([toSign]);

      // 5. Submit to blockchain
      const confirmedTxId = await submitSignedTxns(signed);
      setTxId(confirmedTxId);

      setNewAgent(data);
      setStep('done');
    } catch (err: any) {
      setError(err.message);
      setStep('form');
    }
  }

  function handleDone() {
    if (newAgent) onDeployed(newAgent);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inkBlack/70 backdrop-blur-sm">
      <div className="punk-card bg-white w-full max-w-md border-4 border-inkBlack shadow-2xl">

        {/* Header */}
        <div className="bg-inkBlack text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot size={20} className="text-punkYellow" />
            <h2 className="font-heading text-lg uppercase tracking-widest">Deploy Agent</h2>
          </div>
          <button onClick={onClose} className="text-streetGray hover:text-white transition-colors text-xl font-bold">✕</button>
        </div>

        <div className="p-6 space-y-5">

          {/* Capacity check */}
          {!canDeploy && (
            <div className="flex items-center gap-3 p-3 bg-punkRed/10 border border-punkRed rounded">
              <AlertCircle size={16} className="text-punkRed shrink-0" />
              <p className="text-punkRed text-xs font-mono">
                Agent limit reached ({agentCount}/{tier.maxAgents}). Earn more Eggs to unlock more slots.
              </p>
            </div>
          )}

          {/* Step: Form */}
          {step === 'form' && (
            <>
              <div>
                <label className="block text-xs font-heading uppercase tracking-widest text-inkBlack mb-2">Agent Name</label>
                <input
                  type="text"
                  maxLength={32}
                  placeholder="e.g. NullSec_Bot"
                  value={agentName}
                  onChange={e => setAgentName(e.target.value)}
                  className="w-full border-2 border-inkBlack font-mono text-sm px-3 py-2 focus:outline-none focus:border-punkPink"
                />
              </div>

              <div className="bg-bgCream p-4 border-2 border-dashed border-inkBlack space-y-2">
                <p className="font-heading text-xs uppercase tracking-widest text-inkBlack">Deployment Cost</p>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-streetGray">Deploy Fee</span>
                  <span className="font-mono font-bold text-punkGreen">FREE ({DEPLOY_FEE_ALGO} ALGO)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-streetGray">Agent Wallet Funding</span>
                  <span className="font-mono font-bold text-streetGray">~2 ALGO (for gas)</span>
                </div>
                <div className="flex items-center justify-between border-t border-inkBlack pt-2">
                  <span className="font-heading text-xs uppercase text-inkBlack">Total</span>
                  <span className="font-heading text-punkPink">~2 ALGO</span>
                </div>
              </div>

              {error && <p className="text-punkRed text-xs font-mono">{error}</p>}

              <Button
                variant="primary"
                className="w-full"
                onClick={handleDeploy}
                disabled={!agentName.trim() || !canDeploy}
              >
                Generate Agent Wallet →
              </Button>
            </>
          )}

          {/* Step: Deploying */}
          {step === 'deploying' && (
            <div className="py-8 flex flex-col items-center gap-4">
              <Loader2 size={32} className="text-punkPink animate-spin" />
              <p className="font-mono text-sm text-inkBlack">Generating secure wallet...</p>
              <p className="text-streetGray text-xs font-mono">Encrypting private key to vault</p>
            </div>
          )}

          {/* Step: Signing */}
          {step === 'signing' && newAgent && (
            <div className="py-8 flex flex-col items-center gap-4 text-center">
              <Loader2 size={32} className="text-punkPink animate-spin" />
              <p className="font-mono text-sm text-inkBlack">Sign in Pera Wallet</p>
              <p className="text-streetGray text-xs font-mono">
                Please approve the transaction in your wallet to deploy and fund <strong>{newAgent.agentName}</strong>.
              </p>
            </div>
          )}

          {/* Step: Done */}
          {step === 'done' && newAgent && (
            <>
              <div className="flex items-center gap-3 p-3 bg-punkGreen/10 border border-punkGreen rounded">
                <CheckCircle size={16} className="text-punkGreen shrink-0" />
                <p className="text-punkGreen text-xs font-mono font-bold">Agent deployed successfully!</p>
              </div>

              <Button variant="primary" className="w-full mt-4" onClick={handleDone}>
                View Agent
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AgentsPage() {
  const { activeAddress } = useAlgorandWallet();
  const [ownedSkills, setOwnedSkills] = useState<SkillListing[]>([]);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentInfo | null>(null);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [showDeploy, setShowDeploy] = useState(false);

  // Local state for equipped skills (keyed by agentAddress)
  const [equippedSkillsMap, setEquippedSkillsMap] = useState<Record<string, SkillListing[]>>({});

  // Mocked eggs — will be fetched from AgentRegistry contract once deployed
  const [eggs] = useState(0);
  const tier = getTier(eggs);

  // ── Fetch owned skills ──
  const loadOwnedSkills = useCallback(async () => {
    if (!activeAddress) { setOwnedSkills([]); return; }
    setLoadingSkills(true);
    try {
      const res = await fetch(`/api/skills/owned?address=${activeAddress}`);
      if (res.ok) setOwnedSkills((await res.json()).skills ?? []);
    } finally {
      setLoadingSkills(false);
    }
  }, [activeAddress]);

  // ── Fetch agents from vault ──
  const loadAgents = useCallback(async () => {
    if (!activeAddress) { setAgents([]); return; }
    try {
      const res = await fetch(`/api/agent/list?owner=${activeAddress}`);
      if (res.ok) setAgents((await res.json()).agents ?? []);
    } catch { /* silent */ }
  }, [activeAddress]);

  useEffect(() => { loadOwnedSkills(); loadAgents(); }, [loadOwnedSkills, loadAgents]);

  function handleDeployed(newAgent: AgentInfo) {
    setAgents(prev => [...prev, newAgent]);
    setSelectedAgent(newAgent);
  }

  return (
    <div className="space-y-8 pb-16">
      <SectionHeader
        title="AGENT SWARM"
        jpTitle="スウォーム"
        subtitle="Deploy autonomous bots. Equip skills. Compete in the Arena via x402."
        action={
          <Button variant="primary" onClick={() => setShowDeploy(true)}>
            <Plus size={14} className="mr-2" />
            Deploy Agent
          </Button>
        }
      />

      {/* Eggs Level Bar */}
      {activeAddress && <EggsLevelBar eggs={eggs} />}

      {/* No wallet */}
      {!activeAddress && (
        <Card className="p-12 text-center stripe-bg">
          <div className="text-5xl mb-4">🔌</div>
          <p className="font-heading text-xl uppercase tracking-widest text-inkBlack mb-2">Connect Your Wallet</p>
          <p className="text-streetGray text-sm font-mono">Connect to manage your agent swarm.</p>
        </Card>
      )}

      {activeAddress && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* ── Left Sidebar: Skills + Agents ── */}
          <div className="lg:col-span-1 space-y-6">

            {/* My Agents */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-heading tracking-wider text-inkBlack uppercase">
                  MY AGENTS <span className="text-streetGray text-xs">({agents.length}/{tier.maxAgents})</span>
                </h3>
                <button
                  onClick={() => setShowDeploy(true)}
                  className="p-1 border-2 border-inkBlack hover:bg-punkYellow transition-colors"
                >
                  <Plus size={12} />
                </button>
              </div>

              <div className="space-y-2">
                {agents.length === 0 ? (
                  <Card className="p-4 text-center border-dashed">
                    <Bot size={24} className="mx-auto mb-2 text-streetGray opacity-40" />
                    <p className="text-streetGray text-xs font-mono">No agents deployed yet.</p>
                  </Card>
                ) : (
                  agents.map(a => (
                    <AgentCard
                      key={a.agentAddress}
                      agent={a}
                      isSelected={selectedAgent?.agentAddress === a.agentAddress}
                      onSelect={() => setSelectedAgent(a)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Skill Inventory */}
            <div className="space-y-2">
              <h3 className="text-lg font-heading tracking-wider text-inkBlack uppercase">
                SKILL INVENTORY <span className="text-streetGray text-xs">({ownedSkills.length})</span>
              </h3>
              <p className="text-[10px] text-streetGray font-mono uppercase">On-chain verified purchases</p>

              <div className="space-y-2">
                {loadingSkills ? (
                  [1, 2, 3].map(i => (
                    <div key={i} className="h-14 w-full bg-inkBlack/5 animate-pulse rounded" />
                  ))
                ) : ownedSkills.length === 0 ? (
                  <Card className="p-4 text-center border-dashed">
                    <p className="text-streetGray text-xs font-mono">No skills in inventory.</p>
                    <a href="/marketplace" className="text-punkPink text-[10px] font-mono hover:underline mt-1 block">
                      Visit marketplace →
                    </a>
                  </Card>
                ) : (
                  ownedSkills.map(skill => {
                    const Icon = TYPE_ICONS[skill.skillType] || Code;
                    const alreadyEquipped = selectedAgent && (
                      // placeholder for future equip logic
                      false
                    );
                    return (
                      <div
                        key={skill.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('application/json', JSON.stringify(skill));
                        }}
                        className="group punk-card p-3 bg-white border-2 border-inkBlack hover:bg-punkYellow transition-all cursor-grab relative overflow-hidden"
                        title="Drag to equip"
                      >
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-inkBlack text-white rounded shrink-0">
                            <Icon size={12} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-heading text-xs text-inkBlack uppercase tracking-tighter truncate">{skill.name}</p>
                            <p className="text-[9px] text-streetGray font-mono">{skill.skillType} · v{skill.version}</p>
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-punkPink scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* ── Main: Agent Detail / Loadout ── */}
          <div className="lg:col-span-3 space-y-6">

            {!selectedAgent ? (
              /* No agent selected */
              <div className="punk-card checkerboard-bg min-h-[500px] flex items-center justify-center p-8 text-center border-4">
                <div>
                  <div className="text-5xl mb-6 flex justify-center gap-4">
                    <span className="opacity-20 animate-pulse">🤖</span>
                    <span className="animate-bounce">⚡</span>
                    <span className="opacity-20 animate-pulse">🤖</span>
                  </div>
                  <p className="text-inkBlack text-xl mb-3 font-heading tracking-widest uppercase">Select an Agent</p>
                  <p className="text-streetGray text-sm font-mono max-w-md mx-auto">
                    Pick an agent from your roster to view stats and manage their skill loadout.
                  </p>
                  {agents.length === 0 && (
                    <div className="mt-8">
                      <Button variant="primary" onClick={() => setShowDeploy(true)}>
                        Deploy Your First Agent →
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Agent Detail Panel */
              <div className="space-y-6">

                {/* Agent Header */}
                <div className="punk-card p-6 bg-inkBlack text-white">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-punkPink/20 border-2 border-punkPink rounded flex items-center justify-center">
                        <Bot size={32} className="text-punkPink" />
                      </div>
                      <div>
                        <h2 className="font-heading text-2xl uppercase tracking-widest text-white">
                          {selectedAgent.agentName}
                        </h2>
                        <p className="font-mono text-xs text-streetGray mt-1 break-all">
                          {selectedAgent.agentAddress}
                        </p>
                        <a
                          href={`https://testnet.explorer.perawallet.app/accounts/${selectedAgent.agentAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-punkYellow text-[10px] font-mono hover:underline mt-1 inline-block"
                        >
                          View on Pera Explorer →
                        </a>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-2 justify-end mb-1">
                        <Wallet size={12} className="text-streetGray" />
                        <span className="font-mono text-sm font-bold text-punkYellow">
                          {selectedAgent.balance?.toFixed(3) ?? '...'} ALGO
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-streetGray uppercase">Agent Balance</span>
                    </div>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { icon: Trophy, label: 'Wins', value: '0', color: 'text-punkGreen' },
                    { icon: Shield, label: 'Losses', value: '0', color: 'text-punkRed' },
                    { icon: Zap, label: 'Eggs Earned', value: '0', color: 'text-punkYellow' },
                  ].map(stat => (
                    <div key={stat.label} className="punk-card p-4 text-center border-2 border-inkBlack">
                      <stat.icon size={20} className={`mx-auto mb-2 ${stat.color}`} />
                      <p className={`font-heading text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                      <p className="text-streetGray text-[10px] uppercase font-mono">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Skill Loadout */}
                <div className="punk-card p-6 border-2 border-inkBlack space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading text-xl uppercase tracking-widest text-inkBlack">
                      SKILL LOADOUT
                    </h3>
                    <span className="text-streetGray text-[10px] font-mono uppercase">
                      0/{tier.maxSkills} slots used
                    </span>
                  </div>

                  <div className={`grid grid-cols-${Math.min(tier.maxSkills, 3)} gap-3`}>
                    {Array.from({ length: tier.maxSkills }).map((_, i) => {
                      const agentEquipped = selectedAgent ? equippedSkillsMap[selectedAgent.agentAddress] || [] : [];
                      const equippedSkill = agentEquipped[i];

                      return (
                        <div
                          key={i}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            try {
                              const skill = JSON.parse(e.dataTransfer.getData('application/json'));
                              if (selectedAgent && skill) {
                                setEquippedSkillsMap(prev => {
                                  const current = prev[selectedAgent.agentAddress] || [];
                                  if (current.some(s => s?.id === skill.id)) return prev; // Already equipped
                                  const updated = [...current];
                                  updated[i] = skill;
                                  return { ...prev, [selectedAgent.agentAddress]: updated };
                                });
                              }
                            } catch (err) { }
                          }}
                          className={`border-2 ${equippedSkill ? 'border-solid border-punkGreen bg-punkGreen/5' : 'border-dashed border-inkBlack/30 hover:border-punkPink hover:bg-punkPink/5'} rounded p-4 flex flex-col items-center justify-center text-center gap-2 min-h-[100px] transition-all cursor-pointer`}
                        >
                          {equippedSkill ? (
                            <>
                              <div className="p-1.5 bg-punkGreen text-white rounded shrink-0">
                                {(() => {
                                  const Icon = TYPE_ICONS[equippedSkill.skillType] || Code;
                                  return <Icon size={16} />;
                                })()}
                              </div>
                              <p className="font-heading text-xs uppercase tracking-tighter text-inkBlack w-full truncate">{equippedSkill.name}</p>
                            </>
                          ) : (
                            <>
                              <Plus size={20} className="text-inkBlack/20" />
                              <p className="text-[10px] text-streetGray font-mono uppercase">Skill Slot {i + 1}</p>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-[10px] text-streetGray font-mono text-center">
                    Drag a skill from your inventory to equip it. Agent will autonomously purchase via x402 on the blockchain.
                  </p>
                </div>

                {/* x402 Activity Log */}
                <div className="punk-card p-5 border-2 border-inkBlack bg-inkBlack/5 space-y-3">
                  <h3 className="font-heading text-sm uppercase tracking-widest text-inkBlack flex items-center gap-2">
                    <Terminal size={14} />
                    x402 Activity Log
                  </h3>
                  <div className="font-mono text-xs text-streetGray space-y-1">
                    <p className="text-inkBlack/30 italic">Agent has no on-chain activity yet.</p>
                    <p className="text-inkBlack/20">
                      {'>'} Activity will appear here once your agent joins a match or purchases a skill.
                    </p>
                  </div>
                </div>

                {/* Arena CTA */}
                <div className="flex gap-3">
                  <a href="/arena" className="flex-1">
                    <Button variant="primary" className="w-full">
                      Enter Arena ⚔️
                    </Button>
                  </a>
                  <Button variant="secondary" className="flex-1">
                    Buy Skill via x402
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Deploy Modal */}
      {showDeploy && (
        <DeployModal
          onClose={() => setShowDeploy(false)}
          onDeployed={handleDeployed}
          tier={tier}
          agentCount={agents.length}
        />
      )}
    </div>
  );
}
