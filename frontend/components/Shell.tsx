"use client";
import React from "react";
import { motion } from "framer-motion";
import { Flame, Activity, User as UserIcon } from "lucide-react";
import { User } from "../app/types";

interface ShellProps {
  children: React.ReactNode;
  tab?: string;
  setTab?: (tab: string) => void;
  user?: User | null;
}

export default function Shell({ children, tab, setTab, user }: ShellProps) {
  const isDesktopDashboard = !!user && !!tab && !!setTab;

  return (
    <div className="min-h-screen w-full bg-[#030303] flex items-center justify-center p-0 overflow-hidden">
      {/* Main Content Box */}
      <main 
        className={`relative flex text-white antialiased bg-black overflow-hidden
          ${isDesktopDashboard 
            ? "h-screen w-full md:flex-row" 
            : "h-screen w-full md:h-[850px] md:max-w-[420px] md:flex-col md:rounded-[40px] md:border md:border-white/10 md:shadow-[0_24px_80px_rgba(0,0,0,0.85)] md:ring-1 md:ring-white/5"
          }
        `}
      >
        {/* Background Grid Noise */}
        <div className="grid-noise pointer-events-none absolute inset-0 opacity-[0.85] mix-blend-overlay" />

        {/* Cyber/Race Stripe */}
        <div className="race-stripe pointer-events-none absolute left-0 right-0 top-0 h-[3px] opacity-100 shadow-[0_1px_10px_rgba(245,38,1,0.5)] z-50" />

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
          className="pointer-events-none absolute right-1/4 bottom-10 h-80 w-80 rounded-full bg-boxRed/4 blur-[100px]"
          animate={{
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Desktop Sidebar */}
        {isDesktopDashboard && (
          <aside className="hidden md:flex w-80 shrink-0 flex-col justify-between border-r border-white/10 bg-zinc-950/40 p-8 backdrop-blur-xl z-20">
            <div className="space-y-10 text-left">
              {/* Logo / Brand */}
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/50 p-1 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                  <img src="/logo.png" alt="LOCKIN Logo" className="h-full w-full object-contain" />
                </div>
                <div>
                  <span className="text-[9px] font-medium tracking-[0.2em] text-zinc-500 uppercase block">
                    Campus Execution Hub
                  </span>
                  <h1 className="text-2xl font-display font-semibold tracking-tight text-white leading-none mt-0.5">
                    LOCKIN
                  </h1>
                </div>
              </div>

              {/* Navigation Menu */}
              <nav className="space-y-2">
                {[
                  { key: "feed", label: "Missions Feed", icon: Flame, color: "text-boxRed" },
                  { key: "active", label: "Active Queue", icon: Activity, color: "text-boxOrange" },
                  { key: "profile", label: "Execution Center", icon: UserIcon, color: "text-boxRed" }
                ].map((item) => {
                  const isActive = tab === item.key;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setTab(item.key)}
                      className={`flex w-full items-center gap-4 rounded-xl border px-5 py-3.5 text-xs md:text-sm font-sans font-medium transition outline-none select-none
                        ${isActive 
                          ? "border-white/10 bg-white/5 text-white" 
                          : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/2"
                        }
                      `}
                    >
                      <Icon className={`h-4.5 w-4.5 md:h-5 md:w-5 transition-colors ${isActive ? item.color : "text-zinc-500"}`} />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* User Details Widget */}
            <div className="rounded-2xl border border-white/5 bg-zinc-900/35 p-5 text-left">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-black text-white">
                  {user.name ? user.name.split(" ").map(p => p[0]).join("").slice(0,2).toUpperCase() : "??"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs md:text-sm font-sans font-semibold text-white truncate">{user.name}</p>
                  <p className="text-[9px] md:text-xs font-sans font-medium text-boxOrange mt-1 flex items-center gap-1 leading-none">
                    <img src="/aura-bolt.png" alt="Aura" className="h-3.5 w-3.5 object-contain shrink-0" />
                    <span>{user.reputation_score ?? 0} Aura</span>
                  </p>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Main Content (Inner Scrollable container) */}
        <div className="relative z-10 flex flex-1 flex-col overflow-y-auto pb-24 md:pb-6 scrollbar-none">
          {children}
        </div>
      </main>
    </div>
  );
}
