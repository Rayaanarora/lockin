"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Flame, CalendarClock, MapPin, X, Check, Plus, Lock } from "lucide-react";
import { User, Mission } from "../app/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

interface FeedProps {
  user: User;
  refreshUser: () => Promise<void>;
  setLocked: (locked: boolean) => void;
  api: (path: string, options?: RequestInit) => Promise<any>;
}

export default function Feed({ user, refreshUser, setLocked, api }: FeedProps) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  // New Mission form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: user.location || "SRM KTR Library",
    datetime: ""
  });
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    try {
      const [feed, lock] = await Promise.all([
        api(`/missions/feed?userId=${user.id}`),
        api(`/users/${user.id}/lock`)
      ]);
      setLocked(lock.locked);
      const passed = JSON.parse(localStorage.getItem(`lockin_passed_${user.id}`) || "[]");
      setMissions(feed.filter((item: Mission) => !passed.includes(item.id)));
      setIndex(0);
    } catch (err: any) {
      setError(err.message || "Failed to load feed.");
    }
  }

  useEffect(() => {
    load();
  }, [user.id]);

  const currentMission = missions[index];

  async function handleAction(action: "accept" | "pass") {
    if (!currentMission) return;
    setError("");
    try {
      if (action === "accept") {
        await api(`/missions/${currentMission.id}/accept`, {
          method: "POST",
          body: JSON.stringify({ userId: user.id })
        });
        await refreshUser();
      } else {
        await api(`/missions/${currentMission.id}/pass`, { method: "POST" });
        const key = `lockin_passed_${user.id}`;
        const passed = JSON.parse(localStorage.getItem(key) || "[]");
        localStorage.setItem(key, JSON.stringify([...new Set([...passed, currentMission.id])]));
      }
      setIndex((curr) => curr + 1);
    } catch (err: any) {
      if (err.message && err.message.includes("locked")) {
        setLocked(true);
      }
      setError(err.message || "Operation failed.");
    }
  }

  async function handleCreateMission(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api("/missions", {
        method: "POST",
        body: JSON.stringify({ ...form, creator_id: user.id })
      });
      setShowCreate(false);
      setForm({
        title: "",
        description: "",
        location: user.location || "SRM KTR Library",
        datetime: ""
      });
      await load();
    } catch (err: any) {
      setError(err.message || "Could not launch mission.");
    } finally {
      setSubmitting(false);
    }
  }

  const initials = (name = "?") => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const formatDate = (value: string) => {
    return new Intl.DateTimeFormat("en", {
      weekday: "short",
      hour: "numeric",
      minute: "2-digit",
      month: "short",
      day: "numeric"
    }).format(new Date(value));
  };

  return (
    <section className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-4 pb-20">
      {/* Title bar */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-boxRed">
            Discovery
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight">Active Runways</h2>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 transition"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* Card stack container */}
      <div className="relative flex flex-1 items-center justify-center min-h-[440px]">
        {/* Background stack sheets */}
        <div className="absolute inset-x-4 top-4 h-[420px] rounded-2xl border border-white/5 bg-zinc-950/20 scale-[0.93] translate-y-3 opacity-40 -z-20" />
        <div className="absolute inset-x-2 top-2 h-[420px] rounded-2xl border border-white/5 bg-zinc-950/40 scale-[0.97] translate-y-1.5 opacity-60 -z-10" />

        <AnimatePresence mode="wait">
          {currentMission ? (
            <motion.article
              key={currentMission.id}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(_, info) => {
                if (info.offset.x > 130) handleAction("accept");
                if (info.offset.x < -130) handleAction("pass");
              }}
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: -20 }}
              whileDrag={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className="relative flex h-[420px] w-full touch-none flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 p-5 shadow-2xl backdrop-blur-md"
            >
              {/* Inside glow card */}
              <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(245,38,1,0.06),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(247,128,5,0.05),transparent_40%)]" />

              <div className="space-y-4">
                {/* Creator info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xs font-black text-white">
                      {initials(currentMission.creator_name)}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white leading-tight">
                        {currentMission.creator_name}
                      </h3>
                      <p className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wide">
                        {currentMission.creator_department || "Department"}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[8px] font-black tracking-widest text-zinc-400 uppercase">
                    Coding
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-black text-white leading-snug tracking-tight">
                    {currentMission.title}
                  </h3>
                  <p className="text-xs font-medium leading-relaxed text-zinc-400 line-clamp-6">
                    {currentMission.description}
                  </p>
                </div>
              </div>

              {/* Timing & Location block */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5 rounded-xl border border-white/5 bg-black/30 p-2.5">
                  <CalendarClock className="h-4 w-4 text-boxOrange shrink-0 animate-pulse" />
                  <span className="text-xs font-bold text-zinc-300">
                    {formatDate(currentMission.datetime)}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 rounded-xl border border-white/5 bg-black/30 p-2.5">
                  <MapPin className="h-4 w-4 text-boxRed shrink-0" />
                  <span className="text-xs font-bold text-zinc-300">
                    {currentMission.location}
                  </span>
                </div>
              </div>
            </motion.article>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex h-[420px] w-full flex-col items-center justify-center rounded-2xl border border-white/5 bg-zinc-950/20 p-6 text-center backdrop-blur-md"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-boxGreen/20 bg-boxGreen/5 shadow-[0_0_20px_rgba(24,189,0,0.1)] mb-4">
                <Flame className="h-6 w-6 text-boxGreen" />
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Feed Cleared</h3>
              <p className="mt-2 text-xs font-semibold text-zinc-500 leading-relaxed max-w-[240px]">
                No more missions nearby. Launch one yourself or check back when the runway expands.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <p className="mt-4 text-center text-xs font-bold text-boxRed animate-pulse">
          {error}
        </p>
      )}

      {/* Swipe buttons */}
      {currentMission && (
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={() => handleAction("pass")}
            className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 text-xs font-bold uppercase tracking-wider text-zinc-300 transition hover:bg-white/10 hover:text-white active:scale-[0.98]"
          >
            <X className="h-4 w-4" /> Pass
          </button>
          <button
            onClick={() => handleAction("accept")}
            className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-boxOrange bg-boxOrange text-xs font-black uppercase tracking-wider text-black shadow-[0_0_20px_rgba(247,128,5,0.15)] transition hover:bg-boxOrange/90 active:scale-[0.98]"
          >
            <Check className="h-4 w-4 stroke-[3]" /> Lock In
          </button>
        </div>
      )}

      {/* shadcn Dialog Modal for Launching Mission */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="border-white/10 bg-zinc-950/95 text-white max-w-sm rounded-2xl backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black tracking-tight text-white">
              LAUNCH MISSION
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateMission} className="space-y-4 mt-2">
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                Mission Title
              </label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. LeetCode Lock-In"
                className="h-10 border-white/10 bg-black/40 text-xs text-white"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                Detailed Description
              </label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What exactly needs to get executed?"
                className="min-h-20 border-white/10 bg-black/40 text-xs text-white resize-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                Meet Location
              </label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. SRM KTR Tech Park"
                className="h-10 border-white/10 bg-black/40 text-xs text-white"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                Datetime Schedule
              </label>
              <Input
                type="datetime-local"
                value={form.datetime}
                onChange={(e) => setForm({ ...form, datetime: e.target.value })}
                className="h-10 border-white/10 bg-black/40 text-xs text-white"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-boxGreen/40 bg-boxGreen text-xs font-black uppercase tracking-wider text-black shadow-[0_0_20px_rgba(24,189,0,0.15)] hover:bg-boxGreen/90 transition active:scale-[0.98] disabled:opacity-50"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              {submitting ? "Launching..." : "Launch runway"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
