"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarClock, MapPin, Check, X, MessageSquare, ShieldAlert } from "lucide-react";
import { User, Mission } from "../app/types";
import Chat from "./Chat";

interface ActiveMissionsProps {
  user: User;
  refreshUser: () => Promise<void>;
  api: (path: string, options?: RequestInit) => Promise<any>;
  socketUrl: string;
}

export default function ActiveMissions({ user, refreshUser, api, socketUrl }: ActiveMissionsProps) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [chatMission, setChatMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const active = await api(`/missions/active/${user.id}`);
      setMissions(active);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // Auto-update every 30 seconds
    const interval = setInterval(() => {
      load();
    }, 30000);
    return () => clearInterval(interval);
  }, [user.id]);

  async function handleAttendance(mission: Mission, showedUp: boolean) {
    try {
      await api(`/missions/${mission.id}/attendance`, {
        method: "POST",
        body: JSON.stringify({ userId: user.id, showedUp })
      });
      await Promise.all([load(), refreshUser()]);
    } catch (err) {
      console.error(err);
    }
  }

  const isDue = (datetime: string) => {
    return new Date(datetime).getTime() <= Date.now();
  };

  const timeLeft = (datetime: string) => {
    const diff = new Date(datetime).getTime() - Date.now();
    if (diff <= 0) return "Ready";
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    return `${hours}h ${minutes}m`;
  };

  const pendingReviews = missions.filter(
    (mission) => mission.showed_up === null && isDue(mission.datetime)
  ).length;

  return (
    <section className="mx-auto w-full max-w-md flex-1 px-4 py-4 pb-20 space-y-6">
      {/* Title block */}
      <div className="flex items-end justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-boxOrange">
            Execution Queue
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight">Active Runs</h2>
        </div>
        <div className="rounded-xl border border-white/5 bg-zinc-950/45 px-3 py-1.5 text-right">
          <span className="block text-[8px] font-black uppercase tracking-wider text-zinc-500">
            Completed Ratio
          </span>
          <span className="text-sm font-black text-boxGreen">
            {missions.filter((m) => m.status === "Completed").length}/{missions.length}
          </span>
        </div>
      </div>

      {/* Warning check alert */}
      {pendingReviews > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-xl border border-boxOrange/35 bg-boxOrange/5 p-3.5"
        >
          <ShieldAlert className="h-4 w-4 text-boxOrange shrink-0 mt-0.5 animate-pulse" />
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider leading-none">
              Attendance check required
            </h4>
            <p className="mt-1 text-[11px] font-medium leading-normal text-zinc-400">
              Confirm who showed up on {pendingReviews} due runway{pendingReviews > 1 ? "s" : ""} to sync score weights.
            </p>
          </div>
        </motion.div>
      )}

      {/* Queue items */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-20 text-xs font-bold text-zinc-600 uppercase tracking-widest">
            Syncing queue...
          </div>
        ) : missions.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-white/5 bg-zinc-950/10 p-6">
            <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Queue Empty</p>
            <p className="mt-1.5 text-xs text-zinc-500 leading-relaxed max-w-[200px] mx-auto">
              Accept run targets from the discovery board to display them here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {missions.map((mission, idx) => {
              const due = isDue(mission.datetime);
              const needsReview = mission.showed_up === null && due;
              
              let statusColor = "border-white/10 bg-zinc-950/30 text-zinc-400";
              if (mission.status === "Completed") statusColor = "border-boxGreen/25 bg-boxGreen/10 text-boxGreen shadow-[0_0_15px_rgba(24,189,0,0.06)]";
              if (mission.status === "Missed") statusColor = "border-boxRed/25 bg-boxRed/10 text-boxRed";
              if (needsReview) statusColor = "border-boxOrange/20 bg-boxOrange/5 text-boxOrange animate-pulse";

              return (
                <motion.article
                  key={mission.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`rounded-2xl border bg-zinc-950/50 p-4 shadow-sm backdrop-blur-md transition ${
                    needsReview ? "border-boxOrange/40 ring-1 ring-boxOrange/10" : "border-white/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-sm font-black text-white leading-tight">
                        {mission.title}
                      </h3>
                      <p className="mt-0.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                        with {mission.creator_name}
                      </p>
                    </div>
                    <span className={`rounded-md border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${statusColor}`}>
                      {needsReview ? "Review" : mission.status}
                    </span>
                  </div>

                  {/* Timing & Location */}
                  <div className="grid grid-cols-2 gap-2.5 text-xs font-bold text-zinc-400 mb-4">
                    <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-black/30 p-2.5">
                      <CalendarClock className="h-3.5 w-3.5 text-boxOrange shrink-0" />
                      <span>{due ? "Ready" : timeLeft(mission.datetime)}</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-black/30 p-2.5">
                      <MapPin className="h-3.5 w-3.5 text-boxRed shrink-0" />
                      <span className="truncate">{mission.location}</span>
                    </div>
                  </div>

                  {/* Review box */}
                  {needsReview && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mb-3.5 rounded-xl border border-boxOrange/20 bg-boxOrange/5 p-3 text-center"
                    >
                      <p className="text-[10px] font-black uppercase tracking-wider text-white">
                        Confirm Attendance
                      </p>
                      <p className="mt-0.5 text-[9px] text-zinc-500 font-semibold">
                        Did they show up? +10 Reputation / -5 Penality
                      </p>
                      <div className="mt-3.5 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleAttendance(mission, true)}
                          className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-boxGreen text-[10px] font-black uppercase tracking-wider text-black transition hover:bg-boxGreen/95"
                        >
                          <Check className="h-3.5 w-3.5 stroke-[3]" /> Yes
                        </button>
                        <button
                          onClick={() => handleAttendance(mission, false)}
                          className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-boxRed text-[10px] font-black uppercase tracking-wider text-white transition hover:bg-boxRed/95"
                        >
                          <X className="h-3.5 w-3.5 stroke-[3]" /> No
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Footer actions */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setChatMission(mission)}
                      className="flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 hover:text-white transition"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleAttendance(mission, true)}
                      disabled={mission.showed_up !== null || !due}
                      className="flex h-10 items-center justify-center rounded-xl border border-boxGreen/30 bg-boxGreen/5 text-boxGreen hover:bg-boxGreen/10 active:scale-[0.98] transition disabled:opacity-35"
                    >
                      <Check className="h-4 w-4 stroke-[3]" />
                    </button>
                    <button
                      onClick={() => handleAttendance(mission, false)}
                      disabled={mission.showed_up !== null || !due}
                      className="flex h-10 items-center justify-center rounded-xl border border-boxRed/30 bg-boxRed/5 text-boxRed hover:bg-boxRed/10 active:scale-[0.98] transition disabled:opacity-35"
                    >
                      <X className="h-4 w-4 stroke-[3]" />
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </div>

      {/* Render Chat Panel when selected */}
      <AnimatePresence>
        {chatMission && (
          <Chat
            mission={chatMission}
            user={user}
            onClose={() => setChatMission(null)}
            api={api}
            socketUrl={socketUrl}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
