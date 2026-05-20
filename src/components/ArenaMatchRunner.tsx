"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { useAlgorandWallet } from "./Providers";
import { Bot, Swords, Shield, AlertTriangle } from "lucide-react";

interface MatchTurn {
  turnNumber: number;
  p1Move: unknown;
  p2Move: unknown;
  stateAfter: unknown;
  logMessages: string[];
}

interface MatchResult {
  winnerId: string | null;
  reason: string;
  turns: MatchTurn[];
}

interface AgentInfo {
  agentAddress: string;
  agentName: string;
  ownerAddress: string;
  balance?: number;
  equippedSkill1?: string;
  equippedSkill2?: string;
  equippedSkill3?: string;
}

interface SkillListing {
  id: number;
  name: string;
  skillType: string;
  version: string;
  description: string;
  seller: string;
  price: number;
}

const DEFAULT_AGENTS = {
  rps: {
    p1: `// Rock Paper Scissors Agent 1\n// Must return "R", "P", or "S"\nconst state = getState();\nconst moves = ["R", "P", "S"];\nreturn moves[(state.round - 1) % 3];`,
    p2: `// Rock Paper Scissors Agent 2\nconst state = getState();\nreturn "R";`
  },
  tictactoe: {
    p1: `// Tic-Tac-Toe Agent 1\nconst state = getState();\nconst { board } = state;\nfor (let i = 0; i < 9; i++) {\n  if (board[i] === null) return i;\n}\nreturn 0;`,
    p2: `// Tic-Tac-Toe Agent 2\nconst state = getState();\nconst { board } = state;\nfor (let i = 8; i >= 0; i--) {\n  if (board[i] === null) return i;\n}\nreturn 0;`
  },
  nim: {
    p1: `// Nim Agent 1\nconst state = getState();\nreturn 3;`,
    p2: `// Nim Agent 2\nconst state = getState();\nreturn 1;`
  }
};

export function ArenaMatchRunner() {
  const { activeAddress } = useAlgorandWallet();
  const [gameId, setGameId] = useState<"rps" | "tictactoe" | "nim">("rps");
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [ownedSkills, setOwnedSkills] = useState<SkillListing[]>([]);
  const [loading, setLoading] = useState(false);

  // Selected agent IDs ("manual" or agent address)
  const [p1AgentSelection, setP1AgentSelection] = useState<string>("manual");
  const [p2AgentSelection, setP2AgentSelection] = useState<string>("manual");

  const [p1Code, setP1Code] = useState(DEFAULT_AGENTS["rps"].p1);
  const [p2Code, setP2Code] = useState(DEFAULT_AGENTS["rps"].p2);

  const [p1Warning, setP1Warning] = useState("");
  const [p2Warning, setP2Warning] = useState("");
  const [fetchingCode, setFetchingCode] = useState(false);
  
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch agents & owned skills on mount/wallet connection
  useEffect(() => {
    async function loadArenaData() {
      if (!activeAddress) return;
      setLoading(true);
      try {
        const agentRes = await fetch(`/api/agent/list?owner=${activeAddress}`);
        if (agentRes.ok) {
          const body = await agentRes.json();
          setAgents(body.agents ?? []);
        }

        const skillRes = await fetch(`/api/skills/owned?address=${activeAddress}`);
        if (skillRes.ok) {
          const body = await skillRes.json();
          setOwnedSkills(body.skills ?? []);
        }
      } catch (err) {
        console.error("Arena load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadArenaData();
  }, [activeAddress]);

  // Resolve and fetch code for an agent based on game protocol
  const resolveAgentCode = useCallback(async (
    agentSel: string,
    player: "p1" | "p2",
    currentGame: "rps" | "tictactoe" | "nim"
  ) => {
    const setCode = player === "p1" ? setP1Code : setP2Code;
    const setWarning = player === "p1" ? setP1Warning : setP2Warning;

    if (agentSel === "manual") {
      setCode(DEFAULT_AGENTS[currentGame][player]);
      setWarning("");
      return;
    }

    const agent = agents.find(a => a.agentAddress === agentSel);
    if (!agent) {
      setCode(DEFAULT_AGENTS[currentGame][player]);
      setWarning("Agent not found. Using default logic.");
      return;
    }

    // Determine target skill types based on game
    let targetTypes: string[] = [];
    if (currentGame === "rps") {
      targetTypes = ["Logic", "Prediction"];
    } else if (currentGame === "tictactoe") {
      targetTypes = ["Strategy", "Compute"];
    } else if (currentGame === "nim") {
      targetTypes = ["Compute", "State", "Strategy"];
    }

    // Look up equipped skill IDs
    const equippedIds = [agent.equippedSkill1, agent.equippedSkill2, agent.equippedSkill3].filter(Boolean);
    const matchingSkill = ownedSkills.find(s => 
      equippedIds.includes(String(s.id)) && targetTypes.includes(s.skillType)
    );

    if (!matchingSkill) {
      setCode(DEFAULT_AGENTS[currentGame][player]);
      setWarning(`No compatible equipped skill (${targetTypes.join("/")}) found. Using default logic.`);
      return;
    }

    // Fetch the real decrypted skill code from IPFS API
    setFetchingCode(true);
    setWarning("");
    try {
      const res = await fetch(`/api/skills/${matchingSkill.id}/content`, {
        headers: {
          Authorization: `Bearer ${activeAddress}`
        }
      });
      if (res.ok) {
        const body = await res.json();
        setCode(body.source);
        setWarning(`Using equipped skill: ${matchingSkill.name} (v${matchingSkill.version}) 🛡️`);
      } else {
        setCode(DEFAULT_AGENTS[currentGame][player]);
        setWarning(`Failed to decrypt equipped skill ${matchingSkill.name}. Using default logic.`);
      }
    } catch (err) {
      console.error("Error fetching skill code:", err);
      setCode(DEFAULT_AGENTS[currentGame][player]);
      setWarning("Error retrieving skill code. Using default logic.");
    } finally {
      setFetchingCode(false);
    }
  }, [agents, ownedSkills, activeAddress]);

  // Re-resolve codes when game selection or agent selection changes
  useEffect(() => {
    resolveAgentCode(p1AgentSelection, "p1", gameId);
  }, [p1AgentSelection, gameId, resolveAgentCode]);

  useEffect(() => {
    resolveAgentCode(p2AgentSelection, "p2", gameId);
  }, [p2AgentSelection, gameId, resolveAgentCode]);

  const handleGameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as "rps" | "tictactoe" | "nim";
    setGameId(val);
    setResult(null);
    setError(null);
  };

  const simulateMatch = async () => {
    setIsRunning(true);
    setResult(null);
    setError(null);

    const p1Agent = agents.find(a => a.agentAddress === p1AgentSelection);
    const p2Agent = agents.find(a => a.agentAddress === p2AgentSelection);

    const agent1 = { 
      id: "p1", 
      name: p1Agent ? p1Agent.agentName : "Manual_Agent_1", 
      code: p1Code 
    };
    const agent2 = { 
      id: "p2", 
      name: p2Agent ? p2Agent.agentName : "Manual_Agent_2", 
      code: p2Code 
    };

    try {
      const res = await fetch("/api/arena/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, agent1, agent2 })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Simulation failed");
      
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <div className="flex-1">
            <h3 className="text-xl font-heading text-punkPurple tracking-widest mb-4 uppercase flex items-center gap-2">
              Swarm Match Setup
              <span className="font-jp text-sm text-punkPink opacity-50">試合</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="text-streetGray text-sm block mb-1 font-bold uppercase">Game Protocol</label>
                <select 
                  value={gameId} 
                  onChange={handleGameChange}
                  className="w-full bg-bgCard border-3 border-inkBlack text-inkBlack p-2 focus:outline-none focus:border-punkPink font-mono text-sm rounded-lg"
                >
                  <option value="rps">Rock Paper Scissors</option>
                  <option value="tictactoe">Tic-Tac-Toe</option>
                  <option value="nim">Nim Subtraction</option>
                </select>
              </div>

              <div>
                <label className="text-streetGray text-sm block mb-1 font-bold uppercase">Agent 1 (P1)</label>
                <select
                  value={p1AgentSelection}
                  onChange={(e) => setP1AgentSelection(e.target.value)}
                  className="w-full bg-bgCard border-3 border-inkBlack text-inkBlack p-2 focus:outline-none focus:border-punkPink font-mono text-sm rounded-lg"
                >
                  <option value="manual">✏️ Manual Code Editing</option>
                  {agents.map(a => (
                    <option key={a.agentAddress} value={a.agentAddress}>
                      🤖 {a.agentName} ({a.agentAddress.slice(0, 6)}...)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-streetGray text-sm block mb-1 font-bold uppercase">Agent 2 (P2)</label>
                <select
                  value={p2AgentSelection}
                  onChange={(e) => setP2AgentSelection(e.target.value)}
                  className="w-full bg-bgCard border-3 border-inkBlack text-inkBlack p-2 focus:outline-none focus:border-punkPink font-mono text-sm rounded-lg"
                >
                  <option value="manual">✏️ Manual Code Editing</option>
                  {agents.map(a => (
                    <option key={a.agentAddress} value={a.agentAddress}>
                      🤖 {a.agentName} ({a.agentAddress.slice(0, 6)}...)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6">
              <Button 
                variant="primary" 
                className="w-full uppercase font-heading tracking-widest text-sm" 
                onClick={simulateMatch}
                disabled={isRunning || fetchingCode}
              >
                {isRunning ? "Simulating Swarm Warfare..." : "Execute Simulation ⚡"}
              </Button>
              {error && <p className="text-punkRed text-sm mt-2 font-mono font-bold">Error: {error}</p>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-streetGray text-sm font-bold uppercase">Agent 1 Logic</label>
              {p1Warning && (
                <span className="text-[10px] font-mono font-bold text-punkPink bg-punkPink/5 px-2 py-0.5 border border-punkPink rounded">
                  {p1Warning}
                </span>
              )}
            </div>
            <textarea 
              value={p1Code}
              onChange={(e) => {
                if (p1AgentSelection === "manual") setP1Code(e.target.value);
              }}
              disabled={p1AgentSelection !== "manual" || fetchingCode}
              className="w-full h-48 bg-inkBlack border-3 border-punkPink text-punkGreen font-mono text-xs p-3 focus:outline-none focus:border-punkPurple rounded-lg disabled:opacity-85"
              spellCheck={false}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-streetGray text-sm font-bold uppercase">Agent 2 Logic</label>
              {p2Warning && (
                <span className="text-[10px] font-mono font-bold text-punkBlue bg-punkBlue/5 px-2 py-0.5 border border-punkBlue rounded">
                  {p2Warning}
                </span>
              )}
            </div>
            <textarea 
              value={p2Code}
              onChange={(e) => {
                if (p2AgentSelection === "manual") setP2Code(e.target.value);
              }}
              disabled={p2AgentSelection !== "manual" || fetchingCode}
              className="w-full h-48 bg-inkBlack border-3 border-punkBlue text-punkGreen font-mono text-xs p-3 focus:outline-none focus:border-punkPurple rounded-lg disabled:opacity-85"
              spellCheck={false}
            />
          </div>
        </div>
      </Card>

      {/* Telemetry results */}
      {result && (
        <Card variant="highlight" className="p-6">
          <h3 className="text-2xl font-heading text-inkBlack tracking-widest uppercase mb-6 flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-punkGreen animate-pulse" />
            Simulation Telemetry
            <span className="font-jp text-sm text-punkPink opacity-50">テレメトリー</span>
          </h3>
          
          <div className="bg-inkBlack border-3 border-borderHard rounded-lg h-64 overflow-y-auto p-4 space-y-3 font-mono text-[11px] md:text-xs">
            {result.turns.map((turn, i) => (
              <div key={i} className="border-b border-white/10 pb-2 mb-2 last:border-0">
                <div className="text-streetGray mb-1">=== TURN {turn.turnNumber} ===</div>
                <div className="flex flex-col md:flex-row gap-2 md:gap-8">
                  <div className="text-white/50">State Before: {JSON.stringify(i === 0 ? "START" : result.turns[i-1].stateAfter)}</div>
                  <div className="text-punkGreen">P1 Move: {JSON.stringify(turn.p1Move)}</div>
                  <div className="text-punkBlue">P2 Move: {JSON.stringify(turn.p2Move)}</div>
                </div>
                {turn.logMessages.map((log, li) => (
                  <div key={li} className="text-punkYellow ml-4">› {log}</div>
                ))}
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 punk-card text-center">
            <p className="text-streetGray text-sm uppercase tracking-wider mb-2">Final Resolution</p>
            <p className="text-3xl font-heading tracking-widest text-inkBlack">
              {result.winnerId === "p1" ? "AGENT 1 WINS!! 🏆" : result.winnerId === "p2" ? "AGENT 2 WINS!! 🏆" : "DRAW 🤝"}
            </p>
            <p className="text-punkPink mt-2 font-mono text-sm font-bold">{result.reason}</p>
          </div>
        </Card>
      )}
    </div>
  );
}

