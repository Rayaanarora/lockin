"use client";

import React from "react";
import { User } from "../app/types";
import { LockinLogo } from "./ui/LockinLogo";
import { CountUp } from "./ui/motion";
import { POINTS_NAME } from "../lib/brand";

interface HeaderProps {
  user: User | null;
}

export default function Header({ user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 mx-auto flex w-full max-w-2xl items-center justify-between border-b border-line bg-bg/95 px-5 pb-3 pt-[max(0.875rem,env(safe-area-inset-top))] backdrop-blur md:hidden">
      <LockinLogo size="sm" />

      <div className="flex items-baseline gap-2" aria-label={`${user?.reputation_score ?? 0} ${POINTS_NAME}`}>
        <CountUp value={user?.reputation_score ?? 0} className="text-headline font-medium text-ink" />
        <span className="t-label">{POINTS_NAME}</span>
      </div>
    </header>
  );
}
