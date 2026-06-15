"use client";

import React from "react";
import { User } from "../app/types";

interface HeaderProps {
  user: User | null;
}

export default function Header({ user }: HeaderProps) {
  return (
    <header className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 pt-5 pb-2 md:hidden">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/50 p-1 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
          <img src="/logo.png" alt="LOCKIN Logo" className="h-full w-full object-contain" />
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-medium tracking-[0.2em] text-zinc-500 uppercase block">
            Campus Execution Hub
          </span>
          <h1 className="text-lg font-display font-semibold tracking-tight text-white leading-none mt-0.5">
            LOCKIN
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-1.5 rounded-full border border-boxOrange/30 bg-boxOrange/8 px-3 py-1.5">
        <img src="/aura-bolt.png" alt="Aura" className="h-4 w-4 object-contain shrink-0" />
        <span className="text-xs font-sans font-semibold text-white tracking-tight">
          {user?.reputation_score ?? 0} Aura
        </span>
      </div>
    </header>
  );
}
