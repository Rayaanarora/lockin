"use client";

import React from "react";
import { Flame, Activity, User as UserIcon } from "lucide-react";
import { motion } from "framer-motion";

interface NavProps {
  tab: string;
  setTab: (tab: string) => void;
}

export default function Nav({ tab, setTab }: NavProps) {
  const items = [
    { key: "feed", label: "Missions", icon: Flame, color: "text-boxRed" },
    { key: "active", label: "Queue", icon: Activity, color: "text-boxOrange" },
    { key: "profile", label: "Execution", icon: UserIcon, color: "text-boxGreen" }
  ] as const;

  return (
    <nav className="safe-bottom absolute inset-x-0 bottom-6 z-40 mx-auto max-w-[340px] px-4">
      <div className="relative flex items-center justify-between rounded-full border border-white/10 bg-black/80 p-1.5 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] backdrop-blur-lg">
        {items.map(({ key, label, icon: Icon, color }) => {
          const isActive = tab === key;
          return (
            <motion.button
              key={key}
              onClick={() => setTab(key)}
              whileTap={{ scale: 0.92 }}
              className="relative flex flex-1 flex-col items-center justify-center py-2 text-center outline-none transition"
            >
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 -z-10 rounded-full bg-white/5 border border-white/10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Icon
                className={`h-5 w-5 transition-colors duration-200 ${
                  isActive ? color : "text-zinc-500 hover:text-zinc-300"
                }`}
              />
              <span
                className={`mt-1 text-[9px] font-black uppercase tracking-wider transition-colors duration-200 ${
                  isActive ? "text-white" : "text-zinc-600"
                }`}
              >
                {label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
