"use client";

import React from "react";
import { motion } from "framer-motion";

interface ShellProps {
  children: React.ReactNode;
}

export default function Shell({ children }: ShellProps) {
  return (
    <div className="min-h-screen w-full bg-[#030303] flex items-center justify-center p-0 md:py-8 md:px-4 overflow-hidden">
      {/* Centered phone frame mockup on desktop */}
      <main className="relative flex h-screen md:h-[850px] w-full max-w-[420px] flex-col overflow-hidden bg-black text-white antialiased md:rounded-[40px] md:border md:border-white/10 md:shadow-[0_24px_80px_rgba(0,0,0,0.85)] md:ring-1 md:ring-white/5">
        {/* Background Grid Noise */}
        <div className="grid-noise pointer-events-none absolute inset-0 opacity-[0.85] mix-blend-overlay" />

        {/* Cyber/Race Stripe */}
        <div className="race-stripe pointer-events-none absolute left-0 right-0 top-0 h-[3px] opacity-100 shadow-[0_1px_10px_rgba(245,38,1,0.5)]" />

        {/* Glow Orbs */}
        <motion.div
          className="pointer-events-none absolute -right-36 top-12 h-96 w-96 rounded-full bg-boxRed/15 blur-[120px]"
          animate={{
            y: [0, 30, 0],
            opacity: [0.4, 0.8, 0.4],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="pointer-events-none absolute -left-24 bottom-32 h-[450px] w-[450px] rounded-full bg-boxOrange/12 blur-[140px]"
          animate={{
            y: [0, -40, 0],
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.05, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="pointer-events-none absolute right-1/4 bottom-10 h-80 w-80 rounded-full bg-boxGreen/8 blur-[100px]"
          animate={{
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Main Content (Inner Scrollable container) */}
        <div className="relative z-10 flex flex-1 flex-col overflow-y-auto pb-24 scrollbar-none">
          {children}
        </div>
      </main>
    </div>
  );
}
