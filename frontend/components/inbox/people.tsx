"use client";

import React from "react";

export function initials(name?: string | null) {
  if (!name) return "··";
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Square-ish avatar in the brand's sharp geometry: photo or initials. */
export function Avatar({
  name,
  src,
  size = 40,
  className = ""
}: {
  name?: string | null;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-[3px] border border-line bg-raised font-medium tracking-[0.04em] text-ink-2 ${className}`}
    >
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : initials(name)}
    </span>
  );
}

/** "@handle" when a username exists, otherwise nothing. */
export function Handle({ username, className = "" }: { username?: string | null; className?: string }) {
  if (!username) return null;
  return <span className={`text-ink-3 ${className}`}>@{username}</span>;
}

/** Relative time for list rows: "now", "4m", "3h", "Mon", "12 Oct". */
export function shortTime(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60e3) return "now";
  if (diff < 3600e3) return `${Math.floor(diff / 60e3)}m`;
  if (diff < 24 * 3600e3) return `${Math.floor(diff / 3600e3)}h`;
  if (diff < 6 * 24 * 3600e3) return d.toLocaleDateString(undefined, { weekday: "short" });
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}
