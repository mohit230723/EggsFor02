"use client";

import { usePathname } from "next/navigation";
import FloatingLines from "./ui/FloatingLines";

export default function BackgroundManager() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  // Using the project's futuristic color palette
  // cyanGlow: #22D3EE, blueGlow: #3B82F6, purpleGlow: #A78BFA
  const palette = ["#22D3EE", "#3B82F6", "#A78BFA"];

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-spaceBlue">
      {/* 
          FloatingLines provides the animated mesh-like background.
          We use different densities and interactive settings based on the page.
      */}
      <div className="absolute inset-0 w-full h-full opacity-40">
        <FloatingLines 
          linesGradient={palette}
          enabledWaves={["top", "middle", "bottom"]}
          lineCount={isHome ? 8 : 4}
          lineDistance={isHome ? 6 : 4}
          interactive={true}
          parallax={true}
          parallaxStrength={0.15}
          animationSpeed={0.8}
          mixBlendMode="screen"
        />
      </div>
      
      {/* Subtle radial gradient to focus the center/top area */}
      <div 
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 20%, #3B82F622, transparent 70%)`
        }}
      />

      {/* Grain overlay (via globals.css body::before) handles the texture */}
    </div>
  );
}
