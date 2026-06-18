"use client";

import React from "react";
import { Flame, Activity, User as UserIcon, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface NavProps {
  tab: string;
  setTab: (tab: string) => void;
}

export default function Nav({ tab, setTab }: NavProps) {
  const items = [
    { key: "feed", label: "Missions", icon: Flame, color: "text-cherryRed" },
    { key: "discover", label: "Discover", icon: Sparkles, color: "text-luxuryGold" },
    { key: "active", label: "Queue", icon: Activity, color: "text-cotton" },
    { key: "profile", label: "Execution", icon: UserIcon, color: "text-luxuryGold" }
  ] as const;

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-6 z-40 mx-auto max-w-[380px] px-4">
      <div className="relative flex items-center justify-between rounded-full border border-luxuryMaroon/25 bg-[#1B1716]/80 p-1.5 shadow-[0_24px_64px_rgba(0,0,0,0.6)] backdrop-blur-lg">
        {items.map(({ key, label, icon: Icon, color }) => {
          const isActive = tab === key;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="relative flex flex-1 flex-col items-center justify-center py-2 text-center outline-none transition"
            >
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 -z-10 rounded-full bg-cherryRed/10 border border-cherryRed/20"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Icon
                className={`h-5 w-5 transition-colors duration-200 ${
                  isActive ? color : "text-zinc-600 hover:text-zinc-400"
                }`}
              />
              <span
                className={`mt-1 text-[9px] font-black uppercase tracking-wider transition-colors duration-200 ${
                  isActive ? "text-cotton" : "text-zinc-600"
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
