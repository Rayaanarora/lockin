"use client";

import React from "react";
import { Shield } from "lucide-react";
import { User } from "../app/types";

interface HeaderProps {
  user: User | null;
}

export default function Header({ user }: HeaderProps) {
  return (
    <header className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 pt-5 pb-2">
      <div className="flex flex-col">
        <span className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">
          Campus Execution Hub
        </span>
        <h1 className="text-2xl font-black tracking-tight text-white bg-clip-text">
          LOCKIN
        </h1>
      </div>

      <div className="flex items-center gap-1.5 rounded-full border border-boxGreen/30 bg-boxGreen/10 px-3 py-1.5 shadow-[0_0_20px_rgba(24,189,0,0.12)]">
        <Shield className="h-3.5 w-3.5 text-boxGreen animate-pulse" />
        <span className="text-xs font-black text-white tracking-wider">
          {user?.reputation_score ?? 0} PS
        </span>
      </div>
    </header>
  );
}
