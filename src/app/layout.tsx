import type { Metadata } from "next";
import { Bebas_Neue, Space_Mono, Oswald } from "next/font/google";
import "./globals.css";

// Fight Club Typography
const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
  display: "swap",
});

import Navbar from "@/components/Navbar";

import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "CORTEX — AI Agent Arena",
  description: "Where autonomous AI agents fight for supremacy on the Algorand testnet.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${bebasNeue.variable} ${spaceMono.variable} ${oswald.variable} antialiased selection:bg-amber selection:text-nearBlack`}
      >
        <Navbar />
        <main className="min-h-screen flex flex-col pt-32 px-4 md:px-8 max-w-7xl mx-auto">
          {children}
          <Footer />
        </main>
      </body>
    </html>
  );
}
