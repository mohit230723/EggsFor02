"use client";

import React, { useState } from "react";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";

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

const DEFAULT_AGENTS = {
  rps: {
    p1: `// Rock Paper Scissors Agent 1
// Must return "R", "P", or "S"
const state = getState();
// Simple pattern: rotate R P S
const moves = ["R", "P", "S"];
return moves[(state.round - 1) % 3];`,
    p2: `// Rock Paper Scissors Agent 2
const state = getState();
// Always picks Rock
return "R";`
  },
  tictactoe: {
    p1: `// Tic-Tac-Toe Agent 1
// Must return cell index 0-8
const state = getState();
const { board, turn } = state;
// Find first empty cell
for (let i = 0; i < 9; i++) {
  if (board[i] === null) return i;
}
return 0;`,
    p2: `// Tic-Tac-Toe Agent 2
const state = getState();
const { board, turn } = state;
// Find last empty cell
for (let i = 8; i >= 0; i--) {
  if (board[i] === null) return i;
}
return 0;`
  },
  nim: {
    p1: `// Nim Agent 1
// Must return 1, 2, or 3
const state = getState();
// Try to take 3
return 3;`,
    p2: `// Nim Agent 2
// Must return 1, 2, or 3
const state = getState();
// Take 1 to be annoying
return 1;`
  }
};

export function ArenaMatchRunner() {
  const [gameId, setGameId] = useState<"rps" | "tictactoe" | "nim">("rps");
  const [p1Code, setP1Code] = useState(DEFAULT_AGENTS["rps"].p1);
  const [p2Code, setP2Code] = useState(DEFAULT_AGENTS["rps"].p2);
  
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as "rps" | "tictactoe" | "nim";
    setGameId(val);
    setP1Code(DEFAULT_AGENTS[val].p1);
    setP2Code(DEFAULT_AGENTS[val].p2);
    setResult(null);
    setError(null);
  };

  const simulateMatch = async () => {
    setIsRunning(true);
    setResult(null);
    setError(null);

    const agent1 = { id: "p1", name: "Agent_X", code: p1Code };
    const agent2 = { id: "p2", name: "Agent_Y", code: p2Code };

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
              Match Setup
              <span className="font-jp text-sm text-punkPink opacity-50">試合</span>
            </h3>
            <div className="space-y-4">
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
              <Button 
                variant="primary" 
                className="w-full" 
                onClick={simulateMatch}
                disabled={isRunning}
              >
                {isRunning ? "Simulating..." : "Execute Simulation ⚡"}
              </Button>
              {error && <p className="text-punkRed text-sm mt-2 font-mono font-bold">Error: {error}</p>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-streetGray text-sm block mb-1 font-bold uppercase">Agent 1 Logic (JavaScript)</label>
            <textarea 
              value={p1Code}
              onChange={(e) => setP1Code(e.target.value)}
              className="w-full h-48 bg-inkBlack border-3 border-punkPink text-punkGreen font-mono text-xs p-3 focus:outline-none focus:border-punkPurple rounded-lg"
              spellCheck={false}
            />
          </div>
          <div>
            <label className="text-streetGray text-sm block mb-1 font-bold uppercase">Agent 2 Logic (JavaScript)</label>
            <textarea 
              value={p2Code}
              onChange={(e) => setP2Code(e.target.value)}
              className="w-full h-48 bg-inkBlack border-3 border-punkBlue text-punkGreen font-mono text-xs p-3 focus:outline-none focus:border-punkPurple rounded-lg"
              spellCheck={false}
            />
          </div>
        </div>
      </Card>

      {/* Results */}
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
