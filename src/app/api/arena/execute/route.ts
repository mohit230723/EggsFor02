import { evaluateAgentMove } from "@/lib/engine/sandbox";
import { rpsEngine } from "@/lib/games/rps";
import { tictactoeEngine } from "@/lib/games/tictactoe";
import { nimEngine } from "@/lib/games/nim";
import { Agent, MatchTurnLog } from "@/lib/engine/types";
import { createClient } from '@supabase/supabase-js';
import { decryptSkillCode } from '@/lib/encryption';
import { fetchSkillFromIPFS } from '@/lib/ipfs';
import { fetchAllSkills } from '@/lib/SkillMarketplaceClient';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ENGINES = {
  rps: rpsEngine,
  tictactoe: tictactoeEngine,
  nim: nimEngine,
};

function getDefaultCode(gameId: string): string {
  if (gameId === 'rps') return `const moves=["R","P","S"];return moves[Math.floor(Math.random()*3)];`;
  if (gameId === 'tictactoe') {
    return `const board=getState().board;const empty=board.map((v,i)=>v===null?i:-1).filter(i=>i>=0);return empty[Math.floor(Math.random()*empty.length)];`;
  }
  return `const r=getState().objectsRemaining;if(r<=3)return r===1?1:r-1;const m=r%4;if(m===0)return 3;if(m===3)return 2;if(m===2)return 1;return 1;`;
}

async function resolveAgentCodeOnServer(agentAddress: string, gameId: string): Promise<{ code: string; name: string }> {
  try {
    const { data: agent, error } = await supabase
      .from('agents')
      .select('*')
      .eq('agent_address', agentAddress)
      .single();

    if (error || !agent) {
      console.warn(`Agent ${agentAddress} not found in database, using default code.`);
      return { code: getDefaultCode(gameId), name: agentAddress.slice(0, 8) + '...' };
    }

    const name = agent.agent_name || (agentAddress.slice(0, 8) + '...');

    // Determine target skill types based on game
    let targetTypes: string[] = [];
    if (gameId === "rps") {
      targetTypes = ["Logic", "Prediction"];
    } else if (gameId === "tictactoe") {
      targetTypes = ["Strategy", "Compute"];
    } else if (gameId === "nim") {
      targetTypes = ["Compute", "State", "Strategy"];
    }

    const equippedIds = [agent.equipped_skill_1, agent.equipped_skill_2, agent.equipped_skill_3].filter(Boolean).map(String);
    if (equippedIds.length > 0) {
      const allSkills = await fetchAllSkills();
      const matchingSkill = allSkills.find(s => 
        equippedIds.includes(String(s.id)) && targetTypes.includes(s.skillType)
      );

      if (matchingSkill) {
        try {
          const encryptedContent = await fetchSkillFromIPFS(matchingSkill.ipcsCid);
          const decryptedSource = await decryptSkillCode(encryptedContent);
          return { code: decryptedSource, name };
        } catch (err) {
          console.error(`Failed to fetch/decrypt skill ${matchingSkill.id} for agent ${agentAddress}:`, err);
        }
      }
    }

    return { code: getDefaultCode(gameId), name };
  } catch (err) {
    console.error(`Error resolving code for agent ${agentAddress}:`, err);
    return { code: getDefaultCode(gameId), name: agentAddress.slice(0, 8) + '...' };
  }
}

function cleanParseJSON(text: string): any {
  let cleaned = text.trim();
  
  // Try to find markdown json block
  const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/;
  const match = cleaned.match(jsonBlockRegex);
  if (match) {
    cleaned = match[1].trim();
  } else {
    // If not found, try to find any code block
    const generalBlockRegex = /```\s*([\s\S]*?)\s*```/;
    const generalMatch = cleaned.match(generalBlockRegex);
    if (generalMatch) {
      cleaned = generalMatch[1].trim();
    }
  }

  // If we still can't parse it directly, find the first '{' and last '}'
  if (!cleaned.startsWith('{')) {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1).trim();
    }
  }

  return JSON.parse(cleaned);
}

// Highly token-optimized LLM prompt — only last 2 history entries included
async function queryLLMBrain(
  agentName: string,
  gameId: string,
  playerId: string,
  state: any,
  history: any[],
  sandboxMove: any
): Promise<{ move: any; reasoning: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("No GEMINI_API_KEY");

  const moveHints: Record<string, string> = {
    rps: "'R','P','S'",
    tictactoe: "0-8 (center=4)",
    nim: "1,2,3"
  };

  // Only send last 2 rounds of history to save tokens
  const recentHistory = history.slice(-2).map(h => ({
    t: h.turnNumber,
    p1: h.p1Move,
    p2: h.p2Move
  }));

  const prompt = `Agent:${agentName} Game:${gameId} Player:${playerId}
State:${JSON.stringify(state)} History(last2):${JSON.stringify(recentHistory)}
Skill suggested:${JSON.stringify(sandboxMove)}
Valid moves: ${moveHints[gameId] || "any"}
Override or accept skill move? Give brief reasoning and final move.
Respond ONLY with a JSON object: {"reasoning": "brief reasoning string", "move": "final move choice"}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              reasoning: { type: "STRING" },
              move: { description: "Final move: 'R'/'P'/'S' or number" }
            },
            required: ["reasoning", "move"]
          },
          maxOutputTokens: 120,
          temperature: 0.7,
          thinkingConfig: {
            thinkingBudget: 0
          }
        }
      })
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API failed: ${errText}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty Gemini response");

  const parsed = cleanParseJSON(text);
  let finalMove = parsed.move;
  if (gameId === "tictactoe" || gameId === "nim") {
    finalMove = Number(finalMove);
  }
  return { move: finalMove, reasoning: parsed.reasoning };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { gameId, agent1: inputAgent1, agent2: inputAgent2, agent1Address, agent2Address, matchId } = body;

    if (matchId !== undefined) {
      const { data: existingSim } = await supabase
        .from('match_simulations')
        .select('*')
        .eq('match_id', parseInt(matchId, 10))
        .single();
      
      if (existingSim) {
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            const send = (event: string, data: any) => {
              controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
            };

            const turns = existingSim.turns || [];
            for (const turn of turns) {
              send("turn", turn);
              await new Promise(resolve => setTimeout(resolve, 150));
            }

            send("result", {
              winnerId: existingSim.winner_id,
              reason: existingSim.reason,
              turns: turns,
              finalState: turns[turns.length - 1]?.stateAfter || null
            });
            controller.close();
          }
        });
        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
          }
        });
      }
    }

    if (!ENGINES[gameId as keyof typeof ENGINES]) {
      return new Response(JSON.stringify({ error: "Invalid Game ID" }), { status: 400 });
    }

    let agent1: Agent;
    let agent2: Agent;

    if (agent1Address) {
      const res = await resolveAgentCodeOnServer(agent1Address, gameId);
      agent1 = { id: 'p1', name: res.name, code: res.code };
    } else if (inputAgent1) {
      agent1 = inputAgent1;
    } else {
      return new Response(JSON.stringify({ error: "agent1 or agent1Address is required" }), { status: 400 });
    }

    if (agent2Address) {
      const res = await resolveAgentCodeOnServer(agent2Address, gameId);
      agent2 = { id: 'p2', name: res.name, code: res.code };
    } else if (inputAgent2) {
      agent2 = inputAgent2;
    } else {
      return new Response(JSON.stringify({ error: "agent2 or agent2Address is required" }), { status: 400 });
    }

    const engine: any = ENGINES[gameId as keyof typeof ENGINES];
    const hasApiKey = !!process.env.GEMINI_API_KEY;

    let state = engine.getInitialState();
    const logs: MatchTurnLog[] = [];
    let turnCount = 0;
    const MAX_TURNS = 20;
    let isGameOver = false;
    let finalWinner: string | null = null;
    let finalReason = "Max turns reached";

    while (!isGameOver && turnCount < MAX_TURNS) {
      turnCount++;
      const turnLogMessages: string[] = [];

      // ─── P1 SANDBOX ──────────────────────────────────────────────────
      const p1Result = await evaluateAgentMove(agent1.code, state, "p1", logs);
      if (!p1Result.success) {
        finalWinner = "p2";
        finalReason = `Agent 1 crashed: ${p1Result.error}`;
        const errTurn = { turnNumber: turnCount, p1Move: null, p2Move: null, stateAfter: state, logMessages: [finalReason] };
        logs.push(errTurn);
        break;
      }

      // ─── P2 SANDBOX ──────────────────────────────────────────────────
      const p2Result = await evaluateAgentMove(agent2.code, state, "p2", logs);
      if (!p2Result.success) {
        finalWinner = "p1";
        finalReason = `Agent 2 crashed: ${p2Result.error}`;
        const errTurn = { turnNumber: turnCount, p1Move: p1Result.returnValue, p2Move: null, stateAfter: state, logMessages: [finalReason] };
        logs.push(errTurn);
        break;
      }

      let p1Move = p1Result.returnValue;
      let p2Move = p2Result.returnValue;

      // ─── COGNITIVE LLM (PARALLEL) ─────────────────────────────────────
      if (hasApiKey) {
        // Run both agents in parallel to cut latency in half
        const [p1Cognition, p2Cognition] = await Promise.allSettled([
          queryLLMBrain(agent1.name, gameId, "p1", state, logs, p1Move),
          queryLLMBrain(agent2.name, gameId, "p2", state, logs, p2Move),
        ]);

        if (p1Cognition.status === "fulfilled") {
          p1Move = p1Cognition.value.move;
          turnLogMessages.push(`🧠 [${agent1.name}]: ${p1Cognition.value.reasoning}`);
        } else {
          turnLogMessages.push(`⚠️ [${agent1.name}]: Sandbox fallback. ${(p1Cognition.reason as Error)?.message}`);
        }

        if (p2Cognition.status === "fulfilled") {
          p2Move = p2Cognition.value.move;
          turnLogMessages.push(`🧠 [${agent2.name}]: ${p2Cognition.value.reasoning}`);
        } else {
          turnLogMessages.push(`⚠️ [${agent2.name}]: Sandbox fallback. ${(p2Cognition.reason as Error)?.message}`);
        }
      } else {
        turnLogMessages.push(`ℹ️ [System]: Sandbox mode (no API key).`);
      }

      const p1Validated = engine.validateMove(state, p1Move, "p1");
      const p2Validated = engine.validateMove(state, p2Move, "p2");

      turnLogMessages.push(`[${agent1.name}] → ${JSON.stringify(p1Validated)}`);
      turnLogMessages.push(`[${agent2.name}] → ${JSON.stringify(p2Validated)}`);

      if (p1Result.logs.length > 0) turnLogMessages.push(`[${agent1.name} sandbox]: ${p1Result.logs.join(", ")}`);
      if (p2Result.logs.length > 0) turnLogMessages.push(`[${agent2.name} sandbox]: ${p2Result.logs.join(", ")}`);

      const computeResult = engine.computeNextState(state, p1Validated, p2Validated);
      state = computeResult.nextState;

      const turnLog = {
        turnNumber: turnCount,
        p1Move: p1Validated,
        p2Move: p2Validated,
        stateAfter: state,
        logMessages: turnLogMessages
      };
      logs.push(turnLog);

      if (computeResult.winner !== null) {
        isGameOver = true;
        finalWinner = computeResult.winner === "draw" ? "draw"
          : computeResult.winner === "p1" ? "p1" : "p2";
        finalReason = computeResult.reason || "Match resolved naturally";
      }
    }

    // ─── SAVE TO SUPABASE IF MATCH ID IS PROVIDED ──────────────────────
    const finalWinnerId = finalWinner === "p1" ? agent1.id : finalWinner === "p2" ? agent2.id : null;
    if (matchId !== undefined) {
      const { error: saveError } = await supabase
        .from('match_simulations')
        .insert({
          match_id: parseInt(matchId, 10),
          winner_id: finalWinnerId,
          reason: finalReason,
          turns: logs
        });
      if (saveError) {
        console.error('Failed to save match simulation to Supabase:', saveError);
      }
    }

    // ─── SSE Streaming Response ────────────────────────────────────────────
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: any) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        for (const turn of logs) {
          send("turn", turn);
          await new Promise(resolve => setTimeout(resolve, 150));
        }

        // ─── STREAM FINAL RESULT ──────────────────────────────────────────
        send("result", {
          winnerId: finalWinnerId,
          reason: finalReason,
          turns: logs,
          finalState: state
        });

        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no"
      }
    });

  } catch (error: any) {
    console.error("Execute Match Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), { status: 500 });
  }
}
