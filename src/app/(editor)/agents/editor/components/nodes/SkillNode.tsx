"use client";

import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Code, ChevronDown, ChevronUp } from "lucide-react";
import type { SkillNodeData } from "../../types/nodes";

function SkillNodeComponent({ data }: NodeProps & { data: SkillNodeData }) {
  const [expanded, setExpanded] = useState(false);

  const typeColors: Record<string, string> = {
    Logic: "sticker-green",
    Compute: "sticker-blue",
    State: "sticker-purple",
    Data: "sticker-orange",
    Prediction: "sticker-pink",
    Strategy: "sticker-yellow",
  };

  return (
    <div className="punk-card punk-card-green node-appear min-w-[220px]">
      {/* Header */}
      <div className="bg-punkGreen px-4 py-2 flex items-center gap-2 border-b-3 border-inkBlack">
        <Code className="w-4 h-4 text-inkBlack" />
        <span className="font-heading text-xs text-inkBlack uppercase tracking-wider truncate max-w-[120px]">
          {data.name || "Skill"}
        </span>
        <span className="jp-accent-visible text-[10px] text-inkBlack/40 ml-auto">
          技能
        </span>
      </div>

      {/* Body */}
      <div className="p-4 space-y-2">
        {/* Type badge + version */}
        <div className="flex items-center gap-2">
          <span
            className={`sticker ${typeColors[data.type] || "sticker-dark"} !text-[9px] !py-0.5 !px-1.5 !transform-none`}
          >
            {data.type}
          </span>
          <span className="text-[10px] font-mono text-mutedText">
            v{data.version}
          </span>
        </div>

        {/* Description */}
        <p className="text-xs text-streetGray leading-snug line-clamp-2">
          {data.description}
        </p>

        {/* Entry point */}
        <div className="font-mono text-[11px] text-punkPurple bg-bgCream px-2 py-1 rounded border-2 border-borderSoft">
          ƒ {data.entry_point}()
        </div>

        {/* Expandable code preview */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-[10px] text-streetGray hover:text-punkPink transition-colors w-full"
        >
          {expanded ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
          {expanded ? "Hide Code" : "Show Code"}
        </button>

        {expanded && (
          <pre className="text-[10px] font-mono bg-inkBlack text-punkGreen p-2 rounded overflow-x-auto max-h-[120px] overflow-y-auto border-2 border-inkBlack">
            {data.code.source}
          </pre>
        )}
      </div>

      {/* Output handle — connects to Agent */}
      <Handle
        type="source"
        position={Position.Right}
        id="skill-out"
        className="!bg-punkYellow"
      />
    </div>
  );
}

export const SkillNode = memo(SkillNodeComponent);
