"use client";

import React from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";

export default function LockScreen() {
  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-6 backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="max-w-sm rounded-2xl border border-white/5 bg-zinc-950/60 p-8 text-center shadow-2xl backdrop-blur-md"
      >
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-boxRed/35 bg-boxRed/10 shadow-[0_0_50px_rgba(245,38,1,0.3)]">
          <Lock className="h-9 w-9 text-boxRed animate-pulse" />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-white leading-tight">
          LOCKED OUT
        </h2>
        <p className="mt-3 text-sm font-medium text-zinc-400 leading-relaxed">
          You have reached the limit of <span className="font-bold text-white">3 active accepted missions</span>. 
        </p>
        <p className="mt-2 text-xs font-semibold text-zinc-500">
          Go execute your missions and mark attendance on your queue to unlock the discovery feed.
        </p>
      </motion.div>
    </motion.div>
  );
}
