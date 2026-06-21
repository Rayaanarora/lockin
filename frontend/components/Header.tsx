"use client";

import React from "react";
import { Shield } from "lucide-react";
import { User } from "../app/types";

interface HeaderProps {
  user: User | null;
  useNewUI?: boolean;
  setUseNewUI?: (value: boolean) => void;
}

export default function Header({ user, useNewUI, setUseNewUI }: HeaderProps) {
  return (
    <header className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 pt-5 pb-2">
      <div className="flex flex-col text-left">
        <span className="text-[9px] font-semibold tracking-[0.2em] text-zinc-500 uppercase">
          Campus Execution Hub
        </span>
        <div className="flex items-center gap-2 mt-1">
          <h1 className="text-2xl font-display font-black tracking-widest text-cotton drop-shadow-[0_2px_8px_rgba(237,235,222,0.15)]">
            LOCKIN
          </h1>
          {setUseNewUI && (
            <button
              onClick={() => setUseNewUI(!useNewUI)}
              className={`rounded-md px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider transition-all duration-300 border ${
                useNewUI
                  ? "border-luxuryGold bg-luxuryGold/10 text-luxuryGold shadow-[0_0_10px_rgba(197,168,128,0.25)] animate-pulse"
                  : "border-white/10 bg-zinc-950/40 text-zinc-500 hover:text-white hover:border-white/30"
              }`}
            >
              V3 Beta
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 rounded-full border border-luxuryGold/30 bg-luxuryGold/10 px-3 py-1.5 shadow-[0_0_20px_rgba(197,168,128,0.15)]">
        <Shield className="h-3.5 w-3.5 text-luxuryGold animate-pulse" />
        <span className="text-xs font-black text-cotton tracking-wider">
          {user?.reputation_score ?? 0} Aura
        </span>
      </div>
    </header>
  );
}
