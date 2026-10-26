"use client";

import React from "react";
import { User } from "../app/types";
import { LockinLogo } from "./ui/LockinLogo";
import { CountUp } from "./ui/motion";
import { POINTS_NAME } from "../lib/brand";
import { Bell } from "lucide-react";
import { UnreadBadge } from "./Nav";

interface HeaderProps {
  user: User | null;
  unreadNotes?: number;
  onBell?: () => void;
  active?: boolean;
}

export default function Header({ user, unreadNotes = 0, onBell, active = false }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 mx-auto flex w-full max-w-2xl items-center justify-between border-b border-line bg-bg/95 px-5 pb-3 pt-[max(0.875rem,env(safe-area-inset-top))] backdrop-blur md:hidden">
      <LockinLogo size="sm" />

      <div className="flex items-center gap-4">
        <div className="flex items-baseline gap-2" aria-label={`${user?.reputation_score ?? 0} ${POINTS_NAME}`}>
          <CountUp value={user?.reputation_score ?? 0} className="text-headline font-medium text-ink" />
          <span className="t-label">{POINTS_NAME}</span>
        </div>
        {onBell && (
          <button
            type="button"
            onClick={onBell}
            aria-label={unreadNotes > 0 ? `Notifications, ${unreadNotes} new` : "Notifications"}
            aria-current={active ? "page" : undefined}
            className={`relative -mr-2 flex h-11 w-11 items-center justify-center transition-colors ${active ? "text-ink" : "text-ink-2 hover:text-ink"}`}
          >
            <Bell className="h-[22px] w-[22px]" strokeWidth={1.5} />
            {unreadNotes > 0 && <UnreadBadge n={unreadNotes} className="absolute right-1 top-1.5" />}
          </button>
        )}
      </div>
    </header>
  );
}
