"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { Flame, CalendarClock, MapPin, X, Check, Plus, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { User, Mission } from "../app/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

interface FeedProps {
  user: User;
  refreshUser: () => Promise<void>;
  locked: boolean;
  setLocked: (locked: boolean) => void;
  api: (path: string, options?: RequestInit) => Promise<any>;
  setTab?: (tab: string) => void;
}

export default function Feed({ user, refreshUser, locked, setLocked, api, setTab }: FeedProps) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [categories, setCategories] = useState<{ id: number; categoryName: string; emoji?: string; colorHex?: string }[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [index, setIndex] = useState(0);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  // New Mission form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: user.location || "SRM KTR Library",
    datetime: "",
    categoryId: "1",
    missionType: "group"
  });
  const [tasks, setTasks] = useState<string[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const addTask = () => {
    if (newTaskTitle.trim()) {
      setTasks([...tasks, newTaskTitle.trim()]);
      setNewTaskTitle("");
    }
  };

  const removeTask = (idx: number) => {
    setTasks(tasks.filter((_, i) => i !== idx));
  };

  // Motion values for swipe animation
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const opacityAccept = useTransform(x, [0, 100], [0, 1]);
  const opacityPass = useTransform(x, [-100, 0], [1, 0]);

  async function load(catId: string = "all") {
    try {
      const [feed, lock] = await Promise.all([
        api(`/missions/feed?userId=${user.id}&categoryId=${catId}`),
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
    load(activeCategory);
  }, [user.id, activeCategory]);

  useEffect(() => {
    // Load categories once
    api("/missions/categories")
      .then((data) => setCategories(data))
      .catch((err) => console.error("Error loading categories:", err));
  }, []);

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
        setTab?.("active");
      } else {
        await api(`/missions/${currentMission.id}/pass`, { method: "POST" });
        const key = `lockin_passed_${user.id}`;
        const passed = JSON.parse(localStorage.getItem(key) || "[]");
        localStorage.setItem(key, JSON.stringify([...new Set([...passed, currentMission.id])]));
      }
      setIndex((curr) => curr + 1);
      x.set(0); // reset motion value
    } catch (err: any) {
      if (err.message && err.message.includes("limit")) {
        setLocked(true);
      }
      setError(err.message || "Operation failed.");
      x.set(0);
    }
  }

  async function handleCreateMission(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const isSolo = form.missionType === "solo";
      const payload = {
        ...form,
        creator_id: user.id,
        categoryId: Number(form.categoryId),
        location: isSolo ? "Solo" : form.location,
        datetime: isSolo ? new Date().toISOString() : form.datetime
      };

      const newMission = await api("/missions", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      // If we have tasks, batch create them
      if (tasks.length > 0 && newMission?.id) {
        await api("/tasks/batch", {
          method: "POST",
          body: JSON.stringify({
            missionId: newMission.id,
            tasks: tasks.map((t, idx) => ({ title: t, position: idx }))
          })
        });
      }

      setShowCreate(false);
      setTab?.("active");
      setForm({
        title: "",
        description: "",
        location: user.location || "SRM KTR Library",
        datetime: "",
        categoryId: categories[0]?.id ? String(categories[0].id) : "1",
        missionType: "group"
      });
      setTasks([]);
      await load(activeCategory);
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

  const handleCategoryChange = (catId: string) => {
    setActiveCategory(catId);
    setError("");
  };

  return (
    <section className="mx-auto flex w-full max-w-md md:max-w-xl flex-1 flex-col px-4 pt-4 pb-24 md:pb-6">
      {/* Title bar */}
      <div className="mb-4 md:mb-6 flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-boxRed">
            Discovery
          </span>
          <h2 className="text-xl md:text-3xl font-bold text-white tracking-tight mt-1">Active Runways</h2>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 transition"
        >
          <Plus className="h-5 w-5 md:h-6 md:w-6" />
        </button>
      </div>

      {/* Categories Bar */}
      <div className="relative mb-4 md:mb-6 group">
        {/* Left scroll arrow */}
        <button
          type="button"
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 hidden md:flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-zinc-950/95 text-zinc-400 hover:text-white hover:bg-zinc-900 transition shadow-[0_4px_12px_rgba(0,0,0,0.5)] opacity-0 group-hover:opacity-100"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Scrollable category list */}
        <div
          ref={scrollContainerRef}
          className="flex gap-1.5 md:gap-2.5 overflow-x-auto pb-2 scrollbar-none shrink-0 -mx-4 px-4 scroll-smooth"
        >
          <button
            onClick={() => handleCategoryChange("all")}
            className={`h-8 md:h-10 rounded-full border px-4 md:px-5 text-[10px] md:text-xs font-sans font-medium transition shrink-0 ${
              activeCategory === "all"
                ? "border-cherryRed bg-cherryRed text-cotton"
                : "border-luxuryMaroon/20 bg-noirBlack/40 text-cotton/60 hover:text-cotton hover:bg-luxuryMaroon/10"
            }`}
          >
            All
          </button>
          {categories.map((c) => {
            const selected = activeCategory === String(c.id);
            return (
              <button
                key={c.id}
                onClick={() => handleCategoryChange(String(c.id))}
                className="flex items-center gap-1.5 h-8 md:h-10 rounded-full border px-4 md:px-5 text-[10px] md:text-xs font-sans font-medium transition shrink-0"
                style={{
                  borderColor: selected ? (c.colorHex || "#810100") : "rgba(129,1,0,0.15)",
                  backgroundColor: selected ? (c.colorHex || "#810100") : "rgba(8,8,8,0.4)",
                  color: selected ? "#ffffff" : "rgba(255,255,255,0.6)"
                }}
              >
                {c.emoji && <span className="text-xs md:text-sm">{c.emoji}</span>}
                {c.categoryName}
              </button>
            );
          })}
        </div>

        {/* Right scroll arrow */}
        <button
          type="button"
          onClick={scrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 hidden md:flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-zinc-950/95 text-zinc-400 hover:text-white hover:bg-zinc-900 transition shadow-[0_4px_12px_rgba(0,0,0,0.5)] opacity-0 group-hover:opacity-100"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Soft Limit Warning Banner */}
      {locked && (
        <div className="mb-4 md:mb-6 flex items-start gap-2.5 md:gap-3.5 rounded-xl border border-cherryRed/35 bg-cherryRed/5 p-3.5 md:p-4.5">
          <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-cherryRed shrink-0 mt-0.5 animate-pulse" />
          <div className="text-left">
            <h4 className="text-[10px] md:text-xs font-black uppercase tracking-wider text-white">
              Runway full (Locked)
            </h4>
            <p className="text-[9px] md:text-xs font-semibold text-zinc-500 leading-normal mt-0.5">
              You already have 3 active accepted runs. Mark attendance or clear them to unlock.
            </p>
          </div>
        </div>
      )}

      {/* Card stack container */}
      <div className="relative flex flex-1 items-center justify-center min-h-[440px] md:min-h-[500px]">
        {/* Background stack sheets */}
        <div className="absolute inset-x-4 top-4 h-[420px] md:h-[480px] rounded-3xl border border-luxuryMaroon/10 bg-[#1B1716]/30 scale-[0.93] translate-y-3 opacity-40 -z-20" />
        <div className="absolute inset-x-2 top-2 h-[420px] md:h-[480px] rounded-3xl border border-luxuryMaroon/15 bg-[#1B1716]/50 scale-[0.97] translate-y-1.5 opacity-60 -z-10" />

        <AnimatePresence mode="wait">
          {currentMission ? (
            <motion.article
              key={currentMission.id}
              style={{ x, rotate }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              dragSnapToOrigin
              onDragEnd={(_, info) => {
                if (info.offset.x > 120) {
                  if (locked) {
                    setError("Runway limit reached. Complete active queue first.");
                    x.set(0);
                  } else {
                    handleAction("accept");
                  }
                } else if (info.offset.x < -120) {
                  handleAction("pass");
                }
              }}
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: -20 }}
              whileDrag={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className="relative flex h-[420px] md:h-[480px] w-full touch-none flex-col justify-between overflow-hidden rounded-3xl border border-luxuryMaroon/20 bg-[#1B1716]/60 p-6 md:p-8 shadow-2xl backdrop-blur-md"
            >
              {/* Swipe Overlays */}
              <motion.div
                style={{ opacity: opacityAccept }}
                className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-luxuryGold/10 backdrop-blur-[1px]"
              >
                <div className="rounded-xl border border-luxuryGold/30 bg-noirBlack/90 px-4 py-2 text-xs md:text-sm font-black tracking-widest text-luxuryGold uppercase shadow-[0_0_30px_rgba(197,168,128,0.25)]">
                  Lock In
                </div>
              </motion.div>

              <motion.div
                style={{ opacity: opacityPass }}
                className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-cherryRed/15 backdrop-blur-[1px]"
              >
                <div className="rounded-xl border border-cherryRed bg-noirBlack/90 px-4 py-2 text-xs md:text-sm font-black tracking-widest text-cherryRed uppercase shadow-[0_0_30px_rgba(129,1,0,0.35)]">
                  Pass
                </div>
              </motion.div>

              {/* Inside glow card */}
              <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(129,1,0,0.08),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(197,168,128,0.06),transparent_40%)]" />

              <div className="space-y-4 md:space-y-6">
                {/* Creator info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 md:gap-3.5">
                    <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl border border-luxuryMaroon/20 bg-luxuryMaroon/5 text-xs md:text-sm font-black text-cotton">
                      {initials(currentMission.creator_name)}
                    </div>
                    <div className="text-left">
                      <h3 className="text-xs md:text-sm font-bold text-cotton leading-tight">
                        {currentMission.creator_name}
                      </h3>
                      <p className="text-[9px] md:text-xs font-semibold text-zinc-500 uppercase tracking-wide mt-0.5">
                        {currentMission.creator_department || "Department"}
                      </p>
                    </div>
                  </div>
                  <span
                    className="flex items-center gap-1 rounded-full bg-luxuryMaroon/10 border border-luxuryMaroon/20 px-2 py-0.5 md:px-3 md:py-1 text-[8px] md:text-[10px] font-black tracking-widest uppercase"
                    style={{
                      borderColor: currentMission.category_color ? `${currentMission.category_color}40` : undefined,
                      backgroundColor: currentMission.category_color ? `${currentMission.category_color}14` : undefined,
                      color: currentMission.category_color || "#ffa3a3"
                    }}
                  >
                    {currentMission.category_emoji && (
                      <span className="text-[10px] md:text-xs">{currentMission.category_emoji}</span>
                    )}
                    {currentMission.category_name || "Coding"}
                  </span>
                </div>

                <div className="space-y-2 md:space-y-3 text-left">
                  <h3 className="text-lg md:text-xl lg:text-2xl font-black text-cotton leading-snug tracking-tight">
                    {currentMission.title}
                  </h3>
                  <p className="text-xs md:text-sm font-medium leading-relaxed text-cotton/70 line-clamp-6">
                    {currentMission.description}
                  </p>
                </div>
              </div>

              {/* Timing & Location block */}
              <div className="space-y-2.5 md:space-y-3.5">
                <div className="flex items-center gap-2.5 md:gap-3.5 rounded-xl border border-luxuryMaroon/15 bg-noirBlack/45 p-2.5 md:p-3.5">
                  <CalendarClock className="h-4 w-4 md:h-5 md:w-5 text-luxuryGold shrink-0" />
                  <span className="text-xs md:text-sm font-bold text-cotton/95">
                    {formatDate(currentMission.datetime)}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 md:gap-3.5 rounded-xl border border-luxuryMaroon/15 bg-noirBlack/45 p-2.5 md:p-3.5">
                  <MapPin className="h-4 w-4 md:h-5 md:w-5 text-cherryRed shrink-0" />
                  <span className="text-xs md:text-sm font-bold text-cotton/95 truncate">
                    {currentMission.location}
                  </span>
                </div>
              </div>
            </motion.article>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex h-[420px] md:h-[480px] w-full flex-col items-center justify-center rounded-3xl border border-luxuryMaroon/15 bg-noirBlack/40 p-6 md:p-8 text-center backdrop-blur-md"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cherryRed/20 bg-cherryRed/5 shadow-[0_0_20px_rgba(129,1,0,0.1)] mb-4">
                <Flame className="h-6 w-6 text-cherryRed animate-pulse" />
              </div>
              <h3 className="text-sm md:text-base font-black text-cotton uppercase tracking-wider">Feed Cleared</h3>
              <p className="mt-2 text-xs md:text-sm font-semibold text-zinc-500 leading-relaxed max-w-[240px] mx-auto">
                No runways nearby. Launch one yourself or swap filters.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Swipe guides */}
      {currentMission && (
        <div className="flex justify-between items-center w-full px-2 mt-4 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 select-none pointer-events-none">
          <div className="flex items-center gap-1 opacity-70">
            <span>← Swipe Left to Pass</span>
          </div>
          <div className="flex items-center gap-1 text-luxuryGold/85">
            <span>Swipe Right to Lock In →</span>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-4 text-center text-xs md:text-sm font-bold text-cherryRed animate-pulse">
          {error}
        </p>
      )}

      {/* Swipe buttons */}
      {currentMission && (
        <div className="mt-5 md:mt-7 grid grid-cols-2 gap-3 md:gap-5 shrink-0">
          <button
            onClick={() => handleAction("pass")}
            className="flex h-11 md:h-13 items-center justify-center gap-1.5 rounded-xl border border-luxuryMaroon/20 bg-luxuryMaroon/5 text-xs md:text-sm font-bold uppercase tracking-wider text-cotton/80 transition hover:bg-luxuryMaroon/15 hover:text-cotton active:scale-[0.98]"
          >
            <X className="h-4 w-4 md:h-5 md:w-5" /> Pass
          </button>
          <button
            onClick={() => !locked && handleAction("accept")}
            disabled={locked}
            className={`flex h-11 md:h-13 items-center justify-center gap-1.5 rounded-xl border text-xs md:text-sm font-black uppercase tracking-wider transition active:scale-[0.98] ${
              locked
                ? "border-white/5 bg-[#1B1716]/40 text-zinc-600 cursor-not-allowed"
                : "border-cherryRed/50 bg-[#810100] text-cotton shadow-[0_0_24px_rgba(129,1,0,0.25)] hover:bg-[#810100]/95"
            }`}
          >
            <Check className="h-4 w-4 md:h-5 md:w-5 stroke-[3]" /> Lock In
          </button>
        </div>
      )}

      {/* Launch Mission Dialog Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="border-white/10 bg-zinc-950/95 text-white max-w-sm rounded-3xl backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black tracking-tight text-white uppercase">
              LAUNCH MISSION
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateMission} className="space-y-4 mt-2">
            <div className="space-y-1 text-left">
              <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                Runway Type
              </label>
              <div className="grid grid-cols-2 gap-2 bg-black/45 p-1 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, missionType: "group" })}
                  className={`h-8 rounded-lg text-[10px] font-black uppercase tracking-wider transition ${
                    form.missionType === "group"
                      ? "bg-cherryRed text-cotton shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Group Runway
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, missionType: "solo" })}
                  className={`h-8 rounded-lg text-[10px] font-black uppercase tracking-wider transition ${
                    form.missionType === "solo"
                      ? "bg-cherryRed text-cotton shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Solo Session
                </button>
              </div>
            </div>

            <div className="space-y-1 text-left">
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

            <div className="space-y-1 text-left">
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

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1 text-left">
                <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                  Category
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="h-10 w-full rounded-md border border-white/10 bg-black/40 px-2 text-xs text-white outline-none focus:border-luxuryGold cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-zinc-950 text-white">
                      {c.emoji ? `${c.emoji} ` : ""}{c.categoryName}
                    </option>
                  ))}
                </select>
              </div>

              {form.missionType === "group" && (
                <div className="space-y-1 text-left">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                    Meet Location
                  </label>
                  <select
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="h-10 w-full rounded-md border border-white/10 bg-black/40 px-2 text-xs text-white outline-none focus:border-luxuryGold cursor-pointer"
                  >
                    {[
                      "SRM KTR Library",
                      "SRM KTR Tech Park",
                      "SRM KTR Java Canteen",
                      "SRM KTR Bio-Tech Block",
                      "SRM KTR Cafe Court",
                      "SRM KTR UB Block"
                    ].map((spot) => (
                      <option key={spot} value={spot} className="bg-zinc-950 text-white">
                        {spot}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {form.missionType === "group" && (
              <div className="space-y-1 text-left">
                <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                  Datetime Schedule (Future Only)
                </label>
                <Input
                  type="datetime-local"
                  value={form.datetime}
                  min={new Date(Date.now() + 5 * 60000).toISOString().slice(0, 16)} // at least 5 minutes in the future
                  onChange={(e) => setForm({ ...form, datetime: e.target.value })}
                  className="h-10 border-white/10 bg-black/40 text-xs text-white"
                  required
                />
              </div>
            )}

            <div className="space-y-1.5 text-left border-t border-white/5 pt-3">
              <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                Runway Checklist (Optional)
              </label>
              <div className="flex gap-2">
                <Input
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Add task checklist item..."
                  className="h-9 border-white/10 bg-black/40 text-xs text-white"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTask();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={addTask}
                  className="h-9 px-3 rounded-lg border border-luxuryMaroon/20 bg-luxuryMaroon/5 text-xs text-cotton font-bold hover:bg-luxuryMaroon/15 transition"
                >
                  Add
                </button>
              </div>
              {tasks.length > 0 && (
                <div className="mt-2 max-h-24 overflow-y-auto space-y-1.5 bg-black/30 p-2 rounded-xl border border-white/5 scrollbar-thin">
                  {tasks.map((t, idx) => (
                    <div key={idx} className="flex justify-between items-center gap-2 bg-zinc-900/60 px-2.5 py-1 rounded-md">
                      <span className="text-[11px] text-cotton/90 truncate">{t}</span>
                      <button
                        type="button"
                        onClick={() => removeTask(idx)}
                        className="text-[10px] text-cherryRed font-bold hover:text-red-400 shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-luxuryGold/30 bg-luxuryGold text-xs font-black uppercase tracking-wider text-black shadow-[0_0_20px_rgba(197,168,128,0.2)] hover:bg-luxuryGold/95 transition active:scale-[0.98] disabled:opacity-50"
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
