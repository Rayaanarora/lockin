"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CountUp, Skeleton } from "./ui/motion";
import { POINTS_NAME } from "../lib/brand";

interface HeatMapProps {
  userId: number;
  userJoinedAt?: string | Date;
  api: (path: string, options?: RequestInit) => Promise<any>;
}

interface ActivityData {
  date: string;
  missionsCompleted: number;
  focusMinutes: number;
  tasksCompleted: number;
  auraEarned: number;
}

/*
 * Sequential single-hue ramp (brand Crimson #B11226 at step 2), validated with
 * the dataviz validator in --ordinal mode against Surface #0C0C0C: monotone L,
 * ΔL ≥ 0.06, low end 2.06:1, hue spread 12°. Index 0 = no activity.
 */
const RAMP = ["rgb(var(--raised))", "#8C1020", "#B11226", "#D23548", "#E8677A", "#F6A3AE"];

const level = (count: number, minutes: number) => {
  if (count === 0 && minutes === 0) return 0;
  const score = count * 2 + Math.floor(minutes / 30);
  if (score <= 2) return 1;
  if (score <= 4) return 2;
  if (score <= 6) return 3;
  if (score <= 9) return 4;
  return 5;
};

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

export default function HeatMap({ userId, userJoinedAt, api }: HeatMapProps) {
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hover, setHover] = useState<{ date: Date; count: number; minutes: number; tasks: number; x: number; y: number } | null>(null);

  useEffect(() => {
    api(`/users/${userId}/heat`)
      .then(setActivities)
      .catch((err) => console.error("Failed to load heat map data:", err))
      .finally(() => setLoading(false));
  }, [userId]);

  // Weeks (columns) from join date, aligned to Sunday, through today. Always at least a year, so the grid fills its card.
  const weeks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let start = new Date(today);
    start.setDate(today.getDate() - 7 * 52);
    if (userJoinedAt) {
      const joined = new Date(userJoinedAt);
      joined.setHours(0, 0, 0, 0);
      if (joined < start) start = joined;
    }
    start.setDate(start.getDate() - start.getDay());
    const cols: Date[][] = [];
    const cur = new Date(start);
    while (cur <= today) {
      const week: Date[] = [];
      for (let i = 0; i < 7; i++) {
        week.push(new Date(cur));
        cur.setDate(cur.getDate() + 1);
      }
      cols.push(week);
    }
    return { cols, today };
  }, [userJoinedAt]);

  const byDay = useMemo(() => {
    const m = new Map<string, ActivityData>();
    activities.forEach((a) => m.set(dayKey(new Date(a.date)), a));
    return m;
  }, [activities]);

  const totalMissions = activities.reduce((s, a) => s + a.missionsCompleted, 0);
  const totalFocusHours = Math.round(activities.reduce((s, a) => s + a.focusMinutes, 0) / 60);
  const totalAura = activities.reduce((s, a) => s + a.auraEarned, 0);
  const activeDays = activities.filter((a) => a.missionsCompleted > 0).length;

  return (
    <div className="rounded-card border border-line bg-surface p-5">
      <div className="flex items-end justify-between">
        <div>
          <p className="t-label">Activity</p>
          <p className="t-display mt-1 text-title-2 text-ink">
            <CountUp value={activeDays} /> active days
          </p>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-1.5 text-caption text-ink-3" aria-hidden="true">
          Less
          {RAMP.map((c, i) => (
            <span key={i} className="h-3 w-3 rounded-[3px]" style={{ background: c }} />
          ))}
          More
        </div>
      </div>

      {loading ? (
        <Skeleton className="mt-5 h-[112px]" />
      ) : (
        <div data-heat-root className="relative mt-5" onMouseLeave={() => setHover(null)}>
          <div className="-mx-1 overflow-x-auto px-1 pb-1 scrollbar-none" dir="rtl">
            <div className="flex w-max gap-[3px] md:w-full md:justify-between" dir="ltr" role="img" aria-label={`${activeDays} active days, ${totalMissions} missions, ${totalFocusHours} focus hours`}>
              {weeks.cols.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((day) => {
                    if (day > weeks.today) return <span key={day.toISOString()} className="h-[13px] w-[13px]" />;
                    const a = byDay.get(dayKey(day));
                    const count = a?.missionsCompleted ?? 0;
                    const minutes = a?.focusMinutes ?? 0;
                    const lv = level(count, minutes);
                    const show = (e: React.SyntheticEvent<HTMLElement>) => {
                      const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      const p = (e.currentTarget.closest("[data-heat-root]") as HTMLElement).getBoundingClientRect();
                      setHover({ date: day, count, minutes, tasks: a?.tasksCompleted ?? 0, x: r.left - p.left + r.width / 2, y: r.top - p.top });
                    };
                    return (
                      <motion.span
                        key={day.toISOString()}
                        initial={{ opacity: 0, scale: 0.4 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: Math.min(1, wi * 0.012), duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        onMouseEnter={show}
                        onClick={show}
                        className={`h-[13px] w-[13px] cursor-pointer rounded-[3px] ring-offset-1 ring-offset-surface transition-shadow hover:ring-1 hover:ring-ink ${lv === 0 ? "border border-line" : ""} ${
                          lv === 5 ? "" : ""
                        }`}
                        style={{ background: RAMP[lv] }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="pointer-events-none absolute inset-0">
            <AnimatePresence>
              {hover && (
                <motion.div
                  key={hover.date.toISOString()}
                  initial={{ opacity: 0, y: 4, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.08 } }}
                  transition={{ duration: 0.14 }}
                  className="absolute z-30 w-max -translate-x-1/2 -translate-y-full rounded-lg border border-line bg-overlay px-3 py-2 text-footnote shadow-lift"
                  style={{ left: Math.max(70, hover.x), top: hover.y - 8 }}
                >
                  <p className="font-semibold text-ink">
                    {hover.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </p>
                  <p className="text-ink-2">
                    {hover.count === 0 && hover.minutes === 0
                      ? "No sessions"
                      : `${hover.count} mission${hover.count === 1 ? "" : "s"} · ${hover.minutes} min${hover.tasks ? ` · ${hover.tasks} tasks` : ""}`}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      <dl className="mt-5 grid grid-cols-3 divide-x divide-line border-t border-line pt-4 text-center">
        {[
          { label: "Missions", value: totalMissions, pre: "" },
          { label: "Hours", value: totalFocusHours, pre: "" },
          { label: POINTS_NAME, value: totalAura, pre: "+" }
        ].map((s) => (
          <div key={s.label}>
            <dt className="t-label">{s.label}</dt>
            <dd className={`t-display mt-1 text-title-2 ${s.label === POINTS_NAME ? "text-gold" : "text-ink"}`}>
              {s.pre}
              <CountUp value={s.value} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
