"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Trophy,
  MapPin,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  Instagram,
  Github,
  ChevronRight,
  Flame,
  LayoutGrid
} from "lucide-react";
import { User, Mission } from "../app/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";

interface ProfileProps {
  user: User;
  refreshUser: () => Promise<void>;
  api: (path: string, options?: RequestInit) => Promise<any>;
}

interface LeaderboardEntry {
  id: number;
  name: string;
  department: string;
  reputation_score: number;
  interests?: string;
}

const TABS = ["Stats", "Leaderboard", "Missions"] as const;
type Tab = (typeof TABS)[number];

export default function Profile({ user, refreshUser, api }: ProfileProps) {
  const [activeTab, setActiveTab] = useState<Tab>("Stats");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [pastMissions, setPastMissions] = useState<Mission[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [loadingMissions, setLoadingMissions] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [form, setForm] = useState({
    name: user.name || "",
    department: user.department || "",
    bio: user.bio || "",
    instagram: user.instagram || "",
    github: user.github || "",
    location: user.location || "",
  });
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const idx = TABS.indexOf(activeTab);
    const el = tabRefs.current[idx];
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "Leaderboard" && user.campus_id) {
      setLoadingLeaderboard(true);
      api(`/users/leaderboard?campusId=${user.campus_id}`)
        .then(setLeaderboard)
        .catch(() => setLeaderboard([]))
        .finally(() => setLoadingLeaderboard(false));
    }
  }, [activeTab, user.campus_id]);

  useEffect(() => {
    if (activeTab === "Missions") {
      setLoadingMissions(true);
      api(`/missions/active/${user.id}`)
        .then((data: Mission[]) => {
          const past = data.filter(
            (m) => m.status === "Completed" || m.status === "Missed" || m.showed_up !== undefined
          );
          setPastMissions(past);
        })
        .catch(() => setPastMissions([]))
        .finally(() => setLoadingMissions(false));
    }
  }, [activeTab, user.id]);

  const initials = user.name
    ? user.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  const aura = user.reputation_score ?? 0;

  async function handleSync() {
    setSyncing(true);
    try {
      await refreshUser();
    } catch {}
    setTimeout(() => setSyncing(false), 800);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (form.name.trim().length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }
    setUpdating(true);
    setError("");
    try {
      await api(`/users/${user.id}`, {
        method: "PUT",
        body: JSON.stringify(form),
      });
      await refreshUser();
      setShowEdit(false);
    } catch (err: any) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-md px-4 py-6 pb-24 space-y-5">
      {/* ── Profile header ── */}
      <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-zinc-950/60 p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-lg font-black text-white">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-black text-white leading-tight">{user.name}</h2>
            <p className="text-[11px] text-zinc-500 font-semibold mt-0.5 truncate">{user.department}</p>
            {user.bio && (
              <p className="text-[11px] text-zinc-400 mt-1 leading-snug line-clamp-2">{user.bio}</p>
            )}
          </div>
        </div>

        {/* Aura + location pills */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="flex items-center gap-1.5 rounded-lg border border-boxOrange/25 bg-boxOrange/8 px-2.5 py-1 text-[10px] font-black text-boxOrange uppercase tracking-wider">
            <Zap className="h-3 w-3 fill-current" />
            {aura} Aura
          </span>
          {user.location && (
            <span className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/4 px-2.5 py-1 text-[10px] font-semibold text-zinc-500">
              <MapPin className="h-3 w-3" />
              {user.location}
            </span>
          )}
          {user.interests && (
            <span className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/4 px-2.5 py-1 text-[10px] font-semibold text-zinc-500 truncate max-w-[160px]">
              {user.interests}
            </span>
          )}
        </div>

        {/* Socials row */}
        {(user.instagram || user.github) && (
          <div className="mt-3 flex gap-3">
            {user.instagram && (
              <a
                href={`https://instagram.com/${user.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 hover:text-white transition"
              >
                <Instagram className="h-3.5 w-3.5" />@{user.instagram}
              </a>
            )}
            {user.github && (
              <a
                href={`https://github.com/${user.github}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 hover:text-white transition"
              >
                <Github className="h-3.5 w-3.5" />@{user.github}
              </a>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex h-9 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 text-[11px] font-black uppercase tracking-wider text-zinc-400 transition hover:text-white disabled:opacity-50"
          >
            <Activity className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync"}
          </button>
          <button
            onClick={() => setShowEdit(true)}
            className="flex h-9 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 text-[11px] font-black uppercase tracking-wider text-zinc-400 transition hover:text-white"
          >
            Edit Profile
          </button>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="relative flex gap-0 rounded-xl border border-white/8 bg-zinc-950/60 p-1">
        <motion.div
          className="absolute top-1 bottom-1 rounded-lg bg-white/8 border border-white/10"
          animate={{ left: indicator.left, width: indicator.width }}
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
        />
        {TABS.map((tab, idx) => (
          <button
            key={tab}
            ref={(el) => { tabRefs.current[idx] = el; }}
            onClick={() => setActiveTab(tab)}
            className={`relative z-10 flex-1 py-2 text-[11px] font-black uppercase tracking-wider transition ${
              activeTab === tab ? "text-white" : "text-zinc-600"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <AnimatePresence mode="wait">
        {activeTab === "Stats" && (
          <motion.div
            key="stats"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Aura bar */}
            <div className="rounded-2xl border border-white/8 bg-zinc-950/60 p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Aura Points</span>
                <span className="text-sm font-black text-boxOrange">{aura}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-zinc-900">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (aura / 500) * 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-boxRed via-boxOrange to-boxGreen"
                />
              </div>
              <p className="text-[9px] text-zinc-700 uppercase tracking-widest">
                {aura < 100 ? "Initiate" : aura < 250 ? "Executor" : aura < 500 ? "Specialist" : "Elite"}
                {" — "}{Math.max(0, 500 - aura)} Aura to Elite
              </p>
            </div>

            {/* Info tiles */}
            <div className="space-y-2">
              {[
                { label: "Institution", value: user.college },
                { label: "Email / Reg ID", value: user.college_id },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-white/5 bg-zinc-950/40 px-4 py-3 flex justify-between items-center"
                >
                  <span className="text-[9px] font-black uppercase tracking-wider text-zinc-600">{item.label}</span>
                  <span className="text-[11px] font-semibold text-zinc-300 max-w-[200px] truncate text-right">{item.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === "Leaderboard" && (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {!user.campus_id ? (
              <div className="rounded-2xl border border-white/5 bg-zinc-950/40 p-8 text-center">
                <Trophy className="h-6 w-6 mx-auto text-zinc-700 mb-3" />
                <p className="text-xs font-black text-zinc-600 uppercase tracking-widest">Campus not set</p>
                <p className="text-[11px] text-zinc-700 mt-1">Re-register with a campus to see rankings.</p>
              </div>
            ) : loadingLeaderboard ? (
              <div className="py-12 text-center text-[11px] font-bold text-zinc-700 uppercase tracking-widest">
                Loading...
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="rounded-2xl border border-white/5 bg-zinc-950/40 p-8 text-center">
                <p className="text-xs font-black text-zinc-600 uppercase tracking-widest">No data yet</p>
                <p className="text-[11px] text-zinc-700 mt-1">Complete missions to appear on the board.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/8 bg-zinc-950/60 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                  <Trophy className="h-3.5 w-3.5 text-boxOrange" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Campus Leaderboard</span>
                </div>
                <div className="divide-y divide-white/4">
                  {leaderboard.map((entry, idx) => {
                    const isYou = entry.id === user.id;
                    const rankColor =
                      idx === 0
                        ? "text-boxOrange font-black"
                        : idx === 1
                        ? "text-zinc-300 font-black"
                        : idx === 2
                        ? "text-zinc-500 font-bold"
                        : "text-zinc-700 font-bold";
                    return (
                      <div
                        key={entry.id}
                        className={`flex items-center gap-3 px-4 py-3 ${isYou ? "bg-boxOrange/5" : ""}`}
                      >
                        <span className={`w-5 text-xs shrink-0 text-right ${rankColor}`}>
                          {idx === 0 ? "①" : idx === 1 ? "②" : idx === 2 ? "③" : `${idx + 1}`}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold truncate ${isYou ? "text-boxOrange" : "text-white"}`}>
                            {entry.name} {isYou && <span className="text-[9px] text-zinc-600">(you)</span>}
                          </p>
                          <p className="text-[10px] text-zinc-600 truncate">{entry.department}</p>
                        </div>
                        <span className="text-xs font-black text-white shrink-0">
                          {entry.reputation_score}
                          <span className="text-[9px] text-zinc-600 ml-0.5 font-normal">AP</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "Missions" && (
          <motion.div
            key="missions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {loadingMissions ? (
              <div className="py-12 text-center text-[11px] font-bold text-zinc-700 uppercase tracking-widest">
                Loading...
              </div>
            ) : pastMissions.length === 0 ? (
              <div className="rounded-2xl border border-white/5 bg-zinc-950/40 p-8 text-center">
                <LayoutGrid className="h-6 w-6 mx-auto text-zinc-700 mb-3" />
                <p className="text-xs font-black text-zinc-600 uppercase tracking-widest">No missions yet</p>
                <p className="text-[11px] text-zinc-700 mt-1">Accept a mission from the feed to get started.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/8 bg-zinc-950/60 overflow-hidden">
                <div className="divide-y divide-white/4">
                  {pastMissions.map((m) => {
                    const done = m.status === "Completed";
                    const missed = m.status === "Missed";
                    return (
                      <div key={`${m.id}-${m.role}`} className="flex items-center gap-3 px-4 py-3">
                        {done ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-boxGreen" />
                        ) : missed ? (
                          <XCircle className="h-4 w-4 shrink-0 text-boxRed" />
                        ) : (
                          <Clock className="h-4 w-4 shrink-0 text-zinc-600" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-white truncate">{m.title}</p>
                          <p className="text-[10px] text-zinc-600">
                            {m.role === "creator" ? "You hosted" : `Partner: ${m.creator_name}`}
                            {" · "}
                            {new Date(m.datetime).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })}
                          </p>
                        </div>
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                            done
                              ? "border-boxGreen/25 bg-boxGreen/8 text-boxGreen"
                              : missed
                              ? "border-boxRed/25 bg-boxRed/8 text-boxRed"
                              : "border-white/10 text-zinc-600"
                          }`}
                        >
                          {m.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Edit Profile Dialog ── */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="border-white/10 bg-zinc-950/98 text-white max-w-sm rounded-3xl backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-black tracking-widest text-white uppercase">
              Edit Profile
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-3 mt-1">
            {[
              { label: "Full Name", key: "name", placeholder: "Your Name" },
              { label: "Department & Year", key: "department", placeholder: "e.g. CSE, 3rd Year" },
              { label: "Meet Spot", key: "location", placeholder: "e.g. Library, Block B Canteen..." },
              { label: "Bio", key: "bio", placeholder: "What are you building?" },
              { label: "Instagram", key: "instagram", placeholder: "@username" },
              { label: "GitHub", key: "github", placeholder: "@username" },
            ].map(({ label, key, placeholder }) => (
              <div key={key} className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-zinc-500">
                  {label}
                </label>
                <Input
                  value={(form as any)[key]}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm((f) => ({ ...f, [key]: e.target.value }))
                  }
                  placeholder={placeholder}
                  className="h-10 border-white/10 bg-black/40 text-xs text-white placeholder-zinc-700 focus:border-boxOrange"
                />
              </div>
            ))}

            {error && (
              <p className="text-[11px] font-bold text-boxRed">{error}</p>
            )}

            <button
              type="submit"
              disabled={updating}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-boxGreen/40 bg-boxGreen text-xs font-black uppercase tracking-wider text-black transition hover:bg-boxGreen/90 disabled:opacity-50"
            >
              <Flame className="h-3.5 w-3.5 fill-current" />
              {updating ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
