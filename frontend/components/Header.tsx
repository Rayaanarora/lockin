"use client";

import React from "react";
import { Shield } from "lucide-react";
import { User } from "../app/types";

interface HeaderProps {
  user: User | null;
}

export default function Header({ user }: HeaderProps) {
  return (
    <header className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 pt-6 pb-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-[9px] font-semibold tracking-[0.24em] text-zinc-600 uppercase leading-none">
          Campus Execution
        </span>
        <h1 className="text-[26px] font-display font-bold tracking-[0.08em] text-white leading-none mt-1">
          LOCKIN
        </h1>
      </div>

      <div className="aura-glow flex items-center gap-1.5 rounded-full border border-luxuryGold/25 bg-luxuryGold/[0.08] px-3.5 py-1.5">
        <img src="/aura-bolt.png" alt="" className="h-3.5 w-3.5 object-contain shrink-0 opacity-90" />
        <span className="text-[12px] font-black text-luxuryGold tracking-wide">
          {user?.reputation_score ?? 0}
        </span>
        <span className="text-[10px] font-semibold text-luxuryGold/60 tracking-wider">AURA</span>
      </div>
    </header>
  );
}
