'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAlgorandWallet } from '@/components/Providers';
import { GAME_TYPE_NAMES, OnChainMatch } from '@/lib/AgentRegistryClient';
import { Swords, Plus, RefreshCw, Zap, Clock, Trophy, ExternalLink } from 'lucide-react';

const GAME_ICONS: Record<string, string> = { rps: '✊', tictactoe: '⬜', nim: '🪨' };
const GAME_LABELS: Record<string, string> = { rps: 'Rock Paper Scissors', tictactoe: 'Tic-Tac-Toe', nim: 'Nim' };
const STATUS_LABELS: Record<number, string> = { 0: 'OPEN', 1: 'COMMITTED', 2: 'REVEALED', 3: 'SETTLED' };

interface AgentInfo { agentAddress: string; agentName: string; }

export default function MatchLobbyPage() {
  const { activeAddress, signTransaction } = useAlgorandWallet();
  const [matches, setMatches] = useState<OnChainMatch[]>([]);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [createGame, setCreateGame] = useState('rps');
  const [createAgent, setCreateAgent] = useState('');
  const [createStake, setCreateStake] = useState('1');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [matchRes, agentRes] = await Promise.all([
        fetch('/api/match/list'),
        activeAddress ? fetch(`/api/agent/list?owner=${activeAddress}`) : Promise.resolve(null),
      ]);
      if (matchRes.ok) {
        const d = await matchRes.json();
        setMatches(d.matches || []);
      }
      if (agentRes?.ok) {
        const d = await agentRes.json();
        setAgents(d.agents || []);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [activeAddress]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreateMatch = async () => {
    if (!activeAddress || !createAgent) return;
    setCreating(true);
    setError('');
    setSuccess('');
    try {
      let firstMove = 'R';
      if (createGame === 'tictactoe') firstMove = '4';
      else if (createGame === 'nim') firstMove = '1';

      // Get first move from agent (default for now — the match page handles full simulation)
      const res = await fetch('/api/match/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerAddress: activeAddress,
          agentAddress: createAgent,
          gameId: createGame,
          stakeAlgo: parseFloat(createStake),
          firstMove,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const algosdk = await import('algosdk');
      const txnsToSign = data.txns.map((b64: string) => ({
        txn: algosdk.decodeUnsignedTransaction(Buffer.from(b64, 'base64')),
      }));
      const signed = await signTransaction([txnsToSign]);
      const submitRes = await fetch('/api/skills/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedTxns: signed.map((s: Uint8Array) => Buffer.from(s).toString('base64')) }),
      });
      const submitData = await submitRes.json();
      if (!submitRes.ok) throw new Error(submitData.error);

      setSuccess(`✅ Match created! Tx: ${submitData.txId?.slice(0, 16)}...`);
      setShowCreate(false);
      setTimeout(() => loadData(), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleJoinMatch = async (match: OnChainMatch) => {
    if (!activeAddress) return;
    const myAgent = agents.find(a => a.agentAddress !== match.agentA);
    if (!myAgent) return setError('No available agents to join this match. You cannot battle with the same agent.');
    setJoining(match.matchId);
    setError('');
    setSuccess('');
    try {
      let firstMove = 'R';
      if (match.gameId === 'tictactoe') firstMove = '4';
      else if (match.gameId === 'nim') firstMove = '1';

      const res = await fetch('/api/match/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerAddress: activeAddress,
          agentAddress: myAgent.agentAddress,
          matchId: match.matchId,
          stakeAlgo: match.stakeAmount,
          firstMove,
          gameId: match.gameId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const algosdk = await import('algosdk');
      const txnsToSign = data.txns.map((b64: string) => ({
        txn: algosdk.decodeUnsignedTransaction(Buffer.from(b64, 'base64')),
      }));
      const signed = await signTransaction([txnsToSign]);
      const submitRes = await fetch('/api/skills/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedTxns: signed.map((s: Uint8Array) => Buffer.from(s).toString('base64')) }),
      });
      const submitData = await submitRes.json();
      if (!submitRes.ok) throw new Error(submitData.error);

      setSuccess(`✅ Joined match #${match.matchId}! Tx: ${submitData.txId?.slice(0, 16)}...`);
      setTimeout(() => loadData(), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setJoining(null);
    }
  };

  const openMatches = matches.filter(m => m.status === 0);
  const activeMatches = matches.filter(m => m.status === 1 || m.status === 2);
  const settledMatches = matches.filter(m => m.status === 3).slice(-5);

  return (
    <div className="min-h-screen pb-24 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/arena" className="text-streetGray hover:text-punkPink transition-colors font-mono text-xs uppercase tracking-widest">
              ← Arena
            </Link>
            <span className="text-streetGray">/</span>
            <span className="font-mono text-xs uppercase tracking-widest text-inkBlack">Match Lobby</span>
          </div>
          <h1 className="font-heading text-5xl md:text-6xl uppercase leading-none">
            <span className="block">MATCH</span>
            <span className="bg-punkPink px-3 block w-fit mt-1 text-white">LOBBY</span>
          </h1>
          <p className="font-mono text-xs text-streetGray uppercase tracking-widest mt-3">
            On-chain agent battles // Algorand Testnet // Stakes locked in contract
          </p>
        </div>
        <div className="flex gap-3 mt-2">
          <button
            onClick={loadData}
            className="punk-btn bg-white text-inkBlack px-4 py-2 font-heading text-sm flex items-center gap-2"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            REFRESH
          </button>
          {activeAddress && (
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="punk-btn bg-punkYellow text-inkBlack px-4 py-2 font-heading text-sm flex items-center gap-2"
            >
              <Plus size={14} />
              CREATE MATCH
            </button>
          )}
        </div>
      </div>

      {/* Status messages */}
      {error && (
        <div className="border-3 border-punkRed bg-punkRed/10 p-3 font-mono text-xs text-punkRed">
          ⚠ {error}
        </div>
      )}
      {success && (
        <div className="border-3 border-punkGreen bg-punkGreen/10 p-3 font-mono text-xs text-punkGreen">
          {success}
        </div>
      )}

      {/* Create Match Panel */}
      {showCreate && activeAddress && (
        <div className="punk-card bg-bgCream border-punkYellow p-6 space-y-4">
          <h3 className="font-heading text-lg uppercase tracking-widest">New On-Chain Match</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-inkBlack mb-2 font-mono">Game</label>
              <select
                value={createGame}
                onChange={e => setCreateGame(e.target.value)}
                className="w-full border-3 border-inkBlack bg-white px-3 py-2 font-body text-sm focus:outline-none focus:border-punkYellow"
              >
                <option value="rps">✊ Rock Paper Scissors</option>
                <option value="tictactoe">⬜ Tic-Tac-Toe</option>
                <option value="nim">🪨 Nim</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-inkBlack mb-2 font-mono">Your Agent</label>
              <select
                value={createAgent}
                onChange={e => setCreateAgent(e.target.value)}
                className="w-full border-3 border-inkBlack bg-white px-3 py-2 font-body text-sm focus:outline-none focus:border-punkYellow"
              >
                <option value="">Select agent…</option>
                {agents.map(a => (
                  <option key={a.agentAddress} value={a.agentAddress}>{a.agentName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-inkBlack mb-2 font-mono">Stake (ALGO)</label>
              <input
                type="number"
                min="1"
                step="0.5"
                value={createStake}
                onChange={e => setCreateStake(e.target.value)}
                className="w-full border-3 border-inkBlack bg-white px-3 py-2 font-mono text-sm focus:outline-none focus:border-punkYellow"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCreateMatch}
              disabled={creating || !createAgent}
              className="punk-btn bg-punkYellow text-inkBlack px-6 py-3 font-heading text-sm flex items-center gap-2 disabled:opacity-40"
            >
              {creating ? <><span className="animate-spin">⟳</span> Creating...</> : <><Swords size={14} /> LOCK STAKE & CREATE</>}
            </button>
            <button onClick={() => setShowCreate(false)} className="punk-btn bg-white text-inkBlack px-4 py-3 font-heading text-sm">
              CANCEL
            </button>
          </div>
          <p className="text-xs font-mono text-streetGray">
            ⚠ Staking {createStake} ALGO on-chain. Winner takes all. ~0.001 ALGO tx fee.
          </p>
        </div>
      )}

      {!activeAddress && (
        <div className="punk-card bg-bgCream border-inkBlack p-8 text-center">
          <div className="text-5xl mb-4">🔐</div>
          <p className="font-heading text-xl uppercase">Connect Wallet to Create or Join Matches</p>
          <p className="font-mono text-xs text-streetGray mt-2">You can still browse open matches below</p>
        </div>
      )}

      {/* Open Matches */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="font-heading text-2xl uppercase tracking-widest text-inkBlack">Open Matches</h2>
          <span className="bg-punkGreen text-inkBlack text-[9px] font-bold px-2 py-0.5 border-2 border-inkBlack uppercase font-mono">
            {openMatches.length} OPEN
          </span>
        </div>
        {loading && <p className="font-mono text-xs text-streetGray animate-pulse">Loading matches from chain...</p>}
        {!loading && openMatches.length === 0 && (
          <div className="punk-card bg-bgCream p-8 text-center">
            <div className="text-4xl mb-3">🏜️</div>
            <p className="font-heading text-lg uppercase text-inkBlack">No open matches</p>
            <p className="font-mono text-xs text-streetGray mt-1">Be the first to create one!</p>
          </div>
        )}
        <div className="space-y-3">
          {openMatches.map(match => (
            <div key={match.matchId} className="punk-card bg-white p-5 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <span className="text-3xl">{GAME_ICONS[match.gameId] || '🎮'}</span>
                <div>
                  <p className="font-heading text-sm uppercase tracking-widest text-inkBlack">
                    {GAME_LABELS[match.gameId] || match.gameId} · Match #{match.matchId}
                  </p>
                  <p className="font-mono text-xs text-streetGray mt-0.5">
                    Creator: {match.agentA.slice(0, 8)}...{match.agentA.slice(-4)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="font-mono text-xs text-streetGray uppercase">Stake</p>
                  <p className="font-heading text-lg text-punkGreen">{match.stakeAmount} ALGO</p>
                </div>
                <div className="text-center">
                  <p className="font-mono text-xs text-streetGray uppercase">Prize Pool</p>
                  <p className="font-heading text-lg text-inkBlack">{(match.stakeAmount * 2).toFixed(1)} ALGO</p>
                </div>
                {activeAddress && (
                  agents.some(a => a.agentAddress === match.agentA) ? (
                    agents.length > 1 ? (
                      <button
                        onClick={() => handleJoinMatch(match)}
                        disabled={joining === match.matchId}
                        className="punk-btn bg-punkPink text-white px-4 py-2 font-heading text-sm flex items-center gap-2"
                      >
                        {joining === match.matchId ? <span className="animate-spin">⟳</span> : <Zap size={14} />}
                        {joining === match.matchId ? 'Joining...' : 'JOIN BATTLE'}
                      </button>
                    ) : (
                      <span className="text-xs font-mono text-streetGray border border-dashed border-streetGray px-3 py-2">
                        YOUR MATCH
                      </span>
                    )
                  ) : (
                    <button
                      onClick={() => handleJoinMatch(match)}
                      disabled={joining === match.matchId || agents.length === 0}
                      className="punk-btn bg-punkPink text-white px-4 py-2 font-heading text-sm flex items-center gap-2 disabled:opacity-40"
                    >
                      {joining === match.matchId ? <span className="animate-spin">⟳</span> : <Zap size={14} />}
                      {joining === match.matchId ? 'Joining...' : 'JOIN BATTLE'}
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active / In Progress */}
      {activeMatches.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="font-heading text-2xl uppercase tracking-widest text-inkBlack">Active Matches</h2>
            <span className="bg-punkYellow text-inkBlack text-[9px] font-bold px-2 py-0.5 border-2 border-inkBlack uppercase font-mono animate-pulse">
              {activeMatches.length} LIVE
            </span>
          </div>
          <div className="space-y-3">
            {activeMatches.map(match => (
              <Link
                key={match.matchId}
                href={`/arena/match/${match.matchId}`}
                className="punk-card bg-punkYellow/10 border-punkYellow p-5 flex items-center justify-between flex-wrap gap-4 cursor-pointer hover:bg-punkYellow/20 transition-colors block"
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{GAME_ICONS[match.gameId] || '🎮'}</span>
                  <div>
                    <p className="font-heading text-sm uppercase tracking-widest text-inkBlack">
                      {GAME_LABELS[match.gameId] || match.gameId} · Match #{match.matchId}
                    </p>
                    <p className="font-mono text-xs text-streetGray">
                      {match.agentA.slice(0, 8)}... vs {match.agentB?.slice(0, 8)}...
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="bg-punkYellow text-inkBlack text-[9px] font-bold px-2 py-0.5 border-2 border-inkBlack uppercase font-mono">
                    {STATUS_LABELS[match.status]}
                  </span>
                  <span className="font-heading text-punkGreen">{(match.stakeAmount * 2).toFixed(1)} ALGO POOL</span>
                  <span className="font-mono text-xs text-punkBlue">ENTER ROOM →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Settled Matches */}
      {settledMatches.length > 0 && (
        <div>
          <h2 className="font-heading text-2xl uppercase tracking-widest text-inkBlack mb-4 flex items-center gap-3">
            <Trophy size={20} className="text-punkPurple" />
            Recent Results
          </h2>
          <div className="space-y-2">
            {settledMatches.map(match => (
              <div key={match.matchId} className="punk-card bg-white/60 p-4 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <span>{GAME_ICONS[match.gameId] || '🎮'}</span>
                  <p className="font-mono text-xs text-streetGray">
                    Match #{match.matchId} · {GAME_LABELS[match.gameId]}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs text-punkGreen">{match.stakeAmount * 2} ALGO settled</span>
                  <span className="bg-punkGreen/20 text-punkGreen text-[9px] font-bold px-2 py-0.5 border border-punkGreen uppercase font-mono">SETTLED</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
