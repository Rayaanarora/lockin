"use client";

import React from "react";
import { User } from "../app/types";
import { StagEmblem, LockinLogo } from "./ui/LockinLogo";

interface HeaderProps {
  user: User | null;
}

export default function Header({ user }: HeaderProps) {
  return (
    <header className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 pt-5 pb-3">
      <div className="flex items-center gap-2.5 md:hidden">
        <div className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-white/[0.08] bg-black/60 shadow-[0_0_16px_rgba(210,4,45,0.2)]">
          <StagEmblem size={20} className="text-white" />
        </div>
        <LockinLogo size="sm" />
      </div>
      <div className="hidden md:block" />

      <div className="aura-glow flex items-center gap-1.5 rounded-full border border-cherryRed/30 bg-cherryRed/[0.08] px-3.5 py-1.5">
        <img src="/aura-bolt.png" alt="" className="h-3.5 w-3.5 object-contain shrink-0 opacity-90" />
        <span className="text-[12px] font-black text-white tracking-wide">
          {user?.reputation_score ?? 0}
        </span>
        <span className="text-[10px] font-semibold text-cherryRed/80 tracking-wider">AURA</span>
      </div>
    </header>
  );
}
