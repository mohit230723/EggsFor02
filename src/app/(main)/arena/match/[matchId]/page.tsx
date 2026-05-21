'use client';

import React, { useState, useEffect, useRef, useCallback, use } from 'react';
import Link from 'next/link';
import { useAlgorandWallet } from '@/components/Providers';
import { OnChainMatch } from '@/lib/AgentRegistryClient';
import { Zap, Trophy, ExternalLink, ChevronRight } from 'lucide-react';

interface MatchTurn {
  turnNumber: number;
  p1Move: any;
  p2Move: any;
  stateAfter: any;
  logMessages: string[];
}

interface MatchResult {
  winnerId: string | null;
  reason: string;
  turns: MatchTurn[];
  finalState: any;
}

export default function MatchRoomPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { activeAddress, signTransaction } = useAlgorandWallet();
  const { matchId: matchIdStr } = use(params);
  const matchId = parseInt(matchIdStr, 10);

  const [match, setMatch] = useState<OnChainMatch | null>(null);
  const [myRole, setMyRole] = useState<'p1' | 'p2' | 'spectator'>('spectator');

  const [playbackTurns, setPlaybackTurns] = useState<MatchTurn[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isPlayingback, setIsPlayingback] = useState(false);
  const [simResult, setSimResult] = useState<MatchResult | null>(null);
  const [simError, setSimError] = useState('');

  const [settling, setSettling] = useState(false);
  const [settleTxId, setSettleTxId] = useState('');
  const [settleError, setSettleError] = useState('');
  const [loadingMatch, setLoadingMatch] = useState(true);

  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [playbackTurns]);

  // Load match data and determine role dynamically
  const loadMatchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoadingMatch(true);
    try {
      const res = await fetch('/api/match/list');
      const data = await res.json();
      const found = (data.matches || []).find((m: OnChainMatch) => m.matchId === matchId);
      if (found) {
        setMatch(found);
        // Check if user is participant
        if (activeAddress) {
          const agentRes = await fetch(`/api/agent/list?owner=${activeAddress}`);
          if (agentRes.ok) {
            const agentData = await agentRes.json();
            const ownedAddresses = (agentData.agents || []).map((a: any) => a.agentAddress.toLowerCase());
            if (ownedAddresses.includes(found.agentA.toLowerCase())) {
              setMyRole('p1');
            } else if (found.agentB && ownedAddresses.includes(found.agentB.toLowerCase())) {
              setMyRole('p2');
            } else {
              setMyRole('spectator');
            }
          } else {
            setMyRole('spectator');
          }
        } else {
          setMyRole('spectator');
        }
      }
    } catch (e) {
      console.error('Error loading match room data:', e);
    } finally {
      if (!isSilent) setLoadingMatch(false);
    }
  }, [matchId, activeAddress]);

  const checkExistingSimulation = useCallback(async () => {
    try {
      const res = await fetch(`/api/match/simulation?matchId=${matchId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.simulation) {
          const sim = data.simulation;
          const turns = sim.turns || [];
          setPlaybackTurns(turns);
          setSimResult({
            winnerId: sim.winner_id,
            reason: sim.reason,
            turns: turns,
            finalState: turns[turns.length - 1]?.stateAfter || null,
          });
        }
      }
    } catch (e) {
      console.error('Error checking existing simulation:', e);
    }
  }, [matchId]);

  useEffect(() => {
    loadMatchData();
    checkExistingSimulation();
  }, [loadMatchData, checkExistingSimulation]);

  // Polling setup: update room details if match not yet settled
  useEffect(() => {
    if (!match || match.status === 3) return;
    const interval = setInterval(() => {
      loadMatchData(true);
      if (!simResult) {
        checkExistingSimulation();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [match, loadMatchData, checkExistingSimulation, simResult]);

  const runSimulation = async () => {
    if (!match) return;
    setIsSimulating(true);
    setSimResult(null);
    setPlaybackTurns([]);
    setSimError('');
    setIsPlayingback(false);

    try {
      const res = await fetch('/api/arena/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: match.matchId,
          gameId: match.gameId,
          agent1Address: match.agentA,
          agent2Address: match.agentB,
        }),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error || 'Simulation failed');
      }

      setIsSimulating(false);
      setIsPlayingback(true);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';
        for (const part of parts) {
          const lines = part.split('\n');
          let eventType = '';
          let dataStr = '';
          for (const line of lines) {
            if (line.startsWith('event: ')) eventType = line.slice(7).trim();
            if (line.startsWith('data: ')) dataStr = line.slice(6).trim();
          }
          if (!dataStr) continue;
          try {
            const payload = JSON.parse(dataStr);
            if (eventType === 'turn') setPlaybackTurns(prev => [...prev, payload]);
            else if (eventType === 'result') {
              setIsPlayingback(false);
              setSimResult(payload);
            }
          } catch {}
        }
      }
      setIsPlayingback(false);
    } catch (err: any) {
      setSimError(err.message);
    } finally {
      setIsSimulating(false);
      setIsPlayingback(false);
    }
  };

  const handleSettle = async () => {
    if (!simResult || !match || !activeAddress) return;
    setSettling(true);
    setSettleError('');

    try {
      // Build settle txn using the backend resolver
      const buildRes = await fetch('/api/match/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callerAddress: activeAddress,
          matchId,
        }),
      });
      const buildData = await buildRes.json();
      if (!buildRes.ok) throw new Error(buildData.error);

      const algosdk = await import('algosdk');
      const txnsToSign = buildData.txns.map((b64: string) => ({
        txn: algosdk.decodeUnsignedTransaction(Buffer.from(b64, 'base64')),
      }));
      const signed = await signTransaction([txnsToSign]);

      const submitRes = await fetch('/api/match/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signedTxns: signed.map((s: Uint8Array) => Buffer.from(s).toString('base64')),
        }),
      });
      const submitData = await submitRes.json();
      if (!submitRes.ok) throw new Error(submitData.error);
      
      setSettleTxId(submitData.txId);
      loadMatchData(true);
    } catch (e: any) {
      setSettleError(e.message);
    } finally {
      setSettling(false);
    }
  };

  if (loadingMatch) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="font-mono text-streetGray animate-pulse uppercase tracking-widest">Loading match from chain...</p>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4">
        <div className="text-5xl">🔍</div>
        <p className="font-heading text-2xl uppercase">Match #{matchId} not found on chain</p>
        <Link href="/arena/lobby" className="punk-btn bg-punkYellow text-inkBlack px-6 py-3 font-heading">← Back to Lobby</Link>
      </div>
    );
  }

  const GAME_ICONS: Record<string, string> = { rps: '✊', tictactoe: '⬜', nim: '🪨' };
  const GAME_LABELS: Record<string, string> = { rps: 'Rock Paper Scissors', tictactoe: 'Tic-Tac-Toe', nim: 'Nim' };

  return (
    <div className="min-h-screen pb-24 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2 font-mono text-xs text-streetGray uppercase tracking-widest">
            <Link href="/arena" className="hover:text-punkPink transition-colors">Arena</Link>
            <span>/</span>
            <Link href="/arena/lobby" className="hover:text-punkPink transition-colors">Lobby</Link>
            <span>/</span>
            <span className="text-inkBlack">Match #{matchId}</span>
          </div>
          <h1 className="font-heading text-4xl md:text-5xl uppercase leading-none">
            <span className="text-3xl mr-2">{GAME_ICONS[match.gameId]}</span>
            <span className="bg-punkYellow px-2">{GAME_LABELS[match.gameId]}</span>
            <span className="block text-2xl mt-1 text-streetGray">MATCH #{matchId}</span>
          </h1>
        </div>
        <div className="punk-card bg-bgCream p-4 min-w-[200px]">
          <p className="font-mono text-xs text-streetGray uppercase tracking-widest mb-1">Prize Pool</p>
          <p className="font-heading text-3xl text-punkGreen">{(match.stakeAmount * 2).toFixed(1)} <span className="text-sm">ALGO</span></p>
          <p className="font-mono text-[10px] text-streetGray mt-1">
            Status: <span className="text-inkBlack font-bold">
              {match.status === 0 ? 'OPEN' : match.status === 1 ? 'BOTH JOINED' : match.status === 3 ? 'SETTLED' : 'ACTIVE'}
            </span>
          </p>
        </div>
      </div>

      {/* Agents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="punk-card bg-punkGreen/10 border-punkGreen p-5">
          <p className="font-mono text-[10px] text-streetGray uppercase tracking-widest mb-1">Agent P1</p>
          <p className="font-heading text-lg text-inkBlack">{match.agentA.slice(0, 12)}...{match.agentA.slice(-6)}</p>
          <p className="font-mono text-xs text-punkGreen mt-1">Stake: {match.stakeAmount} ALGO locked</p>
        </div>
        <div className={`punk-card p-5 ${match.agentB ? 'bg-punkBlue/10 border-punkBlue' : 'bg-bgCream border-dashed'}`}>
          <p className="font-mono text-[10px] text-streetGray uppercase tracking-widest mb-1">Agent P2</p>
          {match.agentB ? (
            <>
              <p className="font-heading text-lg text-inkBlack">{match.agentB.slice(0, 12)}...{match.agentB.slice(-6)}</p>
              <p className="font-mono text-xs text-punkBlue mt-1">Stake: {match.stakeAmount} ALGO locked</p>
            </>
          ) : (
            <div>
              <p className="font-heading text-lg text-streetGray">WAITING FOR CHALLENGER...</p>
              <Link href="/arena/lobby" className="font-mono text-xs text-punkPink hover:underline mt-1 block">← Join from lobby</Link>
            </div>
          )}
        </div>
      </div>

      {/* Status 0: Waiting for challenger */}
      {match.status === 0 && (
        <div className="punk-card bg-bgCream p-8 text-center space-y-3">
          <div className="text-5xl">⏳</div>
          <p className="font-heading text-xl uppercase text-inkBlack">Waiting for a challenger to join</p>
          <p className="font-mono text-xs text-streetGray">Share this page link to invite an opponent</p>
          <button
            onClick={() => navigator.clipboard.writeText(window.location.href)}
            className="punk-btn bg-white text-inkBlack px-4 py-2 font-heading text-sm"
          >
            📋 COPY ROOM LINK
          </button>
        </div>
      )}

      {/* Status 1: Both Joined, Game Ready to run */}
      {match.status === 1 && (
        <div className="space-y-6">
          {myRole === 'p1' ? (
            <div className="punk-card bg-bgCream p-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="font-heading text-xl uppercase tracking-widest text-inkBlack">
                    Run Simulation
                    <span className="font-jp text-sm text-punkPink opacity-60 ml-2">シミュレーション</span>
                  </h2>
                  <p className="font-mono text-xs text-streetGray mt-1">
                    As the Creator (P1), you must run the local sandbox battle simulation and settle results on-chain.
                  </p>
                </div>
                <button
                  onClick={runSimulation}
                  disabled={isSimulating || isPlayingback || simResult !== null}
                  className="punk-btn bg-punkYellow text-inkBlack px-5 py-2 font-heading text-sm flex items-center gap-2 disabled:opacity-40"
                >
                  {isSimulating ? <><span className="animate-spin">⟳</span> Running...</>
                    : isPlayingback ? <><span className="animate-pulse">◉</span> Streaming...</>
                    : <><Zap size={14} /> RUN BATTLE</>}
                </button>
              </div>
              {simError && <p className="font-mono text-xs text-punkRed">⚠ {simError}</p>}
            </div>
          ) : !simResult ? (
            <div className="punk-card bg-bgCream p-8 text-center space-y-3">
              <div className="text-4xl animate-pulse">⏳</div>
              <h2 className="font-heading text-xl uppercase tracking-widest text-inkBlack">
                Waiting for Battle
              </h2>
              <p className="font-mono text-xs text-streetGray max-w-md mx-auto">
                The match creator (P1) is running the battle simulation and settling the stakes on-chain.
                This page will update automatically once completed.
              </p>
            </div>
          ) : (
            <div className="punk-card bg-bgCream p-8 text-center space-y-3">
              <div className="text-4xl text-punkGreen">✓</div>
              <h2 className="font-heading text-xl uppercase tracking-widest text-inkBlack">
                Battle Simulation Completed
              </h2>
              <p className="font-mono text-xs text-streetGray max-w-md mx-auto">
                The simulation has run. Waiting for the match creator (P1) to submit the settlement transaction on-chain.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Status 3: Settled Match */}
      {match.status === 3 && (
        <div className="punk-card bg-bgCream border-punkGreen p-6 space-y-4 text-center">
          <div className="text-5xl">🏆</div>
          <h2 className="font-heading text-2xl uppercase tracking-widest text-inkBlack">
            Match Settled On-Chain
          </h2>
          <div className="max-w-md mx-auto p-4 border-3 border-inkBlack bg-white">
            <p className="font-mono text-xs text-streetGray uppercase tracking-widest mb-1">Winner</p>
            {match.winner ? (
              <>
                <p className="font-heading text-xl text-punkGreen uppercase">
                  {match.winner.toLowerCase() === match.agentA.toLowerCase() ? 'Agent P1 Wins!' : 'Agent P2 Wins!'}
                </p>
                <p className="font-mono text-[10px] text-streetGray mt-1 break-all">
                  {match.winner}
                </p>
              </>
            ) : (
              <p className="font-heading text-xl text-streetGray uppercase">🤝 Draw (Stakes Refunded)</p>
            )}
          </div>

          <div className="flex justify-center gap-3 mt-4 flex-wrap">
            <button
              onClick={runSimulation}
              disabled={isSimulating || isPlayingback}
              className="punk-btn bg-punkYellow text-inkBlack px-5 py-2 font-heading text-sm flex items-center gap-2 disabled:opacity-40"
            >
              {isSimulating ? <><span className="animate-spin">⟳</span> Running...</>
                : isPlayingback ? <><span className="animate-pulse">◉</span> Streaming...</>
                : <><Zap size={14} /> WATCH BATTLE REPLAY</>}
            </button>
            <Link href="/arena/lobby" className="punk-btn bg-white text-inkBlack px-5 py-2 font-heading text-sm flex items-center gap-2">
              ← BACK TO LOBBY
            </Link>
          </div>
        </div>
      )}

      {/* Live Telemetry / Playback Output */}
      {(playbackTurns.length > 0 || isSimulating || isPlayingback) && (
        <div className="punk-card bg-bgCream p-6">
          <h3 className="font-heading text-xl uppercase tracking-widest text-inkBlack mb-4 flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${isPlayingback ? 'bg-punkPink animate-ping' : 'bg-punkGreen'}`} />
            {isPlayingback ? 'Battle Live Stream' : 'Battle Telemetry'}
          </h3>

          <div
            ref={terminalRef}
            className="bg-inkBlack border-3 border-borderHard rounded-lg h-[340px] overflow-y-auto p-4 space-y-4 font-mono text-[11px] scroll-smooth"
          >
            {playbackTurns.map((turn, i) => {
              if (!turn) return null;
              return (
                <div key={i} className="border-b border-white/10 pb-3 text-left">
                  <div className="text-streetGray font-bold flex justify-between mb-1">
                    <span>=== ROUND {turn.turnNumber} ===</span>
                    {isPlayingback && i === playbackTurns.length - 1 && (
                      <span className="text-punkPink animate-pulse text-[10px]">● LIVE</span>
                    )}
                  </div>
                  <div className="flex gap-6 mb-2">
                    <span className="text-white/50">
                      Score: P1({(turn.stateAfter as any)?.p1Score ?? 0}) P2({(turn.stateAfter as any)?.p2Score ?? 0})
                    </span>
                    <span className="text-punkGreen">P1 → {JSON.stringify(turn.p1Move)}</span>
                    <span className="text-punkBlue">P2 → {JSON.stringify(turn.p2Move)}</span>
                  </div>
                  {turn.logMessages.map((log, li) => {
                    const isBrain = log.includes('[') && log.includes('Brain]');
                    return (
                      <div key={li} className={`ml-3 leading-relaxed ${isBrain ? 'text-punkPurple font-semibold' : 'text-punkYellow'}`}>
                        › {log}
                      </div>
                    );
                  })}
                </div>
              );
            })}
            {isPlayingback && (
              <div className="flex items-center gap-2 text-punkPink animate-pulse pl-2 text-left">
                <span className="w-2 h-2 rounded-full bg-punkPink animate-ping" />
                <span>Computing round {playbackTurns.length + 1}...</span>
              </div>
            )}
          </div>

          {simResult && (
            <div className="mt-6 p-5 border-3 border-inkBlack bg-white text-center">
              <p className="font-mono text-xs text-streetGray uppercase tracking-widest mb-2">Simulation Result</p>
              <p className="font-heading text-3xl text-inkBlack">
                {simResult.winnerId === 'p1' ? '🏆 AGENT P1 WINS!' : simResult.winnerId === 'p2' ? '🏆 AGENT P2 WINS!' : '🤝 DRAW'}
              </p>
              <p className="font-mono text-sm text-punkPink mt-2">{simResult.reason}</p>
            </div>
          )}
        </div>
      )}

      {/* Creator Settlement Action Panel (only visible when simulated, not yet settled, and creator) */}
      {simResult && match.status === 1 && myRole === 'p1' && (
        <div className="punk-card bg-bgCream border-punkYellow p-6 space-y-4">
          <h2 className="font-heading text-xl uppercase tracking-widest text-inkBlack">
            Settle On-Chain
            <span className="font-jp text-sm text-punkPink opacity-60 ml-2">清算</span>
          </h2>
          {!settleTxId ? (
            <>
              <p className="font-mono text-xs text-streetGray">
                The simulation is complete. Sign and submit the settlement transaction to record the winner on-chain
                and distribute <span className="text-punkGreen font-bold">{(match.stakeAmount * 2).toFixed(1)} ALGO</span> to the winner's wallet.
              </p>
              {settleError && <p className="font-mono text-xs text-punkRed">⚠ {settleError}</p>}
              {!activeAddress ? (
                <p className="font-mono text-xs text-punkRed">Connect wallet to settle</p>
              ) : (
                <button
                  onClick={handleSettle}
                  disabled={settling}
                  className="punk-btn bg-punkGreen text-inkBlack px-6 py-3 font-heading text-sm flex items-center gap-2 disabled:opacity-40"
                >
                  {settling ? <><span className="animate-spin">⟳</span> Settling...</> : <><Trophy size={14} /> SETTLE & PAY WINNER</>}
                </button>
              )}
            </>
          ) : (
            <div className="text-center py-4 space-y-3">
              <div className="text-5xl">🎉</div>
              <p className="font-heading text-2xl text-inkBlack uppercase">Match Settled On-Chain!</p>
              <a
                href={`https://testnet.explorer.perawallet.app/tx/${settleTxId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-punkBlue hover:text-punkPink transition-colors font-mono text-xs border-b border-punkBlue/40 pb-0.5"
              >
                <ExternalLink size={12} />
                Verify on Pera Explorer: {settleTxId.slice(0, 20)}...
              </a>
              <div>
                <Link href="/arena/lobby" className="punk-btn bg-punkYellow text-inkBlack px-6 py-3 font-heading text-sm inline-flex items-center gap-2 mt-2">
                  <ChevronRight size={14} />
                  BACK TO LOBBY
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
