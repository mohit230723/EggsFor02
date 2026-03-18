import type { Metadata } from "next";
import { Inter, Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Futuristic Fluid Minimalism Typography
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

import Navbar from "@/components/Navbar";

import { Footer } from "@/components/Footer";
import BackgroundManager from "@/components/BackgroundManager";

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
        className={`${outfit.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased selection:bg-cyanGlow selection:text-spaceBlue`}
      >
        <BackgroundManager />
        <Navbar />
        <main className="min-h-screen flex flex-col pt-32 px-4 md:px-8 max-w-7xl mx-auto relative z-10">
          {children}
          <Footer />
        </main>
      </body>
    </html>
  );
}
