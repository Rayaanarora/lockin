"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, Calendar } from "lucide-react";

interface HeatMapProps {
  userId: number;
  api: (path: string, options?: RequestInit) => Promise<any>;
}

interface ActivityData {
  date: string;
  missionsCompleted: number;
  focusMinutes: number;
  tasksCompleted: number;
  auraEarned: number;
}

export default function HeatMap({ userId, api }: HeatMapProps) {
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState<{
    date: Date;
    count: number;
    minutes: number;
    tasks: number;
  } | null>(null);

  useEffect(() => {
    async function fetchHeatData() {
      try {
        const data = await api(`/users/${userId}/heat`);
        setActivities(data);
      } catch (err) {
        console.error("Failed to load heat map data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchHeatData();
  }, [userId]);

  // Generate past 365 days of dates
  const generateYearDays = () => {
    const today = new Date();
    const days: Date[] = [];
    for (let i = 364; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      d.setHours(0, 0, 0, 0);
      days.push(d);
    }
    return days;
  };

  const yearDays = generateYearDays();
  const firstDayOfWeek = yearDays[0].getDay(); // Sunday=0, Monday=1...
  
  // Padding elements so Sunday starts on first row in grid-rows-7
  const padCount = firstDayOfWeek;

  // Helper to check if dates match
  const getActivityForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
    return activities.find(a => {
      const dbDateStr = new Date(a.date).toISOString().split("T")[0];
      return dbDateStr === dateStr;
    });
  };

  // Get color scale based on activity
  const getColorClass = (count: number, minutes: number) => {
    if (count === 0) return "bg-zinc-900/40 border-white/5 hover:border-zinc-700";
    const score = count * 2 + Math.floor(minutes / 30);
    if (score <= 2) return "bg-[#810100]/25 border-cherryRed/20 hover:border-cherryRed/45"; // Light
    if (score <= 5) return "bg-[#810100]/60 border-cherryRed/40 hover:border-cherryRed/80"; // Medium
    if (score <= 8) return "bg-[#C5A880]/55 border-luxuryGold/40 hover:border-luxuryGold shadow-[0_0_8px_rgba(197,168,128,0.15)]"; // Hot
    return "bg-[#C5A880] border-luxuryGold hover:border-white shadow-[0_0_12px_rgba(197,168,128,0.35)] animate-pulse"; // Extreme
  };

  // Statistics calculation
  const totalMissions = activities.reduce((sum, a) => sum + a.missionsCompleted, 0);
  const totalFocusHours = (activities.reduce((sum, a) => sum + a.focusMinutes, 0) / 60).toFixed(1);
  const totalAura = activities.reduce((sum, a) => sum + a.auraEarned, 0);
  const activeDaysCount = activities.filter(a => a.missionsCompleted > 0).length;

  return (
    <div className="rounded-2xl border border-luxuryMaroon/15 bg-noirBlack/45 p-4 md:p-6 shadow-md backdrop-blur-md text-left">
      <div className="flex items-center justify-between border-b border-white/5 pb-3.5 mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-luxuryGold" />
          <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-cotton">
            LOCKIN HEAT
          </h3>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-luxuryGold/20 bg-luxuryGold/5 px-2 py-0.5 text-[9px] font-black text-luxuryGold">
          <Sparkles className="h-3 w-3" /> {activeDaysCount} Active Days
        </div>
      </div>

      {loading ? (
        <div className="h-28 flex items-center justify-center text-xs font-bold text-zinc-600 uppercase tracking-widest animate-pulse">
          Rendering contribution graph...
        </div>
      ) : (
        <div className="space-y-4">
          {/* Main Grid Wrapper */}
          <div className="relative">
            <div className="flex overflow-x-auto pb-2 scrollbar-thin scrollbar-track-zinc-950 scrollbar-thumb-luxuryMaroon/20 -mx-2 px-2">
              <div className="grid grid-flow-col grid-rows-7 gap-1 pt-1">
                {/* Pad first week columns */}
                {Array.from({ length: padCount }).map((_, idx) => (
                  <div key={`pad-${idx}`} className="h-[10px] w-[10px] md:h-[12px] md:w-[12px] opacity-0 pointer-events-none" />
                ))}

                {/* Contribution cells */}
                {yearDays.map((day, idx) => {
                  const activity = getActivityForDate(day);
                  const count = activity ? activity.missionsCompleted : 0;
                  const minutes = activity ? activity.focusMinutes : 0;
                  const tasks = activity ? activity.tasksCompleted : 0;

                  const colorClass = getColorClass(count, minutes);

                  return (
                    <div
                      key={idx}
                      onMouseEnter={() => setHoveredDay({ date: day, count, minutes, tasks })}
                      onMouseLeave={() => setHoveredDay(null)}
                      className={`h-[10px] w-[10px] md:h-[12px] md:w-[12px] rounded-[2px] border transition-all cursor-pointer ${colorClass}`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Hover Tooltip */}
            {hoveredDay && (
              <div className="absolute top-[-54px] left-1/2 -translate-x-1/2 z-30 rounded-xl border border-luxuryGold/30 bg-zinc-950 px-3 py-2 text-center text-[10px] font-semibold text-cotton shadow-2xl backdrop-blur-xl pointer-events-none min-w-[150px]">
                <p className="font-bold text-luxuryGold border-b border-white/5 pb-1 mb-1">
                  {hoveredDay.date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
                <p className="text-cotton/90">
                  {hoveredDay.count} Runways · {hoveredDay.minutes} Min Focus
                </p>
                {hoveredDay.tasks > 0 && (
                  <p className="text-zinc-500 text-[9px] mt-0.5">
                    ✓ {hoveredDay.tasks} tasks completed
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Legend / Stats */}
          <div className="grid grid-cols-3 gap-2 text-center border-t border-white/5 pt-3.5">
            <div className="rounded-xl bg-black/30 border border-white/5 p-2">
              <span className="block text-[8px] font-bold uppercase tracking-wider text-zinc-500">Missions</span>
              <span className="text-xs md:text-sm font-black text-cotton">{totalMissions}</span>
            </div>
            <div className="rounded-xl bg-black/30 border border-white/5 p-2">
              <span className="block text-[8px] font-bold uppercase tracking-wider text-zinc-500">Focus Hours</span>
              <span className="text-xs md:text-sm font-black text-cotton">{totalFocusHours}h</span>
            </div>
            <div className="rounded-xl bg-black/30 border border-white/5 p-2">
              <span className="block text-[8px] font-bold uppercase tracking-wider text-zinc-500">Aura Earned</span>
              <span className="text-xs md:text-sm font-black text-luxuryGold">+{totalAura}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
