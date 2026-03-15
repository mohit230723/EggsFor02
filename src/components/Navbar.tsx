"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navLinks = [
  { name: "Arena", href: "/arena" },
  { name: "Predictions", href: "/predictions" },
  { name: "Marketplace", href: "/marketplace" },
  { name: "Agents", href: "/agents" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-5xl z-50">
      {/* Pill background */}
      <div className="bg-charcoal/80 backdrop-blur-md border border-steel/30 rounded-full px-6 py-3 flex items-center justify-between shadow-lg">
        
        {/* LOGO */}
        <Link 
          href="/" 
          className="font-heading text-3xl tracking-widest text-bone hover:text-amber transition-colors text-glow"
        >
          CORTEX
        </Link>

        {/* NAV LINKS & WALLET (DESKTOP) */}
        <div className="hidden md:flex items-center space-x-2">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`relative px-4 py-2 font-heading tracking-wider uppercase text-lg transition-all duration-300 rounded-full ${
                  isActive 
                    ? "text-nearBlack bg-amber" 
                    : "text-smoke hover:text-amber hover:bg-steel/20"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
          
          <div className="pl-4 border-l border-steel/30 ml-2">
            <button className="px-5 py-2 font-heading tracking-wider text-nearBlack bg-bone hover:bg-amber hover:shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-all duration-300 uppercase rounded-full text-sm">
              Connect Wallet
            </button>
          </div>
        </div>

        {/* MOBILE TOGGLE & WALLET */}
        <div className="flex md:hidden items-center space-x-3">
          <button className="px-3 py-1.5 font-heading tracking-wider text-nearBlack bg-bone hover:bg-amber transition-all duration-300 uppercase rounded-full text-xs">
            Connect
          </button>
          <button 
            className="text-bone p-1"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-charcoal border border-steel/30 rounded-2xl p-4 flex flex-col space-y-2 shadow-xl">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-4 py-3 font-heading tracking-wider uppercase text-xl rounded-xl ${
                  isActive 
                    ? "text-amber bg-steel/20" 
                    : "text-bone hover:text-amber"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
