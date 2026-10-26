"use client";

import React from "react";
import { motion } from "framer-motion";
import { spring } from "../../lib/motion";

/** Avatar wrapped in a crimson ring that fills to show progress through the current Aura tier. */
export function AuraAvatar({ src, initials, progress, size = 112 }: { src?: string | null; initials: string; progress: number; size?: number }) {
  const r = size / 2 - 3;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--line))" strokeWidth="3" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgb(var(--signal))"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - Math.min(1, Math.max(0, progress))) }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          
        />
      </svg>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={spring.pop}
        className="absolute inset-[9px] overflow-hidden rounded-full border border-line bg-raised"
      >
        {src ? (
          <img src={src} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="t-display flex h-full w-full items-center justify-center text-large-title text-ink">{initials}</span>
        )}
      </motion.div>
    </div>
  );
}
