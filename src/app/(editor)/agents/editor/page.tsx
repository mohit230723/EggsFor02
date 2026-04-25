"use client";

import { useCallback, useRef, DragEvent } from "react";
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
  type Edge,
} from "@xyflow/react";
import { nodeTypes } from "./components/nodes";
import { NodeToolbar } from "./components/NodeToolbar";
import type {
  WalletNodeData,
  AgentNodeData,
  SkillNodeData,
  NodeType,
} from "./types/nodes";
import { VALID_CONNECTIONS } from "./types/nodes";

// ===== MOCK DATA =====

const mockSkillA: SkillNodeData = {
  cortex_skill_version: "1.0",
  name: "RPS Logic",
  type: "Logic",
  version: "1.0.0",
  description: "Rock-Paper-Scissors decision engine with pattern recognition",
  entry_point: "compute",
  parameters: {
    history: { type: "array", required: true },
    round: { type: "number", required: true },
  },
  code: {
    language: "javascript",
    source:
      'function compute({ history, round }) {\n  const moves = ["rock", "paper", "scissors"];\n  if (history.length === 0) return { move: moves[round % 3] };\n  const lastOpponent = history[history.length - 1].opponent;\n  const counter = { rock: "paper", paper: "scissors", scissors: "rock" };\n  return { move: counter[lastOpponent] };\n}',
  },
  metadata: {
    author: "cortex_dev",
    tags: ["rps", "strategy", "counter"],
    min_agent_version: "1.0",
  },
};

const mockSkillB: SkillNodeData = {
  cortex_skill_version: "1.0",
  name: "Nim Solver",
  type: "Compute",
  version: "2.1.0",
  description: "Optimal Nim game solver using XOR-based Sprague-Grundy theory",
  entry_point: "solve",
  parameters: {
    piles: { type: "array", required: true },
  },
  code: {
    language: "javascript",
    source:
      'function solve({ piles }) {\n  const xorSum = piles.reduce((a, b) => a ^ b, 0);\n  if (xorSum === 0) return { pile: 0, take: 1 };\n  for (let i = 0; i < piles.length; i++) {\n    const target = piles[i] ^ xorSum;\n    if (target < piles[i]) return { pile: i, take: piles[i] - target };\n  }\n  return { pile: 0, take: 1 };\n}',
  },
  metadata: {
    author: "math_wizard",
    tags: ["nim", "game-theory", "optimal"],
    min_agent_version: "1.0",
  },
};

const mockSkillC: SkillNodeData = {
  cortex_skill_version: "1.0",
  name: "TTT Engine",
  type: "Strategy",
  version: "1.2.0",
  description: "Minimax-based Tic-Tac-Toe engine with alpha-beta pruning",
  entry_point: "findMove",
  parameters: {
    board: { type: "array", required: true },
    player: { type: "string", required: true },
  },
  code: {
    language: "javascript",
    source:
      'function findMove({ board, player }) {\n  // Minimax with alpha-beta pruning\n  let bestScore = -Infinity;\n  let bestMove = 0;\n  for (let i = 0; i < 9; i++) {\n    if (!board[i]) {\n      board[i] = player;\n      const score = minimax(board, false, player);\n      board[i] = null;\n      if (score > bestScore) { bestScore = score; bestMove = i; }\n    }\n  }\n  return { position: bestMove };\n}',
  },
  metadata: {
    author: "alpha_coder",
    tags: ["ttt", "minimax", "ai"],
    min_agent_version: "1.0",
  },
};

const initialNodes: Node[] = [
  {
    id: "wallet-1",
    type: "wallet",
    position: { x: 50, y: 200 },
    data: {
      address: "ALGO7X3K9M2P4Q8R5T1V6W0Y",
      connected: true,
    } satisfies WalletNodeData,
  },
  {
    id: "agent-1",
    type: "agent",
    position: { x: 400, y: 80 },
    data: {
      name: "AlphaZero_v9",
      address: "AGNT9K2M5P8R1T4V7W0Y3X6Z",
      owner: "ALGO7X3K9M2P4Q8R5T1V6W0Y",
      skills: [mockSkillA],
      stats: { wins: 14, losses: 3, eggs: 140 },
      status: "deployed",
      code: { language: "javascript", source: mockSkillA.code.source },
    } satisfies AgentNodeData,
  },
  {
    id: "agent-2",
    type: "agent",
    position: { x: 400, y: 400 },
    data: {
      name: "NullSec_Bot",
      address: "AGNT2M5P8R1T4V7W0Y3X6Z9K",
      owner: "",
      skills: [],
      stats: { wins: 0, losses: 0, eggs: 0 },
      status: "idle",
      code: {
        language: "javascript",
        source: "// base agent logic — awaiting skill equip",
      },
    } satisfies AgentNodeData,
  },
  {
    id: "skill-1",
    type: "skill",
    position: { x: 50, y: 500 },
    data: mockSkillA,
  },
  {
    id: "skill-2",
    type: "skill",
    position: { x: 800, y: 50 },
    data: mockSkillB,
  },
  {
    id: "skill-3",
    type: "skill",
    position: { x: 800, y: 350 },
    data: mockSkillC,
  },
];

const initialEdges: Edge[] = [
  {
    id: "e-wallet1-agent1",
    source: "wallet-1",
    target: "agent-1",
    sourceHandle: "wallet-out",
    targetHandle: "agent-wallet-in",
    animated: true,
  },
  {
    id: "e-skill1-agent1",
    source: "skill-1",
    target: "agent-1",
    sourceHandle: "skill-out",
    targetHandle: "agent-skill-in",
  },
];

// ===== HELPERS =====

let nodeIdCounter = 100;

function getDefaultNodeData(type: NodeType) {
  switch (type) {
    case "wallet":
      return {
        address: "",
        connected: false,
      } satisfies WalletNodeData;
    case "agent":
      return {
        name: `Agent_${nodeIdCounter}`,
        address: "",
        owner: "",
        skills: [],
        stats: { wins: 0, losses: 0, eggs: 0 },
        status: "idle" as const,
        code: {
          language: "javascript",
          source: "// base agent logic — connect a skill",
        },
      } satisfies AgentNodeData;
    case "skill":
      return {
        cortex_skill_version: "1.0",
        name: "New Skill",
        type: "Logic" as const,
        version: "1.0.0",
        description: "A new skill — configure me",
        entry_point: "compute",
        parameters: {},
        code: {
          language: "javascript",
          source:
            "function compute(input) {\n  // your logic here\n  return { result: null };\n}",
        },
        metadata: {
          author: "unknown",
          tags: [],
          min_agent_version: "1.0",
        },
      } satisfies SkillNodeData;
  }
}

// ===== MAIN CANVAS =====

export default function NodeEditorPage() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Connection validation
  const isValidConnection = useCallback((connection: Connection | Edge) => {
    const sourceNode = initialNodes.find((n) => n.id === connection.source);
    const targetNode = initialNodes.find((n) => n.id === connection.target);
    if (!sourceNode || !targetNode) return true; // allow for dynamically added nodes

    const sourceType = sourceNode.type as NodeType;
    const targetType = targetNode.type as NodeType;

    return VALID_CONNECTIONS[sourceType]?.includes(targetType) ?? false;
  }, []);

  // Handle new connections
  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges]
  );

  // Handle drag over canvas
  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // Handle drop from toolbar
  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData(
        "application/reactflow"
      ) as NodeType;
      if (!type) return;

      // Get canvas position from mouse coordinates
      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!reactFlowBounds) return;

      const position = {
        x: event.clientX - reactFlowBounds.left - 100,
        y: event.clientY - reactFlowBounds.top - 40,
      };

      const newNode: Node = {
        id: `${type}-${++nodeIdCounter}`,
        type,
        position,
        data: getDefaultNodeData(type),
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  // MiniMap node color
  const nodeColor = (node: Node) => {
    switch (node.type) {
      case "wallet":
        return "#FF2D8A";
      case "agent":
        return "#9B30FF";
      case "skill":
        return "#39FF14";
      default:
        return "#1A1A1A";
    }
  };

  return (
    <div ref={reactFlowWrapper} className="w-screen h-screen relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        isValidConnection={isValidConnection}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        className="bg-bgCream"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1.5}
          color="rgba(26, 26, 26, 0.12)"
        />
        <Controls />
        <MiniMap
          nodeColor={nodeColor}
          nodeStrokeWidth={3}
          zoomable
          pannable
        />
      </ReactFlow>

      {/* Toolbar panel */}
      <NodeToolbar />

      {/* Top Right Overlay (Title & Back Button) */}
      <div className="absolute top-4 right-4 z-20 text-right flex flex-col items-end gap-3 hover:opacity-100">
        {/* Title overlay */}
        <div className="pointer-events-none">
          <h1 className="font-heading text-xl text-inkBlack opacity-60">
            CORTEX
          </h1>
          <span className="jp-accent-visible text-sm block opacity-60">ノードエディタ</span>
        </div>

        {/* Back button */}
        <div className="pointer-events-auto">
          <a href="/agents" className="inline-block">
            <button className="bg-inkBlack text-white border-2 border-transparent hover:border-punkPink font-mono text-sm px-4 py-2 flex items-center gap-2 hover:-translate-y-0.5 transition-all shadow-[4px_4px_0_#FF2D8A]">
              <span className="text-xl">←</span>
              <span>Back to Agents</span>
            </button>
          </a>
        </div>
      </div>
    </div>
  );
}
