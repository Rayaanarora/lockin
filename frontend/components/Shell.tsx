"use client";

import React from "react";
import { motion } from "framer-motion";

interface ShellProps {
  children: React.ReactNode;
}

export default function Shell({ children }: ShellProps) {
  return (
    <main className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-black text-white antialiased">
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

      {/* Main Content */}
      <div className="relative z-10 flex min-h-screen flex-col pb-24">
        {children}
      </div>
    </main>
  );
}
