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
    <nav className="safe-bottom fixed inset-x-0 bottom-6 z-40 mx-auto max-w-[340px] px-4">
      <div className="relative flex items-center justify-between rounded-full border border-white/10 bg-black/75 p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-md">
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
            </button>
          );
        })}
      </div>
    </nav>
  );
}
