"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAlgorandWallet } from "./Providers";
import WalletConnectionModal from "./WalletConnectionModal";
import WalletAccountModal from "./WalletAccountModal";

const NAV_ITEMS = [
  { label: "Home", href: "/", jp: "ホーム" },
  { label: "Arena", href: "/arena", jp: "アリーナ" },
  { label: "Predictions", href: "/predictions", jp: "予測" },
  { label: "Market", href: "/marketplace", jp: "市場" },
  { label: "Agents", href: "/agents", jp: "エージェント" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { activeAddress } = useAlgorandWallet();
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  // Helper to truncate address
  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bgCream/95 backdrop-blur-sm border-b-4 border-inkBlack">
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between h-20">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="font-heading text-2xl md:text-3xl text-inkBlack uppercase tracking-tight group-hover:text-punkPink transition-colors">
            CORTEX
          </span>
          <span className="font-jp text-xs text-punkPink font-bold opacity-60 hidden sm:inline">
            コーテックス
          </span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  relative px-4 py-2 font-body font-bold text-sm uppercase tracking-wider rounded-lg transition-all duration-200
                  ${isActive
                    ? "bg-inkBlack text-bgCream shadow-[3px_3px_0px_#FF2D8A]"
                    : "text-inkBlack hover:bg-punkPink/10 hover:text-punkPink"
                  }
                `}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Connect Wallet */}
        <div className="relative">
          <button 
            onClick={() => activeAddress ? setIsAccountOpen(true) : setIsConnectOpen(true)}
            className="punk-btn bg-punkYellow text-inkBlack px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border-3 border-inkBlack shadow-[4px_4px_0px_#1A1A1A] cursor-pointer font-heading"
          >
            {activeAddress ? truncateAddress(activeAddress) : "Connect Wallet"}
          </button>
        </div>
      </div>

      <WalletConnectionModal 
        isOpen={isConnectOpen} 
        onClose={() => setIsConnectOpen(false)} 
      />

      <WalletAccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
      />

      {/* Mobile Nav */}
      <div className="md:hidden flex overflow-x-auto gap-1 px-4 pb-3 -mt-1 scrollbar-hide">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                whitespace-nowrap px-3 py-1.5 font-body font-bold text-xs uppercase tracking-wider rounded-md transition-all
                ${isActive
                  ? "bg-inkBlack text-bgCream"
                  : "text-streetGray hover:text-punkPink"
                }
              `}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
