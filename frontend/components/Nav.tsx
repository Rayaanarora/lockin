"use client";

import React from "react";
import { Flame, Activity, User as UserIcon, Rss } from "lucide-react";
import { motion } from "framer-motion";
import { spring } from "../lib/motion";

interface NavProps {
  tab: string;
  setTab: (tab: string) => void;
}

export const NAV_ITEMS = [
  { key: "missions", label: "Missions", icon: Flame },
  { key: "feed", label: "Feed", icon: Rss },
  { key: "active", label: "Queue", icon: Activity },
  { key: "profile", label: "Profile", icon: UserIcon }
] as const;

/** Flat Void bar, hairline top edge, crimson line over the active tab. */
export default function Nav({ tab, setTab }: NavProps) {
  return (
    <nav
      aria-label="Primary"
      className="glass fixed inset-x-0 bottom-0 z-40 md:hidden pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      <div className="mx-auto flex max-w-[430px] items-stretch px-2">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
          const isActive = tab === key;
          return (
            <motion.button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              aria-current={isActive ? "page" : undefined}
              whileTap={{ scale: 0.95 }}
              transition={spring.snap}
              className="relative flex min-h-[60px] flex-1 flex-col items-center justify-center gap-1.5 outline-none"
            >
              {isActive && (
                <motion.span layoutId="nav-active" className="absolute inset-x-5 top-0 h-px bg-signal" transition={spring.glide} />
              )}
              <Icon className={`h-5 w-5 transition-colors duration-200 ${isActive ? "text-ink" : "text-ink-3"}`} strokeWidth={1.5} />
              <span
                className={`text-[10px] font-medium uppercase tracking-[0.2em] transition-colors duration-200 ${
                  isActive ? "text-ink" : "text-ink-3"
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
