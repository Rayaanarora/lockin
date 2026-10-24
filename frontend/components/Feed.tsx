"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "framer-motion";
import { X, Check, Plus, AlertCircle, Share2, RefreshCw, ImagePlus } from "lucide-react";
import { LockinMark } from "./ui/LockinLogo";
import { uploadImage } from "../lib/supabase";
import { User, Mission } from "../app/types";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input, fieldClass } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { spring } from "../lib/motion";
import { STARTER_QUESTS, StarterQuest, getStarterQuestsByPillar } from "../lib/starterQuests";

const SWIPE_THRESHOLD = 120;

const getDefaultDatetime = () => {
  const d = new Date(Date.now() + 2 * 60 * 60 * 1000);
  d.setMinutes(0, 0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const initials = (name = "?") =>
  name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

const formatDate = (value?: string | null) => {
  if (!value) return "Anytime";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return "Anytime";
    return new Intl.DateTimeFormat("en", {
      weekday: "short", hour: "numeric", minute: "2-digit", month: "short", day: "numeric"
    }).format(d);
  } catch {
    return "Anytime";
  }
};

interface FeedProps {
  user: User;
  refreshUser: () => Promise<void>;
  locked: boolean;
  setLocked: (locked: boolean) => void;
  api: (path: string, options?: RequestInit) => Promise<any>;
  setTab?: (tab: string) => void;
}

type Dir = "left" | "right";

export default function Feed({ user, refreshUser, locked, setLocked, api, setTab }: FeedProps) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [categories, setCategories] = useState<{ id: number; categoryName: string; emoji?: string; colorHex?: string }[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [createError, setCreateError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [exitDir, setExitDir] = useState<Dir>("left");
  const [busy, setBusy] = useState(false);
  const [lockedFlash, setLockedFlash] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: user.location || "SRM KTR Library",
    datetime: getDefaultDatetime(),
    categoryId: "1",
    missionType: "group"
  });
  const [tasks, setTasks] = useState<string[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showCustomizeCover, setShowCustomizeCover] = useState(false);
  const [coverColor, setCoverColor] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
  const [selectedPillar, setSelectedPillar] = useState<string>("All");

  const applyStarterQuest = useCallback((quest: StarterQuest) => {
    setSelectedQuestId(quest.id);
    const isSolo = quest.missionType === "solo";
    setForm({
      title: quest.title,
      description: quest.description,
      location: isSolo ? "Solo" : (user.location || quest.defaultLocation),
      datetime: isSolo ? new Date().toISOString().slice(0, 16) : getDefaultDatetime(),
      categoryId: String(quest.categoryId),
      missionType: quest.missionType
    });
    setTasks([...quest.tasks]);
    if (quest.coverColor) setCoverColor(quest.coverColor);
    if (quest.coverImage) setCoverImage(quest.coverImage);
  }, [user.location]);

  const addTask = () => {
    if (newTaskTitle.trim()) {
      setTasks([...tasks, newTaskTitle.trim()]);
      setNewTaskTitle("");
    }
  };

  const removeTask = (idx: number) => setTasks(tasks.filter((_, i) => i !== idx));

  async function load(catId: string = "all") {
    try {
      const [feed, lock] = await Promise.all([
        api(`/missions/feed?userId=${user.id}&categoryId=${catId}`),
        api(`/users/${user.id}/lock`).catch(() => ({ locked: false }))
      ]);
      setLocked(Boolean(lock?.locked));
      if (typeof window !== "undefined") {
        localStorage.removeItem(`lockin_passed_${user.id}`);
      }
      setMissions(Array.isArray(feed) ? feed : []);
      setIndex(0);
    } catch (err: any) {
      console.error("Feed load error:", err);
      setError(err.message || "Failed to load feed.");
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => { load(activeCategory); }, [user.id, activeCategory]);
  useEffect(() => {
    api("/missions/categories")
      .then((data) => setCategories(data))
      .catch((err) => console.error("Error loading categories:", err));
  }, []);

  const currentMission = missions[Math.min(index, Math.max(0, missions.length - 1))];

  const handleAction = useCallback(async (action: "accept" | "pass") => {
    if (!currentMission || busy) return;
    if (action === "accept" && locked) {
      setError("Mission queue full. Finish an active mission first.");
      return;
    }
    const mission = currentMission;
    setError("");
    setExitDir(action === "accept" ? "right" : "left");
    // Optimistic: the card leaves immediately; the server catches up behind it.
    setMissions((ms) => ms.filter((m) => m.id !== mission.id));

    if (action === "pass") {
      api(`/missions/${mission.id}/pass`, { method: "POST" }).catch(() => {});
      return;
    }

    setBusy(true);
    setLockedFlash(true);
    const minFlash = new Promise((r) => setTimeout(r, 900));
    try {
      try {
        await api(`/missions/${mission.id}/accept`, { method: "POST", body: JSON.stringify({}) });
      } catch (err: any) {
        // A retry after a lost response: the first attempt already joined.
        if (err?.status !== 409) throw err;
      }
      refreshUser().catch(() => {});
      await minFlash;
      setLockedFlash(false);
      setTab?.("active");
    } catch (err: any) {
      setLockedFlash(false);
      const status = err?.status;
      // Gone or already happened: leave it off the deck.
      if (status !== 404 && status !== 410) setMissions((ms) => (ms.some((m) => m.id === mission.id) ? ms : [mission, ...ms]));
      if (status === 423) setLocked(true);
      setError(err?.message || "Couldn't lock in. Try again.");
    } finally {
      setBusy(false);
    }
  }, [currentMission, busy, locked, api, refreshUser, setTab, setLocked]);

  // Keyboard: ← pass, → lock in
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (showCreate) return;
      const t = e.target as HTMLElement;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "ArrowLeft") handleAction("pass");
      if (e.key === "ArrowRight") handleAction("accept");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleAction, showCreate]);

  async function handleCreateMission(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setCreateError("");
    setError("");
    try {
      const isSolo = form.missionType === "solo";
      const payload = {
        ...form,
        creator_id: user.id,
        categoryId: Number(form.categoryId),
        location: isSolo ? "Solo" : form.location,
        datetime: isSolo ? new Date().toISOString() : (form.datetime ? new Date(form.datetime).toISOString() : new Date().toISOString()),
        coverColor: coverColor || null,
        coverImage: coverImage || null
      };
      const newMission = await api("/missions", { method: "POST", body: JSON.stringify(payload) });
      if (tasks.length > 0 && newMission?.id) {
        // The mission exists now. A task hiccup must not leave the form open,
        // or a retry would launch the mission twice.
        await api("/tasks/batch", {
          method: "POST",
          body: JSON.stringify({ missionId: newMission.id, tasks: tasks.map((t, idx) => ({ title: t, position: idx })) })
        }).catch(() => setError("Mission launched, but its tasks didn't save. Add them from your queue."));
      }
      setShowCreate(false);
      setTab?.("active");
      setForm({
        title: "", description: "", location: user.location || "SRM KTR Library",
        datetime: getDefaultDatetime(), categoryId: categories[0]?.id ? String(categories[0].id) : "1", missionType: "group"
      });
      setTasks([]);
      setCoverColor("");
      setCoverImage("");
      setShowCustomizeCover(false);
      setSelectedQuestId(null);
      await load(activeCategory);
    } catch (err: any) {
      setCreateError(err.message || "Could not launch mission.");
    } finally {
      setSubmitting(false);
    }
  }

  const remaining = missions.length;
  const deck = missions.slice(index + 1, index + 3);

  return (
    <section className="mx-auto w-full max-w-md flex-1 px-5 pt-2 md:max-w-[1240px] md:px-12 md:pt-12">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 border-b border-line pb-4 md:pb-8">
        <div>
          <p className="t-section">Campus · Live</p>
          <h1 className="t-display mt-3 text-large-title text-ink md:text-[56px] md:leading-none">Missions</h1>
          <p className="mt-2 text-subhead text-ink-3">
            {loaded ? (remaining > 0 ? `${remaining} waiting on your call` : "You're all caught up") : "Scanning campus…"}
          </p>
        </div>
        <motion.button
          type="button"
          onClick={() => setShowCreate(true)}
          whileTap={{ scale: 0.95 }}
          whileHover="hover"
          transition={spring.snap}
          className="group btn-primary h-11 shrink-0 px-4 md:h-12 md:px-6"
        >
          <motion.span variants={{ hover: { rotate: 90 } }} transition={spring.snap} className="flex">
            <Plus className="h-4 w-4" strokeWidth={1.75} />
          </motion.span>
          Launch
        </motion.button>
      </div>

      {/* Categories */}
      <div className="-mx-5 flex gap-1 overflow-x-auto border-b border-line px-5 py-2 scrollbar-none md:mx-0 md:justify-center md:px-0" role="tablist" aria-label="Mission categories">
        {[{ id: "all", categoryName: "All" }, ...categories].map((c) => {
          const key = String(c.id);
          const selected = activeCategory === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => { setActiveCategory(key); setError(""); }}
              className={`relative flex h-11 shrink-0 items-center px-3 text-[11px] font-medium uppercase tracking-[0.2em] transition-colors ${selected ? "text-ink" : "text-ink-3 hover:text-ink-2"}`}
            >
              {c.categoryName}
              {selected && <motion.span layoutId="cat-active" className="absolute inset-x-3 bottom-1.5 h-px bg-signal" transition={spring.glide} />}
            </button>
          );
        })}
      </div>

      {/* Quick Side Quests Rail */}
      <div className="-mx-5 flex items-center gap-2 overflow-x-auto border-b border-line/60 bg-raised/20 px-5 py-2.5 scrollbar-none md:mx-0 md:justify-center md:px-0">
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-3">
          Side Quests
        </span>
        <span className="h-3 w-px bg-line shrink-0" />
        {STARTER_QUESTS.slice(0, 10).map((q) => (
          <button
            key={q.id}
            type="button"
            onClick={() => {
              applyStarterQuest(q);
              setShowCreate(true);
            }}
            className="group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-footnote text-ink-2 transition hover:border-ink hover:text-ink active:scale-95"
          >
            <span className="text-[10px] text-crimson">⚡</span>
            <span>{q.shortTitle}</span>
            <span className="text-[10px] text-ink-3 group-hover:text-ink-2">· {q.badge}</span>
          </button>
        ))}
      </div>

      {/* The deck: one card, centred, the whole point of the page */}
      <div className="mx-auto mt-4 w-full max-w-[640px] md:mt-10">
        <AnimatePresence>
          {locked && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="mb-5 flex items-center gap-3 rounded-sm border border-signal/70 p-4">
                <AlertCircle className="h-4 w-4 shrink-0 text-crimson" strokeWidth={1.5} />
                <p className="text-subhead text-ink-2">
                  <span className="text-ink">Queue full.</span> Finish one of your 3 active missions to lock in again.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative perspective-distant">
          {deck.slice().reverse().map((m) => {
            const depth = missions.indexOf(m) - index; // 1 or 2
            return (
              <motion.div
                key={`deck-${m.id}`}
                aria-hidden="true"
                initial={false}
                animate={{ scale: 1 - depth * 0.045, y: depth * 14, opacity: 1 - depth * 0.38 }}
                transition={spring.card}
                className="pointer-events-none absolute inset-0 rounded-sm border border-line bg-surface"
              />
            );
          })}

          <AnimatePresence custom={exitDir} initial={false} mode="popLayout">
            {currentMission ? (
              <SwipeCard key={currentMission.id} mission={currentMission} exitDir={exitDir} onSwipe={(dir) => handleAction(dir === "right" ? "accept" : "pass")} />
            ) : loaded ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={spring.glide}
                className="relative flex min-h-[360px] w-full flex-col overflow-hidden rounded-sm border border-line bg-surface p-6 md:min-h-[560px] md:p-10"
              >
                <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-signal" />
                <div className="flex items-start justify-between">
                  <p className="t-section">Deck cleared</p>
                  <LockinMark size={56} className="text-ink/15 md:hidden" />
                  <LockinMark size={96} className="hidden text-ink/15 md:block" />
                </div>
                <div className="mt-auto pt-6">
                  <h2 className="t-display text-[26px] leading-[1.04] text-ink sm:text-[34px] md:text-[44px]">
                    Deck cleared. Pick a side quest to start:
                  </h2>
                  <p className="mt-1 text-subhead text-ink-3">
                    Instant 1-tap template you can launch immediately or customize.
                  </p>

                  <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {STARTER_QUESTS.slice(0, 4).map((q) => (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => {
                          applyStarterQuest(q);
                          setShowCreate(true);
                        }}
                        className="group flex items-start justify-between rounded-xl border border-line bg-raised p-3 text-left transition hover:border-ink hover:bg-overlay"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-crimson bg-crimson/10 mb-1">
                            {q.badge} · {q.pillar}
                          </span>
                          <p className="text-subhead font-semibold text-ink line-clamp-1 group-hover:text-ink">{q.title}</p>
                          <p className="text-footnote text-ink-3 line-clamp-1 mt-0.5">{q.description}</p>
                        </div>
                        <Plus className="h-4 w-4 text-ink-3 shrink-0 mt-1 group-hover:text-ink transition" />
                      </button>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:gap-3">
                    <button type="button" onClick={() => setShowCreate(true)} className="btn-primary h-12 sm:h-14 sm:flex-1">
                      <Plus className="h-4 w-4" strokeWidth={1.75} /> Custom mission
                    </button>
                    <button type="button" onClick={() => { setActiveCategory("all"); load("all"); }} className="btn-ghost h-12 sm:h-14 sm:px-6">
                      <RefreshCw className="h-4 w-4" strokeWidth={1.75} /> Refresh deck
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div key="loading" className="min-h-[360px] w-full animate-pulse rounded-sm border border-line bg-surface md:min-h-[560px]" />
            )}
          </AnimatePresence>

          {/* Lock-in moment */}
          <AnimatePresence>
            {lockedFlash && (
              <motion.div
                key="flash"
                className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.25 } }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="absolute h-40 w-40 rounded-full border border-signal"
                    initial={{ scale: 0.3, opacity: 0.9 }}
                    animate={{ scale: 2.6, opacity: 0 }}
                    transition={{ duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  />
                ))}
                <motion.div
                  initial={{ scale: 0.92, opacity: 0, letterSpacing: "0.6em" }}
                  animate={{ scale: 1, opacity: 1, letterSpacing: "0.32em" }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-sm border border-ink bg-bg px-8 py-4 text-subhead font-medium uppercase text-ink"
                >
                  Locked in
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {error && (
            <motion.p role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 text-center text-subhead text-crimson">
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {currentMission && (
          <>
            <div className="mt-4 grid grid-cols-[1fr_2fr] gap-3 md:mt-6">
              <motion.button type="button" onClick={() => handleAction("pass")} disabled={busy} whileTap={{ scale: 0.97 }} transition={spring.snap} className="btn-ghost h-14 md:h-16">
                <X className="h-4 w-4" strokeWidth={1.75} /> Pass
              </motion.button>
              <motion.button type="button" onClick={() => handleAction("accept")} disabled={locked || busy} whileTap={{ scale: 0.97 }} transition={spring.snap} className="btn-primary h-14 md:h-16">
                <Check className="h-4 w-4" strokeWidth={1.75} /> Lock in
              </motion.button>
            </div>
            <p className="t-label mt-4 text-center">
              <span className="md:hidden">Swipe right to lock in · left to pass</span>
              <span className="hidden md:inline">Swipe, or ← pass · → lock in</span>
            </p>
          </>
        )}
      </div>

      {/* Create mission */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Launch a mission</DialogTitle>
            <DialogDescription>Say what you're doing, when and where. People on your campus can lock in with you.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateMission} className="space-y-5">
            {/* Starter Quest Templates Selector */}
            <div className="rounded-xl border border-line bg-raised/70 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="t-label text-[11px] font-semibold text-ink">Side Quest Templates (1-Tap Fill)</span>
                {selectedQuestId && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedQuestId(null);
                      setForm({
                        title: "",
                        description: "",
                        location: user.location || "SRM KTR Library",
                        datetime: getDefaultDatetime(),
                        categoryId: categories[0]?.id ? String(categories[0].id) : "1",
                        missionType: "group"
                      });
                      setTasks([]);
                      setCoverColor("");
                      setCoverImage("");
                    }}
                    className="text-caption font-medium uppercase tracking-wider text-ink-3 hover:text-ink"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Pillar filters */}
              <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
                {["All", "Physical", "Grind", "Discipline", "Social"].map((pillar) => (
                  <button
                    key={pillar}
                    type="button"
                    onClick={() => setSelectedPillar(pillar)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                      selectedPillar === pillar
                        ? "bg-ink text-bg font-semibold"
                        : "bg-surface text-ink-3 hover:text-ink hover:bg-overlay"
                    }`}
                  >
                    {pillar}
                  </button>
                ))}
              </div>

              {/* Templates scroller */}
              <div className="flex gap-2.5 overflow-x-auto scrollbar-none pb-1">
                {getStarterQuestsByPillar(selectedPillar).map((q) => {
                  const isSelected = selectedQuestId === q.id;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => applyStarterQuest(q)}
                      className={`flex w-44 shrink-0 flex-col justify-between rounded-lg border p-2.5 text-left transition ${
                        isSelected
                          ? "border-crimson bg-surface ring-1 ring-crimson shadow-[0_0_12px_rgba(210,4,45,0.15)]"
                          : "border-line bg-surface hover:border-ink/50 hover:bg-overlay"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-bold text-crimson">{q.badge}</span>
                        <span className="text-[9px] uppercase tracking-wider text-ink-3">{q.pillar}</span>
                      </div>
                      <p className="text-subhead font-medium text-ink line-clamp-1">{q.title}</p>
                      <p className="text-[11px] text-ink-3 mt-1">{q.focusDuration} min · {q.missionType}</p>
                    </button>
                  );
                })}
              </div>

              {selectedQuestId && (
                <div className="flex items-center gap-2 rounded-lg bg-surface px-2.5 py-1.5 text-footnote text-ink-2 border border-line">
                  <span className="text-crimson font-bold text-xs">✓</span>
                  <span>Template loaded · You can customize any title, tasks, time, or location below.</span>
                </div>
              )}
            </div>

            {createError && (
              <div role="alert" className="flex items-center gap-2.5 rounded-xl border border-signal/70 bg-surface p-3 text-subhead text-ink">
                <AlertCircle className="h-5 w-5 shrink-0 text-crimson" />
                <span>{createError}</span>
              </div>
            )}

            <Field label="Type">
              <div className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-raised p-1" role="radiogroup">
                {["group", "solo"].map((t) => {
                  const on = form.missionType === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setForm({ ...form, missionType: t })}
                      className={`relative h-10 rounded-sm text-footnote font-medium uppercase tracking-[0.22em] transition-colors ${on ? "text-bg" : "text-ink-3 hover:text-ink-2"}`}
                    >
                      {on && <motion.span layoutId="type-active" className="absolute inset-0 rounded-sm bg-ink" transition={spring.snap} />}
                      <span className="relative">{t === "group" ? "Group" : "Solo"}</span>
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field label="Mission" htmlFor="m-title">
              <Input id="m-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="LeetCode lock-in" required />
            </Field>

            <Field label="What gets done" htmlFor="m-desc">
              <Textarea id="m-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Five mediums on graphs. No phones." required />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Category" htmlFor="m-cat">
                <select
                  id="m-cat"
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className={`${fieldClass} h-12 appearance-none`}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-surface text-ink">
                      {c.categoryName}
                    </option>
                  ))}
                </select>
              </Field>

              {form.missionType === "group" && (
                <Field label="Where" htmlFor="m-loc">
                  <Input id="m-loc" list="campus-locations-list" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Central Library" required />
                  <datalist id="campus-locations-list">
                    <option value="SRM KTR Library" />
                    <option value="SRM KTR Tech Park" />
                    <option value="SRM KTR Java Canteen" />
                    <option value="SRM KTR Bio-Tech Block" />
                    <option value="SRM KTR UB Block" />
                    <option value="Campus Central Library" />
                    <option value="Hostel Common Room" />
                    <option value="Online / Discord" />
                  </datalist>
                </Field>
              )}
            </div>

            {form.missionType === "group" && (
              <Field label="When" htmlFor="m-when">
                <Input
                  id="m-when"
                  type="datetime-local"
                  value={form.datetime}
                  min={new Date(Date.now() + 5 * 60000).toISOString().slice(0, 16)}
                  onChange={(e) => setForm({ ...form, datetime: e.target.value })}
                  required
                />
              </Field>
            )}

            <Field label="Checklist" hint="Optional. Tasks count toward your outcome." htmlFor="m-task">
              <div className="flex gap-2">
                <Input
                  id="m-task"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Add a task"
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTask(); } }}
                />
                <button type="button" onClick={addTask} className="h-12 shrink-0 rounded-xl border border-line bg-raised px-4 text-subhead font-semibold text-ink transition-colors hover:bg-overlay">
                  Add
                </button>
              </div>
              <AnimatePresence initial={false}>
                {tasks.map((t, idx) => (
                  <motion.div
                    key={`${t}-${idx}`}
                    layout
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12, transition: { duration: 0.15 } }}
                    className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-line bg-raised py-1 pl-3.5 pr-1"
                  >
                    <span className="truncate text-subhead text-ink">{t}</span>
                    <button type="button" onClick={() => removeTask(idx)} aria-label={`Remove ${t}`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-ink-3 transition-colors hover:text-crimson">
                      <X className="h-4 w-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </Field>

            {/* Cover */}
            <div className="border-t border-line pt-4">
              <button
                type="button"
                onClick={() => setShowCustomizeCover(!showCustomizeCover)}
                aria-expanded={showCustomizeCover}
                className="flex w-full items-center justify-between py-1 text-left"
              >
                <span className="t-label">Cover &amp; accent</span>
                <motion.span animate={{ rotate: showCustomizeCover ? 45 : 0 }} transition={spring.snap}>
                  <Plus className="h-5 w-5 text-ink-3" />
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {showCustomizeCover && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-4 pt-4">
                      <div className="flex items-center gap-3">
                        {[
                          { name: "Crimson", value: "#B11226" },
                          { name: "Emerald", value: "#10B981" },
                          { name: "Gold", value: "#C5A880" },
                          { name: "Indigo", value: "#6366F1" },
                          { name: "Violet", value: "#8B5CF6" }
                        ].map((color) => (
                          <motion.button
                            key={color.name}
                            type="button"
                            whileTap={{ scale: 0.85 }}
                            onClick={() => setCoverColor(coverColor === color.value ? "" : color.value)}
                            aria-label={`${color.name} accent`}
                            aria-pressed={coverColor === color.value}
                            className="flex h-11 w-11 items-center justify-center rounded-full"
                          >
                            <span
                              className={`h-7 w-7 rounded-sm ring-1 ring-offset-2 ring-offset-surface transition ${coverColor === color.value ? "ring-ink" : "ring-transparent"}`}
                              style={{ backgroundColor: color.value }}
                            />
                          </motion.button>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { name: "Ember", value: "linear-gradient(135deg, #2a0705 0%, #0b0b0b 100%)" },
                          { name: "Night", value: "linear-gradient(135deg, #141414 0%, #050505 100%)" },
                          { name: "Brass", value: "linear-gradient(135deg, #241b10 0%, #0b0b0b 100%)" },
                          { name: "Deep", value: "linear-gradient(135deg, #0f1c1e 0%, #0b0b0b 100%)" }
                        ].map((preset) => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => setCoverImage(coverImage === preset.value ? "" : preset.value)}
                            aria-pressed={coverImage === preset.value}
                            className={`h-12 rounded-xl border text-footnote font-semibold text-ink transition ${
                              coverImage === preset.value ? "border-ink" : "border-line"
                            }`}
                            style={{ background: preset.value }}
                          >
                            {preset.name}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          accept="image/*"
                          id="cover-upload"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            e.target.value = "";
                            if (file) {
                              setCreateError("");
                              uploadImage(file).then(setCoverImage).catch((err) => setCreateError(err.message));
                            }
                          }}
                        />
                        <label
                          htmlFor="cover-upload"
                          className="flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-line bg-raised px-4 text-subhead font-medium text-ink transition-colors hover:bg-overlay"
                        >
                          <ImagePlus className="h-4 w-4" /> Upload image
                        </label>
                        {coverImage && !coverImage.includes("gradient") && <span className="text-subhead text-success">Image added</span>}
                        {coverImage && (
                          <button type="button" onClick={() => setCoverImage("")} className="text-subhead text-ink-3 hover:text-ink">
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.button
              type="submit"
              disabled={submitting}
              whileTap={{ scale: 0.97 }}
              className="flex h-14 w-full items-center justify-center gap-2 disabled:opacity-50 btn-primary"
            >
              {submitting ? (
                <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}>
                  <RefreshCw className="h-5 w-5" />
                </motion.span>
              ) : (
                <Plus className="h-5 w-5" strokeWidth={2.5} />
              )}
              {submitting ? "Launching" : "Launch mission"}
            </motion.button>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}

/* ───────────────────────── Card pieces ───────────────────────── */

/* ───────────────────────── Departures board ───────────────────────── */

const pad = (n: number) => String(n).padStart(2, "0");

function clock(now: number) {
  const d = new Date(now);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** "02:41:09", "2D 04H", or "NOW". */
function countdown(target?: string | null, now: number = Date.now()) {
  if (!target) return { text: "NOW", soon: false, live: true };
  const ms = new Date(target).getTime() - now;
  if (isNaN(ms) || ms <= 0) return { text: "NOW", soon: true, live: true };
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d >= 1) return { text: `${d}D ${pad(h)}H`, soon: false, live: false };
  return { text: `${pad(h)}:${pad(m)}:${pad(s % 60)}`, soon: ms < 3600e3, live: false };
}

const handleOf = (name?: string) => (name || "host").toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "");

/** Split-flap digits: each character flips in when it changes. */
function Flap({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span className={`tabular inline-flex ${className}`} aria-label={text}>
      {text.split("").map((ch, i) => (
        <span key={i} className="relative inline-flex overflow-hidden" aria-hidden="true">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={ch + i}
              className="inline-block"
              initial={{ y: "100%" }}
              animate={{ y: "0%" }}
              exit={{ y: "-100%" }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {ch === " " ? " " : ch}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  );
}

function Field({ label, hint, htmlFor, children }: { label: string; hint?: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="t-label block">{label}</label>
      {children}
      {hint && <p className="text-footnote text-ink-3">{hint}</p>}
    </div>
  );
}

/**
 * Ticking clock for countdowns. Lives in the card, not the whole board, so the
 * page doesn't re-render every second (that made swiping feel laggy on phones).
 */
function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function CardBody({ mission }: { mission: Mission }) {
  const now = useNow();
  const isSystem = Boolean(mission.is_system || mission.mission_type === "side_quest" || !mission.creator_id || !mission.creator_name);
  const t = countdown(mission.datetime, now);
  const hoursUntil = mission.datetime ? (new Date(mission.datetime).getTime() - now) / 3600e3 : 0;
  const soon = Math.min(1, Math.max(0.04, 1 - hoursUntil / 48));
  const photo = mission.cover_image && !mission.cover_image.includes("gradient") ? mission.cover_image : null;
  const crew = mission.locked_in_count ?? 0;

  return (
    <div className="relative flex min-h-[360px] flex-1 flex-col p-5 md:min-h-[560px] md:p-10">
      <div className="relative flex items-start justify-between gap-3">
        {isSystem ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-signal/60 bg-signal/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-crimson">
              <span className="h-1.5 w-1.5 rounded-full bg-crimson animate-pulse" />
              Side Quest Protocol
            </span>
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-3">
              · {mission.category_name || "Protocol"}
            </span>
          </div>
        ) : (
          <p className="t-section">
            Mission #{pad(mission.id).padStart(4, "0")} · {mission.category_name || (mission.mission_type === "solo" ? "Solo" : "Group")}
          </p>
        )}
        <button
          type="button"
          onPointerDownCapture={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            const origin = typeof window !== "undefined" ? window.location.origin : "https://lockin.top";
            const text = isSystem
              ? `*Side Quest: ${mission.title}* on LOCKIN\n${mission.description}\n\nDuration: ${mission.focus_duration || 25} min focus\nLocation: ${mission.location || "Anywhere"}\n\nLock in: ${origin}`
              : `*${mission.title}* on LOCKIN\n${mission.description}\n\nWhere: ${mission.location || "Campus"}\nWhen: ${mission.datetime ? formatDate(mission.datetime) : "Anytime"}\nHost: ${mission.creator_name || "Campus peer"}\n\nLock in: ${origin}`;
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
          }}
          aria-label="Share mission on WhatsApp"
          className="-mr-2 -mt-3 flex h-11 w-11 shrink-0 items-center justify-center text-ink-3 transition-colors hover:text-ink"
        >
          <Share2 className="h-[18px] w-[18px]" strokeWidth={1.5} />
        </button>
      </div>

      <h2 className="t-display relative mt-4 line-clamp-3 text-[32px] leading-[1.04] text-ink md:mt-8 md:text-[60px] md:leading-[0.98] md:tracking-[-0.04em]">
        {mission.title}
      </h2>

      {photo && (
        <div className="relative mt-5 h-36 overflow-hidden rounded-sm border border-line md:h-52">
          <img src={photo} alt="" className="h-full w-full object-cover grayscale-[35%]" />
        </div>
      )}

      <p className={`relative mt-3 max-w-[52ch] text-subhead leading-relaxed text-ink-2 md:mt-5 md:text-[17px] ${photo ? "line-clamp-2" : "line-clamp-2 md:line-clamp-3"}`}>{mission.description}</p>

      <div className="relative mt-auto pt-6 md:pt-8">
        <div className="flex items-end justify-between gap-4">
          {isSystem ? (
            <div>
              <p className="t-label text-crimson">Focus session</p>
              <p className="t-display mt-2 text-[34px] leading-none text-ink md:text-[56px]">
                {mission.focus_duration || 25} <span className="text-[20px] md:text-[28px] font-light text-ink-3">MIN</span>
              </p>
            </div>
          ) : (
            <div>
              <p className="t-label">{t.live ? "Started" : "Leaves in"}</p>
              <p className={`t-display mt-2 text-[34px] leading-none md:text-[56px] ${t.soon ? "text-crimson" : "text-ink"}`}>
                {t.live ? "Now" : <Flap text={t.text} />}
              </p>
            </div>
          )}
          <p className="t-label shrink-0 pb-1 text-right">
            {isSystem ? (
              <>
                <span className="block text-callout normal-case tracking-normal text-crimson font-semibold">Start anytime</span>
                On demand
              </>
            ) : (
              <>
                <span className="block text-callout normal-case tracking-normal text-ink">{crew}</span>
                locked in
              </>
            )}
          </p>
        </div>

        <div className="relative mt-4 h-px bg-line">
          {isSystem ? (
            <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-crimson via-signal to-transparent opacity-80" />
          ) : (
            <motion.div className="absolute inset-y-0 left-0 bg-signal" initial={{ width: 0 }} animate={{ width: `${soon * 100}%` }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
          )}
        </div>

        <div className="mt-4 grid grid-cols-[1fr_auto] gap-4">
          <p className="t-label truncate">
            {isSystem ? `Anytime · ${mission.location || "Anywhere"}` : `${mission.datetime ? formatDate(mission.datetime) : "Anytime"} · ${mission.location || "Campus"}`}
          </p>
          <p className="t-label truncate">
            {isSystem ? (
              <span className="text-crimson font-semibold tracking-[0.16em]">LOCKIN PROTOCOL</span>
            ) : (
              `@${handleOf(mission.creator_name || undefined)}`
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

const flyOut = {
  exit: (dir: Dir) => ({
    x: dir === "right" ? 520 : -520,
    rotate: dir === "right" ? 24 : -24,
    opacity: 0,
    transition: { duration: 0.42, ease: [0.4, 0, 0.6, 1] }
  })
};

const SwipeCard = React.forwardRef<HTMLElement, { mission: Mission; exitDir: Dir; onSwipe: (dir: Dir) => void }>(function SwipeCard({ mission, exitDir, onSwipe }, forwarded) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-240, 240], [-8, 8]);
  const acceptOpacity = useTransform(x, [30, SWIPE_THRESHOLD], [0, 1]);
  const passOpacity = useTransform(x, [-SWIPE_THRESHOLD, -30], [1, 0]);
  const acceptScale = useTransform(x, [30, SWIPE_THRESHOLD], [0.8, 1]);
  const passScale = useTransform(x, [-SWIPE_THRESHOLD, -30], [1, 0.8]);
  const edgeGlow = useTransform(x, [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD], [
    "0 0 0 1px rgb(120,118,115)",
    "0 0 0 1px rgb(32,32,32)",
    "0 0 0 1px rgb(244,242,238)"
  ]);

  // Fine-pointer tilt + glare
  const tx = useMotionValue(0);
  const ty = useMotionValue(0);
  const sx = useSpring(tx, { stiffness: 250, damping: 28 });
  const sy = useSpring(ty, { stiffness: 250, damping: 28 });
  const rotateX = useTransform(sy, [-0.5, 0.5], ["3deg", "-3deg"]);
  const rotateY = useTransform(sx, [-0.5, 0.5], ["-3deg", "3deg"]);
  const gx = useTransform(sx, [-0.5, 0.5], [0, 100]);
  const gy = useTransform(sy, [-0.5, 0.5], [0, 100]);
  const glare = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.14), transparent 55%)`;
  const ref = useRef<HTMLElement | null>(null);

  return (
    <motion.article
      ref={(el: HTMLElement | null) => {
        (ref as React.MutableRefObject<HTMLElement | null>).current = el;
        if (typeof forwarded === "function") forwarded(el);
        else if (forwarded) (forwarded as React.MutableRefObject<HTMLElement | null>).current = el;
      }}
      custom={exitDir}
      variants={flyOut}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      dragSnapToOrigin
      onDragEnd={(_, info) => {
        const power = info.offset.x + info.velocity.x * 0.2;
        if (power > SWIPE_THRESHOLD) onSwipe("right");
        else if (power < -SWIPE_THRESHOLD) onSwipe("left");
      }}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse" || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        tx.set((e.clientX - r.left) / r.width - 0.5);
        ty.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onPointerLeave={() => { tx.set(0); ty.set(0); }}
      initial={{ scale: 0.95, y: 14, opacity: 0.65 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      exit="exit"
      whileDrag={{ scale: 1.03, cursor: "grabbing" }}
      transition={spring.card}
      style={{ x, rotate, rotateX, rotateY, boxShadow: edgeGlow }}
      className="relative z-10 flex w-full cursor-grab touch-pan-y select-none flex-col overflow-hidden rounded-sm bg-surface transform-3d"
      aria-roledescription="Mission card"
      aria-label={mission.title}
    >
      <CardBody mission={mission} />


      {/* Stamps */}
      <motion.div
        style={{ opacity: acceptOpacity, scale: acceptScale }}
        className="pointer-events-none absolute left-6 top-1/2 z-30 -rotate-6 rounded-sm border border-ink bg-bg px-4 py-2 text-footnote font-medium uppercase tracking-[0.32em] text-ink"
      >
        Lock in
      </motion.div>
      <motion.div
        style={{ opacity: passOpacity, scale: passScale }}
        className="pointer-events-none absolute right-6 top-1/2 z-30 rotate-6 rounded-sm border border-ink-3 bg-bg px-4 py-2 text-footnote font-medium uppercase tracking-[0.32em] text-ink-3"
      >
        Pass
      </motion.div>
    </motion.article>
  );
});
