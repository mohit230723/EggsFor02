"use client";

import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Wallet } from "lucide-react";
import type { WalletNodeData } from "../../types/nodes";
import { useAlgorandWallet } from "@/components/Providers";
import WalletConnectionModal from "@/components/WalletConnectionModal";

function WalletNodeComponent({ data }: NodeProps & { data: WalletNodeData }) {
  const { activeAddress } = useAlgorandWallet();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Use real address if available, otherwise fallback to data passed in
  const address = activeAddress || data.address;
  const isConnected = !!activeAddress || data.connected;

  const truncatedAddr = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "Click to Connect";

  return (
    <>
      <div 
        className="punk-card punk-card-pink node-appear min-w-[200px] cursor-pointer hover:scale-105 transition-transform"
        onClick={() => setIsModalOpen(true)}
      >
        {/* Header */}
        <div className="bg-punkPink px-4 py-2 flex items-center gap-2 border-b-3 border-inkBlack">
          <Wallet className="w-4 h-4 text-white" />
          <span className="font-heading text-xs text-white uppercase tracking-wider">
            Wallet
          </span>
          <span className="jp-accent-visible text-[10px] text-white/60 ml-auto">
            財布
          </span>
        </div>

        {/* Body */}
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-punkGreen" : "bg-punkRed"
              }`}
            />
            <span className="text-xs font-mono text-streetGray">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
          <div className="font-mono text-sm font-bold text-inkBlack bg-bgCream px-2 py-1 rounded border-2 border-borderSoft text-center">
            {truncatedAddr}
          </div>
        </div>

        {/* Output handle — connects to Agent */}
        <Handle
          type="source"
          position={Position.Right}
          id="wallet-out"
          className="!bg-punkYellow"
        />
      </div>

      <WalletConnectionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}

export const WalletNode = memo(WalletNodeComponent);
