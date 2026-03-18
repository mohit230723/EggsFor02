"use client";

import { usePathname } from "next/navigation";
import PillNav from "./ui/PillNav";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <div className="flex justify-center w-full relative h-[80px]">
      <PillNav
        logo="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEyIDJMMiA3bDEwIDUgMTAtNS0xMC01ek0yIDE3bDEwIDUgMTAtNU0yIDEybDEwIDUgMTAtNSIvPjwvc3ZnPg=="
        logoAlt="Cortex Logo"
        items={[
          { label: "Home", href: "/" },
          { label: "Arena", href: "/arena" },
          { label: "Predictions", href: "/predictions" },
          { label: "Marketplace", href: "/marketplace" },
          { label: "Agents", href: "/agents" },
        ]}
        activeHref={pathname}
        className="custom-nav"
        ease="power2.easeOut"
        baseColor="#0A0F1B" // deepNavy background base for pills
        pillColor="rgba(255, 255, 255, 0.05)" // translucent pill background
        hoveredPillTextColor="#0A0F1B" // hover text color (dark)
        pillTextColor="#F8FAFC" // default text color
        initialLoadAnimation={true}
      />
    </div>
  );
}
