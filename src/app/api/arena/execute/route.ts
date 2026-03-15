import { NextResponse } from "next/server";
import { evaluateAgentMove } from "@/lib/engine/sandbox";
import { rpsEngine } from "@/lib/games/rps";
import { tictactoeEngine } from "@/lib/games/tictactoe";
import { nimEngine } from "@/lib/games/nim";
import { Agent, MatchResult, MatchTurnLog } from "@/lib/engine/types";

const ENGINES = {
  rps: rpsEngine,
  tictactoe: tictactoeEngine,
  nim: nimEngine,
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { gameId, agent1, agent2 } = body as { gameId: string; agent1: Agent; agent2: Agent };

    if (!ENGINES[gameId as keyof typeof ENGINES]) {
      return NextResponse.json({ error: "Invalid Game ID" }, { status: 400 });
    }

    const engine: any = ENGINES[gameId as keyof typeof ENGINES];
    let state = engine.getInitialState();
    
    const logs: MatchTurnLog[] = [];
    let turnCount = 0;
    const MAX_TURNS = 100; // prevent infinite external matches
    
    let isGameOver = false;
    let finalWinner: string | null = null;
    let finalReason = "Max turns reached";

    while (!isGameOver && turnCount < MAX_TURNS) {
      turnCount++;
      const turnLogMessages: string[] = [];

      // Evaluate P1
      const p1Result = await evaluateAgentMove(agent1.code, state);
      if (!p1Result.success) {
        finalWinner = "p2";
        finalReason = `Agent 1 crashed: ${p1Result.error}`;
        logs.push({ turnNumber: turnCount, p1Move: null, p2Move: null, stateAfter: state, logMessages: [finalReason]});
        break;
      }

      // Evaluate P2
      const p2Result = await evaluateAgentMove(agent2.code, state);
      if (!p2Result.success) {
        finalWinner = "p1";
        finalReason = `Agent 2 crashed: ${p2Result.error}`;
        logs.push({ turnNumber: turnCount, p1Move: p1Result.returnValue, p2Move: null, stateAfter: state, logMessages: [finalReason]});
        break;
      }

      const p1RawMove = p1Result.returnValue;
      const p2RawMove = p2Result.returnValue;

      // Validate Moves
      const p1Move = engine.validateMove(state, p1RawMove, "p1");
      const p2Move = engine.validateMove(state, p2RawMove, "p2");

      turnLogMessages.push(`[${agent1.name}] evaluated: ${JSON.stringify(p1Move)}`);
      turnLogMessages.push(`[${agent2.name}] evaluated: ${JSON.stringify(p2Move)}`);

      if (p1Result.logs.length > 0) turnLogMessages.push(`[${agent1.name} Logs]: ${p1Result.logs.join(", ")}`);
      if (p2Result.logs.length > 0) turnLogMessages.push(`[${agent2.name} Logs]: ${p2Result.logs.join(", ")}`);

      // Compute Next State
      const computeResult = engine.computeNextState(state, p1Move, p2Move);
      state = computeResult.nextState;

      logs.push({
        turnNumber: turnCount,
        p1Move,
        p2Move,
        stateAfter: state,
        logMessages: turnLogMessages
      });

      if (computeResult.winner !== null) {
        isGameOver = true;
        
        if (computeResult.winner === "draw") {
          finalWinner = "draw";
        } else if (computeResult.winner === "p1") {
          finalWinner = "p1";
        } else if (computeResult.winner === "p2") {
          finalWinner = "p2";
        }
        
        finalReason = computeResult.reason || "Match resolved naturally";
      }
    }

    const result: MatchResult = {
      winnerId: finalWinner === "p1" ? agent1.id : finalWinner === "p2" ? agent2.id : null,
      reason: finalReason,
      turns: logs,
      finalState: state
    };

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Execute Match Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
