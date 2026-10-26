"use client";
import React from "react";
import { motion } from "framer-motion";
import { User } from "../app/types";
import { LockinLogo } from "./ui/LockinLogo";
import { CountUp } from "./ui/motion";
import { NAV_ITEMS, UnreadBadge } from "./Nav";
import { spring } from "../lib/motion";
import { POINTS_NAME } from "../lib/brand";

interface ShellProps {
  children: React.ReactNode;
  tab?: string;
  setTab?: (tab: string) => void;
  user?: User | null;
  unread?: number;
}

export default function Shell({ children, tab, setTab, user, unread = 0 }: ShellProps) {
  const isDesktopDashboard = !!user && !!tab && !!setTab;

  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-bg">
      <main
        className={`relative flex overflow-hidden bg-bg text-ink antialiased ${isDesktopDashboard
            ? "h-[100dvh] w-full md:flex-row"
            : "h-[100dvh] w-full md:h-[min(860px,92vh)] md:max-w-[430px] md:flex-col md:rounded-[40px] md:border md:border-line md:shadow-lift"
          }
        `}
      >
        {/* Atmosphere: static cherry vignette */}
        <div className="grid-noise pointer-events-none absolute inset-0 z-0" />

        {/* Lock line */}
        <motion.div
          className="race-stripe pointer-events-none absolute inset-x-0 top-0 z-50 h-[2px] origin-center"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* Desktop sidebar */}
        {isDesktopDashboard && (
          <aside className="z-20 hidden w-72 shrink-0 flex-col justify-between border-r border-line bg-surface/60 p-6 backdrop-blur-xl md:flex">
            <div className="space-y-10">
              <div className="pt-2">
                <LockinLogo size="md" />
                <p className="t-label mt-3">Campus execution network</p>
              </div>

              <nav aria-label="Primary" className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const isActive = tab === item.key;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setTab(item.key)}
                      aria-current={isActive ? "page" : undefined}
                      className={`group relative flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-subhead font-medium outline-none transition-colors duration-150 ${isActive ? "text-ink" : "text-ink-3 hover:bg-raised/60 hover:text-ink-2"}
                      `}
                    >
                      {isActive && (
                        <motion.span layoutId="sidebar-active" className="absolute inset-0 rounded-xl border border-line bg-raised" transition={spring.glide}>
                          <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-signal" />
                        </motion.span>
                      )}
                      <Icon className={`relative h-[18px] w-[18px] shrink-0 transition-colors ${isActive ? "text-crimson" : "text-ink-3 group-hover:text-ink-2"}`} />
                      <span className="relative flex-1 text-left">{item.label}</span>
                      {item.key === "inbox" && unread > 0 && <UnreadBadge n={unread} className="relative" />}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="surface p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-raised font-display text-title-3 font-bold text-ink">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    user.name?.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "??"
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-subhead font-semibold leading-tight text-ink">{user.name}</p>
                  {user.username && <p className="truncate text-footnote text-ink-3">@{user.username}</p>}
                  <p className="mt-1 flex items-center gap-1.5 text-footnote text-gold">
                    <CountUp value={user.reputation_score ?? 0} className="font-semibold" />
                    <span className="text-ink-3">{POINTS_NAME}</span>
                  </p>
                </div>
              </div>
            </div>
          </aside>
        )}

        <div className="relative z-10 flex h-full flex-1 flex-col overflow-y-auto scrollbar-none">{children}</div>
      </main>
    </div>
  );
}
