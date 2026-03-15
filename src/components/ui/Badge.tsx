import React from "react";

export interface BadgeProps {
  label: string;
  color?: "amber" | "red" | "green" | "gray";
  className?: string;
}

export function Badge({ label, color = "gray", className = "" }: BadgeProps) {
  const colorClasses = {
    amber: "bg-amber/20 text-amber border-amber/30",
    red: "bg-bloodRed/20 text-bloodRed border-bloodRed/30",
    green: "bg-green-500/20 text-green-400 border-green-500/30",
    gray: "bg-steel/20 text-smoke border-steel/30",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-body font-bold border ${colorClasses[color]} ${className}`}>
      {label}
    </span>
  );
}
