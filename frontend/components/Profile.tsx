"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Activity, Shield, Award, MapPin, Zap } from "lucide-react";
import { User } from "../app/types";

interface ProfileProps {
  user: User;
  refreshUser: () => Promise<void>;
}

export default function Profile({ user, refreshUser }: ProfileProps) {
  const [syncing, setSyncing] = useState(false);
  const score = Math.max(0, Math.min(100, user.reputation_score || 0));

  // Determine dynamic level based on reputation score
  const level = Math.floor(score / 25) + 1;
  const levelName = level === 1 ? "Initiate" : level === 2 ? "Executor" : level === 3 ? "Specialist" : "Elite Agent";

  // Initials generator
  const initials = user.name
    ? user.name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "??";

  async function handleSync() {
    setSyncing(true);
    try {
      await refreshUser();
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setSyncing(false), 800); // short delay to feel premium
    }
  }

  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-6 space-y-6">
      {/* Profile Header Card */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/40 p-6 backdrop-blur-md">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(247,128,5,0.1),transparent_40%)]" />
        
        <div className="flex flex-col items-center md:flex-row md:items-start gap-5">
          {/* Avatar Initials with custom glow */}
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-boxOrange/30 bg-boxOrange/10 text-2xl font-black text-white shadow-[0_0_30px_rgba(247,128,5,0.15)]">
            {initials}
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <h2 className="text-xl font-black text-white">{user.name}</h2>
              <span className="mx-auto md:mx-0 flex items-center gap-1 rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                <Zap className="h-2.5 w-2.5 text-boxOrange fill-current" /> Lvl {level} • {levelName}
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-500 font-semibold">{user.department}</p>

            <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-3 text-[10px] font-bold text-zinc-400">
              <span className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-zinc-900/40 px-2.5 py-1.5">
                <Shield className="h-3.5 w-3.5 text-boxGreen" />
                {user.reputation_score} Reputation
              </span>
              <span className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-zinc-900/40 px-2.5 py-1.5">
                <MapPin className="h-3.5 w-3.5 text-boxRed" />
                {user.location || "On Campus"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress & Level Card */}
      <div className="rounded-2xl border border-white/10 bg-zinc-950/40 p-5 backdrop-blur-md">
        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
          <span>Level Progress</span>
          <span className="text-boxGreen">{score}%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-zinc-900 border border-white/5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-boxRed via-boxOrange to-boxGreen"
          />
        </div>
        <div className="flex justify-between mt-2.5 text-[9px] font-black text-zinc-600 uppercase tracking-widest">
          <span>Lvl {level}</span>
          <span>Lvl {level + 1}</span>
        </div>
      </div>

      {/* Stats Breakdown */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-white/10 bg-zinc-950/40 p-4 text-center backdrop-blur-md">
          <Award className="h-5 w-5 mx-auto text-boxOrange animate-pulse" />
          <span className="mt-2 block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            Reputation Rank
          </span>
          <span className="mt-1 block text-2xl font-black text-white">
            #{Math.max(1, 100 - user.reputation_score)}
          </span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-zinc-950/40 p-4 text-center backdrop-blur-md">
          <Activity className="h-5 w-5 mx-auto text-boxGreen" />
          <span className="mt-2 block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            Showed Up Score
          </span>
          <span className="mt-1 block text-2xl font-black text-white">
            {user.reputation_score > 0 ? `+${user.reputation_score}` : user.reputation_score}
          </span>
        </div>
      </div>

      {/* Information Cards */}
      <div className="space-y-3">
        {[
          { label: "Registered Institution", value: user.college },
          { label: "Institutional Email ID", value: user.college_id }
        ].map((info) => (
          <div key={info.label} className="rounded-xl border border-white/5 bg-zinc-950/20 p-3.5">
            <span className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500">
              {info.label}
            </span>
            <span className="mt-1 block text-sm font-semibold text-zinc-300">
              {info.value}
            </span>
          </div>
        ))}
      </div>

      {/* Sync Profile Action */}
      <button
        onClick={handleSync}
        disabled={syncing}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 text-xs font-black uppercase tracking-wider text-zinc-200 transition hover:bg-white/10 hover:text-white disabled:opacity-55"
      >
        <Activity className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
        {syncing ? "Syncing..." : "Sync Profile metrics"}
      </button>
    </section>
  );
}
