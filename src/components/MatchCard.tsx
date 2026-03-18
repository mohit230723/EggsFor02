"use client";

import React from "react";
import Link from "next/link";
import SpotlightCard from "./ui/SpotlightCard";
import ElectricBorder from "./ui/ElectricBorder";
import { Badge } from "./ui/Badge";

export type MatchStatus = "LIVE" | "BETTING" | "WAITING";

export interface MatchCardProps {
  status: MatchStatus;
  gameType: string;
  stake: string;
  p1: { name: string; winRate: string };
  p2: { name: string; winRate: string };
  href?: string;
  className?: string;
}

const STATUS_CONFIG = {
  LIVE: {
    color: "#22D3EE",
    speed: 1.5,
    chaos: 0.12,
    badgeColor: "cyan" as const,
    label: "LIVE"
  },
  BETTING: {
    color: "#A78BFA",
    speed: 0.8,
    chaos: 0.06,
    badgeColor: "purple" as const,
    label: "BETTING"
  },
  WAITING: {
    color: "#F8FAFC",
    speed: 0.4,
    chaos: 0.02,
    badgeColor: "gray" as const,
    label: "WAITING"
  }
};

function hexToSpotlightRgba(hex: string, alpha: number): `rgba(${number}, ${number}, ${number}, ${number})` {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const int = parseInt(h, 16);
  return `rgba(${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}, ${alpha})` as const;
}

export function MatchCard({
  status,
  gameType,
  stake,
  p1,
  p2,
  href = "/arena",
  className = ""
}: MatchCardProps) {
  const config = STATUS_CONFIG[status];
  const isWaiting = status === "WAITING";

  return (
    <ElectricBorder
      color={config.color}
      speed={config.speed}
      chaos={config.chaos}
      borderRadius={32}
      className={`${className} ${isWaiting ? "opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500" : ""}`}
    >
      <SpotlightCard 
        className="p-8 border-none bg-white/[0.01] backdrop-blur-md relative overflow-hidden" 
        spotlightColor={hexToSpotlightRgba(config.color, 0.1)}
      >
        {/* Status Indication */}
        <div 
          className="absolute top-0 right-0 font-mono px-3 py-1 text-[10px] tracking-widest rounded-bl-xl uppercase z-20"
          style={{ background: `${config.color}33`, color: config.color }}
        >
          {config.label}
          {status === "LIVE" && (
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-current ml-2 animate-pulse" />
          )}
        </div>

        {/* Header Info */}
        <div className="flex justify-between items-center mb-6 mt-2 relative z-10">
          <Badge label={gameType} color="gray" />
          <span className="text-smoke text-xs font-mono">{stake}</span>
        </div>
        
        {/* Versus Section */}
        <div className="flex justify-between items-center relative z-10">
          <div className="text-center w-2/5 min-w-0">
            <p className="text-softWhite font-body font-bold truncate">{p1.name}</p>
            <p className="text-smoke text-[10px] font-mono mt-1">{p1.winRate} WR</p>
          </div>
          
          <div className="w-1/5 text-center font-heading text-xl italic opacity-50" style={{ color: config.color }}>
            VS
          </div>
          
          <div className="text-center w-2/5 min-w-0">
            {isWaiting && p2.name === "Open Slot" ? (
              <p className="text-white/20 font-body italic text-sm">Open Slot</p>
            ) : (
              <>
                <p className="text-softWhite font-body font-bold truncate">{p2.name}</p>
                <p className="text-smoke text-[10px] font-mono mt-1">{p2.winRate} WR</p>
              </>
            )}
          </div>
        </div>
        
        {/* Action Button / Link */}
        <div className="mt-8 relative z-10">
          {status === "BETTING" ? (
            <div className="flex gap-4">
              <button className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] uppercase tracking-widest py-2 rounded-full transition-colors" style={{ color: config.color }}>
                Bet {p1.name.split('_')[0]}
              </button>
              <button className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] uppercase tracking-widest py-2 rounded-full transition-colors" style={{ color: config.color }}>
                Bet {p2.name.split('_')[0]}
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <Link 
                href={href} 
                className={`text-[10px] uppercase tracking-[0.2em] hover:text-softWhite transition-colors ${isWaiting ? "text-smoke" : ""}`}
                style={!isWaiting ? { color: config.color } : {}}
              >
                {status === "LIVE" ? "Spectate Pulse →" : "Join Fight →"}
              </Link>
            </div>
          )}
        </div>

      </SpotlightCard>
    </ElectricBorder>
  );
}
