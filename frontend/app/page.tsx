"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, HTMLMotionProps } from "framer-motion";
import { io } from "socket.io-client";
import {
  Activity,
  CalendarClock,
  Check,
  ChevronLeft,
  Flame,
  Lock,
  MapPin,
  MessageCircle,
  Plus,
  Send,
  Shield,
  User as UserIcon,
  X
} from "lucide-react";
import { User, Mission, Message } from "./types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const SOCKET_URL = API.replace("/api", "");

async function api(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

function initials(name = "?") {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

function timeLeft(value: string) {
  const diff = new Date(value).getTime() - Date.now();
  if (diff <= 0) return "Now";
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  return `${hours}h ${minutes}m`;
}

function missionDue(value: string) {
  return new Date(value).getTime() <= Date.now();
}

function participationScore(value = 0) {
  return Math.max(0, Math.min(100, value));
}

interface ShellProps {
  children: React.ReactNode;
}

function Shell({ children }: ShellProps) {
  return (
    <main className="relative flex min-h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      <div className="grid-noise pointer-events-none absolute inset-0 opacity-90" />
      <div className="race-stripe pointer-events-none absolute left-0 right-0 top-0 h-1.5 opacity-95" />
      <motion.div
        className="pointer-events-none absolute -right-24 top-10 h-80 w-80 rounded-full bg-boxRed/25 blur-3xl"
        animate={{ y: [0, 24, 0], opacity: [.35, .75, .35] }}
        transition={{ duration: 5, repeat: Infinity }}
      />
      <motion.div
        className="pointer-events-none absolute -left-20 bottom-20 h-96 w-96 rounded-full bg-boxOrange/18 blur-3xl"
        animate={{ y: [0, -28, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 6, repeat: Infinity }}
      />
      <div className="relative z-10 flex min-h-screen flex-col">{children}</div>
    </main>
  );
}

interface NeonButtonProps extends HTMLMotionProps<"button"> {
  tone?: "blue" | "red" | "green" | "purple";
}

function NeonButton({ children, tone = "blue", className = "", ...props }: NeonButtonProps) {
  const tones = {
    blue: "border-white/20 bg-white text-black shadow-[0_0_28px_rgba(255,255,255,.16)] hover:bg-zinc-200",
    red: "border-boxRed/50 bg-boxRed text-white shadow-[0_0_28px_rgba(245,38,1,.34)] hover:bg-[#ff3a18]",
    green: "border-boxGreen/50 bg-boxGreen text-black shadow-[0_0_28px_rgba(24,189,0,.28)] hover:bg-[#22df00]",
    purple: "border-boxOrange/50 bg-boxOrange text-black shadow-[0_0_28px_rgba(247,128,5,.30)] hover:bg-[#ff941f]"
  };

  return (
    <motion.button
      whileTap={{ scale: .96 }}
      whileHover={{ y: -1 }}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-black transition disabled:pointer-events-none disabled:opacity-50 ${tones[tone]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}

interface ProfileGateProps {
  onReady: (user: User) => void;
}

function ProfileGate({ onReady }: ProfileGateProps) {
  const [form, setForm] = useState({
    name: "",
    college: "SRM Institute of Science and Technology KTR",
    college_id: "",
    department: "",
    location: ""
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const user = await api("/users", {
        method: "POST",
        body: JSON.stringify(form)
      });
      localStorage.setItem("lockin_user_id", String(user.id));
      onReady(user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell>
      <section className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-5 py-8 md:grid-cols-[.95fr_1.05fr] lg:px-8">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="hidden md:block">
          <div className="mb-7 flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-boxRed/40 bg-boxRed/15 shadow-[0_0_40px_rgba(245,38,1,.28)]">
              <Lock className="h-7 w-7 text-boxRed" />
            </div>
            <div>
              <h1 className="text-5xl font-black tracking-normal">LOCKIN</h1>
              <p className="text-base font-semibold text-white/60">Stop chatting. Start showing up.</p>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <p className="text-sm font-semibold text-zinc-300">Mission system for students who actually show up.</p>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {["Swipe", "Accept", "Execute"].map((item, itemIndex) => (
                <div key={item} className={`rounded-xl border p-4 text-sm font-black ${itemIndex === 0 ? "border-boxRed/35 bg-boxRed/12 text-white" : itemIndex === 1 ? "border-boxOrange/35 bg-boxOrange/12 text-boxOrange" : "border-boxGreen/35 bg-boxGreen/12 text-boxGreen"}`}>{item}</div>
              ))}
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-5 flex items-center gap-3 md:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-boxRed/40 bg-boxRed/15">
              <Lock className="h-6 w-6 text-boxRed" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-normal">LOCKIN</h1>
              <p className="text-sm font-semibold text-mutedForeground">Stop chatting. Start showing up.</p>
            </div>
          </div>
          <form onSubmit={submit} className="glass rounded-xl p-5 md:p-6">
            <div className="mb-5">
              <p className="text-xs font-bold uppercase text-mutedForeground">Mandatory entry</p>
              <h2 className="mt-1 text-2xl font-bold">Build your execution profile</h2>
            </div>
            {[
              ["name", "Name"],
              ["college", "College"],
              ["college_id", "College ID"],
              ["department", "Department / Year"],
              ["location", "Location"]
            ].map(([key, label]) => (
              <label key={key} className="mb-3 block">
                <span className="mb-1 block text-xs font-bold uppercase text-mutedForeground">{label}</span>
                <input
                  value={form[key as keyof typeof form]}
                  onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                  className="h-12 w-full rounded-md border border-white/10 bg-black/55 px-3 text-sm font-medium text-white outline-none transition placeholder:text-zinc-500 focus:border-boxOrange focus:ring-4 focus:ring-boxOrange/10"
                  required
                />
              </label>
            ))}
            {error ? <p className="mb-3 text-sm font-bold text-boxRed">{error}</p> : null}
            <NeonButton tone="green" className="mt-2 w-full" disabled={busy} type="submit">
              <Flame className="h-5 w-5" /> {busy ? "Locking..." : "Enter LOCKIN"}
            </NeonButton>
          </form>
        </motion.div>
      </section>
    </Shell>
  );
}

interface HeaderProps {
  user: User | null;
}

function Header({ user }: HeaderProps) {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 pt-5 lg:px-8">
      <div>
        <p className="text-xs font-bold uppercase text-mutedForeground">Coding missions only</p>
        <h1 className="text-3xl font-black tracking-tight">LOCKIN</h1>
      </div>
      <div className="flex items-center gap-2 rounded-md border border-boxGreen/30 bg-boxGreen/12 px-3 py-2 shadow-[0_0_24px_rgba(24,189,0,.14)]">
        <Shield className="h-4 w-4 text-boxGreen" />
        <span className="text-sm font-black text-white">{user?.reputation_score ?? 0} PS</span>
      </div>
    </header>
  );
}

interface MissionCardProps {
  mission: Mission;
  onPass: () => void;
  onAccept: () => void;
}

function MissionCard({ mission, onPass, onAccept }: MissionCardProps) {
  return (
    <motion.article
      key={mission.id}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(_, info) => {
        if (info.offset.x > 120) onAccept();
        if (info.offset.x < -120) onPass();
      }}
      initial={{ opacity: 0, scale: .92, y: 28, rotateX: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
      exit={{ opacity: 0, scale: .86, y: -30 }}
      whileDrag={{ scale: 1.03, rotate: 4 }}
      transition={{ type: "spring", stiffness: 210, damping: 23 }}
      className="relative flex min-h-[520px] touch-pan-y flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-boxPit/90 p-5 shadow-2xl shadow-black/60"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,38,1,.22),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(247,128,5,.16),transparent_42%),linear-gradient(145deg,rgba(255,255,255,.06),rgba(255,255,255,.015))]" />
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-boxRed via-boxOrange to-boxGreen" />

      <div className="relative">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-boxRed/35 bg-boxRed/15 text-sm font-black text-white">
              {initials(mission.creator_name)}
            </div>
            <div>
              <p className="text-sm font-black">{mission.creator_name}</p>
              <p className="text-xs font-semibold text-mutedForeground">{mission.creator_department || "Creator"}</p>
            </div>
          </div>
          <span className="rounded-md border border-boxOrange/30 bg-boxOrange/12 px-2 py-1 text-xs font-bold text-boxOrange">
            CODING
          </span>
        </div>

        <h2 className="text-balance text-4xl font-black leading-tight">{mission.title}</h2>
        <p className="mt-4 text-base font-medium leading-7 text-mutedForeground">{mission.description}</p>
      </div>

      <div className="relative space-y-3">
        <div className="flex items-center gap-3 rounded-xl border border-boxOrange/20 bg-boxOrange/10 p-3">
          <CalendarClock className="h-5 w-5 text-boxOrange" />
          <span className="text-sm font-bold">{formatDate(mission.datetime)}</span>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-boxRed/20 bg-boxRed/10 p-3">
          <MapPin className="h-5 w-5 text-boxRed" />
          <span className="text-sm font-bold">{mission.location}</span>
        </div>
      </div>
    </motion.article>
  );
}

interface FeedProps {
  user: User;
  refreshUser: () => Promise<void>;
  setLocked: (locked: boolean) => void;
}

function Feed({ user, refreshUser, setLocked }: FeedProps) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  async function load() {
    const [feed, lock] = await Promise.all([
      api(`/missions/feed?userId=${user.id}`),
      api(`/users/${user.id}/lock`)
    ]);
    setLocked(lock.locked);
    const passed = JSON.parse(localStorage.getItem(`lockin_passed_${user.id}`) || "[]");
    setMissions(feed.filter((item: Mission) => !passed.includes(item.id)));
    setIndex(0);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [user.id]);

  const mission = missions[index];

  async function next(action: "accept" | "pass") {
    if (!mission) return;
    setError("");
    try {
      if (action === "accept") {
        await api(`/missions/${mission.id}/accept`, {
          method: "POST",
          body: JSON.stringify({ userId: user.id })
        });
        await refreshUser();
      } else {
        await api(`/missions/${mission.id}/pass`, { method: "POST" });
        const key = `lockin_passed_${user.id}`;
        const passed = JSON.parse(localStorage.getItem(key) || "[]");
        localStorage.setItem(key, JSON.stringify([...new Set([...passed, mission.id])]));
      }
      setIndex((current) => current + 1);
    } catch (err: any) {
      if (err.message.includes("locked")) setLocked(true);
      setError(err.message);
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-24 pt-5 lg:px-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-mutedForeground">Mission feed</p>
          <h2 className="text-2xl font-bold tracking-tight">Choose execution</h2>
        </div>
        <NeonButton tone="purple" className="min-h-10 px-3 py-2" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
        </NeonButton>
      </div>

      <div className="relative mx-auto flex w-full max-w-2xl flex-1 items-center">
        <div className="absolute inset-x-7 top-7 h-[500px] rounded-2xl border border-white/10 bg-boxRed/10 opacity-70" />
        <div className="absolute inset-x-11 top-12 h-[470px] rounded-2xl border border-white/10 bg-boxOrange/10 opacity-60" />
        <AnimatePresence mode="wait">
          {mission ? (
            <MissionCard key={mission.id} mission={mission} onPass={() => next("pass")} onAccept={() => next("accept")} />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass flex min-h-[420px] w-full flex-col items-center justify-center rounded-xl p-6 text-center"
            >
              <Flame className="mb-4 h-12 w-12 text-boxGreen" />
              <h3 className="text-2xl font-black">Feed cleared</h3>
              <p className="mt-2 text-sm font-semibold text-mutedForeground">Post a mission or come back when the campus wakes up.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error ? <p className="mt-4 text-center text-sm font-bold text-boxRed">{error}</p> : null}

      <div className="mx-auto mt-5 grid w-full max-w-2xl grid-cols-2 gap-3">
        <NeonButton tone="red" onClick={() => next("pass")}>
          <X className="h-5 w-5" /> Pass
        </NeonButton>
        <NeonButton tone="green" onClick={() => next("accept")}>
          <Check className="h-5 w-5" /> Lock In
        </NeonButton>
      </div>

      <AnimatePresence>
        {showCreate ? <CreateMission user={user} onClose={() => setShowCreate(false)} onCreated={load} /> : null}
      </AnimatePresence>
    </section>
  );
}

interface CreateMissionProps {
  user: User;
  onClose: () => void;
  onCreated: () => Promise<void>;
}

function CreateMission({ user, onClose, onCreated }: CreateMissionProps) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: user.location || "",
    datetime: ""
  });
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await api("/missions", {
        method: "POST",
        body: JSON.stringify({ ...form, creator_id: user.id })
      });
      await onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <motion.div className="fixed inset-0 z-50 bg-black/75 p-5 backdrop-blur-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.form
        onSubmit={submit}
        initial={{ y: 40 }}
        animate={{ y: 0 }}
        exit={{ y: 40 }}
        className="glass mx-auto mt-12 max-w-lg rounded-xl p-5"
      >
        <button type="button" onClick={onClose} className="mb-4 flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/10 text-white">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="mb-4 text-2xl font-black text-white">Post mission</h2>
        <input className="mb-3 h-12 w-full rounded-md border border-white/10 bg-black/55 px-3 font-medium text-white outline-none focus:border-boxOrange focus:ring-4 focus:ring-boxOrange/10" placeholder="Mission title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <textarea className="mb-3 min-h-28 w-full rounded-md border border-white/10 bg-black/55 p-3 font-medium text-white outline-none focus:border-boxOrange focus:ring-4 focus:ring-boxOrange/10" placeholder="What needs to get done?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
        <input className="mb-3 h-12 w-full rounded-md border border-white/10 bg-black/55 px-3 font-medium text-white outline-none focus:border-boxOrange focus:ring-4 focus:ring-boxOrange/10" placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
        <input className="mb-3 h-12 w-full rounded-md border border-white/10 bg-black/55 px-3 font-medium text-white outline-none focus:border-boxOrange focus:ring-4 focus:ring-boxOrange/10" type="datetime-local" value={form.datetime} onChange={(e) => setForm({ ...form, datetime: e.target.value })} required />
        {error ? <p className="mb-3 text-sm font-bold text-boxRed">{error}</p> : null}
        <NeonButton tone="green" className="w-full" type="submit">
          <Plus className="h-5 w-5" /> Launch
        </NeonButton>
      </motion.form>
    </motion.div>
  );
}

interface ActiveMissionsProps {
  user: User;
  refreshUser: () => Promise<void>;
}

function ActiveMissions({ user, refreshUser }: ActiveMissionsProps) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [chatMission, setChatMission] = useState<Mission | null>(null);
  const pendingReviews = missions.filter((mission) => mission.showed_up === null && missionDue(mission.datetime)).length;

  async function load() {
    setMissions(await api(`/missions/active/${user.id}`));
  }

  useEffect(() => {
    load().catch(() => {});
    const timer = setInterval(() => setMissions((current) => [...current]), 30000);
    return () => clearInterval(timer);
  }, [user.id]);

  async function attendance(mission: Mission, showedUp: boolean) {
    await api(`/missions/${mission.id}/attendance`, {
      method: "POST",
      body: JSON.stringify({ userId: user.id, showedUp })
    });
    await Promise.all([load(), refreshUser()]);
  }

  return (
    <section className="mx-auto w-full max-w-6xl flex-1 px-5 pb-24 pt-5 lg:px-8">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-boxOrange">Accepted missions</p>
          <h2 className="text-2xl font-bold tracking-tight">Execution queue</h2>
        </div>
        <div className="rounded-xl border border-boxGreen/25 bg-boxGreen/10 px-4 py-3">
          <p className="text-xs font-bold uppercase text-white/55">Participation score</p>
          <p className="text-2xl font-black text-boxGreen">{user.reputation_score}</p>
        </div>
      </div>
      {pendingReviews ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-4 rounded-2xl border border-boxOrange/25 bg-boxOrange/10 p-4">
          <p className="text-sm font-black text-white">Post-mission check required</p>
          <p className="mt-1 text-sm font-semibold text-white/60">
            {pendingReviews} mission{pendingReviews > 1 ? "s are" : " is"} ready for attendance. Confirm who showed up to update participation score.
          </p>
        </motion.div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {missions.map((mission, i) => (
          <ActiveMissionCard
            key={mission.id}
            mission={mission}
            index={i}
            onChat={() => setChatMission(mission)}
            onAttendance={(showedUp) => attendance(mission, showedUp)}
          />
        ))}
      </div>
      <AnimatePresence>
        {chatMission ? <Chat mission={chatMission} user={user} onClose={() => setChatMission(null)} /> : null}
      </AnimatePresence>
    </section>
  );
}

interface ActiveMissionCardProps {
  mission: Mission;
  index: number;
  onChat: () => void;
  onAttendance: (showedUp: boolean) => void;
}

function ActiveMissionCard({ mission, index, onChat, onAttendance }: ActiveMissionCardProps) {
  const isDue = missionDue(mission.datetime);
  const needsReview = mission.showed_up === null && isDue;
  const statusClass =
    mission.status === "Completed"
      ? "bg-boxGreen/15 text-boxGreen border-boxGreen/25"
      : mission.status === "Missed"
        ? "bg-boxRed/15 text-white border-boxRed/25"
        : needsReview
          ? "bg-boxOrange/15 text-boxOrange border-boxOrange/25"
          : "bg-white/10 text-white border-white/15";

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * .05 }}
      className={`glass rounded-2xl p-4 ${needsReview ? "ring-2 ring-boxOrange/25" : ""}`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-black">{mission.title}</h3>
          <p className="text-xs font-semibold text-mutedForeground">with {mission.creator_name}</p>
        </div>
        <span className={`rounded-md border px-2 py-1 text-xs font-bold ${statusClass}`}>
          {needsReview ? "Review" : mission.status}
        </span>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-2 text-sm font-bold">
        <div className="rounded-xl border border-boxOrange/20 bg-boxOrange/10 p-3">
          <CalendarClock className="mb-2 h-4 w-4 text-boxOrange" />
          {timeLeft(mission.datetime)}
        </div>
        <div className="rounded-xl border border-boxRed/20 bg-boxRed/10 p-3">
          <MapPin className="mb-2 h-4 w-4 text-boxRed" />
          {mission.location}
        </div>
      </div>

      {needsReview ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-3 rounded-xl border border-boxOrange/25 bg-boxOrange/10 p-3">
          <p className="text-sm font-black text-white">Did the person show up?</p>
          <p className="mt-1 text-xs font-semibold text-white/60">Showed up adds +10. Didn't show subtracts -5.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <NeonButton tone="green" className="min-h-10 px-2 py-2" onClick={() => onAttendance(true)}>
              <Check className="h-4 w-4" /> +10
            </NeonButton>
            <NeonButton tone="red" className="min-h-10 px-2 py-2" onClick={() => onAttendance(false)}>
              <X className="h-4 w-4" /> -5
            </NeonButton>
          </div>
        </motion.div>
      ) : null}

      <div className="grid grid-cols-3 gap-2">
        <NeonButton tone="blue" className="min-h-10 px-2 py-2" onClick={onChat}>
          <MessageCircle className="h-4 w-4" />
        </NeonButton>
        <NeonButton tone="green" className="min-h-10 px-2 py-2" onClick={() => onAttendance(true)} disabled={mission.showed_up !== null || !isDue}>
          <Check className="h-4 w-4" />
        </NeonButton>
        <NeonButton tone="red" className="min-h-10 px-2 py-2" onClick={() => onAttendance(false)} disabled={mission.showed_up !== null || !isDue}>
          <X className="h-4 w-4" />
        </NeonButton>
      </div>
    </motion.article>
  );
}

interface ChatProps {
  mission: Mission;
  user: User;
  onClose: () => void;
}

function Chat({ mission, user, onClose }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");

  async function load() {
    const list: Message[] = await api(`/messages/${mission.id}?userId=${user.id}`);
    setMessages(list);
  }

  useEffect(() => {
    load().catch(() => {});
  }, [mission.id, user.id]);

  // Set up real-time websocket connection using Socket.IO
  useEffect(() => {
    const socket = io(SOCKET_URL);

    // Join room for this mission
    socket.emit("join_mission", mission.id);

    // Listen for new messages
    socket.on("new_message", (message: Message) => {
      if (message.mission_id === mission.id) {
        setMessages((current) => {
          // Prevent duplicates
          if (current.some((msg) => msg.id === message.id)) return current;
          return [...current, message];
        });
      }
    });

    return () => {
      socket.emit("leave_mission", mission.id);
      socket.disconnect();
    };
  }, [mission.id]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!text.trim()) return;
    try {
      const message = await api(`/messages/${mission.id}`, {
        method: "POST",
        body: JSON.stringify({ senderId: user.id, message: text })
      });
      // Append locally first (the duplicate-prevention in socket listener will handle the event broadcast)
      setMessages((current) => {
        if (current.some((msg) => msg.id === message.id)) return current;
        return [...current, message];
      });
      setText("");
    } catch {}
  }

  return (
    <motion.div className="fixed inset-0 z-50 flex flex-col bg-black/95 p-5 backdrop-blur-xl" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}>
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
        <button type="button" onClick={onClose} className="mb-4 flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/10 text-white">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-black text-white">{mission.title}</h2>
        <p className="mb-4 text-sm font-semibold text-mutedForeground">Coordination only. No media.</p>
        <div className="flex-1 space-y-3 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-3">
          {messages.map((message) => (
            <div key={message.id} className={`max-w-[82%] rounded-xl border p-3 ${message.sender_id === user.id ? "ml-auto border-boxOrange/25 bg-boxOrange/15 text-white" : "border-white/10 bg-white/10 text-zinc-100"}`}>
              <p className="text-xs font-black uppercase opacity-70">{message.sender_name}</p>
              <p className="text-sm font-semibold">{message.message}</p>
            </div>
          ))}
        </div>
        <form onSubmit={send} className="safe-bottom mt-3 flex gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} className="h-12 flex-1 rounded-md border border-white/10 bg-black/55 px-3 font-medium text-white outline-none focus:border-boxOrange focus:ring-4 focus:ring-boxOrange/10" placeholder="Coordinate..." />
          <NeonButton tone="blue" className="h-12 w-12 px-0" type="submit">
            <Send className="h-5 w-5" />
          </NeonButton>
        </form>
      </div>
    </motion.div>
  );
}

interface ProfileProps {
  user: User;
  refreshUser: () => Promise<void>;
}

function Profile({ user, refreshUser }: ProfileProps) {
  const score = Math.max(0, Math.min(100, user.reputation_score || 0));

  return (
    <section className="mx-auto w-full max-w-6xl flex-1 px-5 pb-24 pt-5 lg:px-8">
      <div className="glass overflow-hidden rounded-xl">
        <div className="bg-[radial-gradient(circle_at_top,rgba(245,38,1,.22),transparent_54%),linear-gradient(135deg,rgba(255,255,255,.09),rgba(255,255,255,.025))] p-5 md:p-8">
          <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-xl border border-boxRed/35 bg-boxRed/15 text-3xl font-black text-white shadow-[0_0_40px_rgba(245,38,1,.18)]">
            {initials(user.name)}
          </div>
          <h2 className="text-3xl font-black text-white">{user.name}</h2>
          <p className="font-semibold text-mutedForeground">{user.department}</p>
        </div>
        <div className="space-y-5 p-5">
          <div>
            <div className="mb-2 flex justify-between text-sm font-black">
              <span className="text-white">Participation Score</span>
              <span className="text-boxGreen">{user.reputation_score}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/10">
              <motion.div initial={{ width: 0 }} animate={{ width: `${participationScore(score)}%` }} className="h-full rounded-full bg-gradient-to-r from-boxRed via-boxOrange to-boxGreen" />
            </div>
          </div>
          <Info label="College" value={user.college} />
          <Info label="College ID" value={user.college_id} />
          <Info label="Location" value={user.location} />
          <NeonButton tone="blue" className="w-full" onClick={refreshUser}>
            <Activity className="h-5 w-5" /> Sync profile
          </NeonButton>
        </div>
      </div>
    </section>
  );
}

interface InfoProps {
  label: string;
  value: string;
}

function Info({ label, value }: InfoProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <p className="text-xs font-bold uppercase text-mutedForeground">{label}</p>
      <p className="mt-1 font-bold text-white">{value}</p>
    </div>
  );
}

function LockScreen() {
  return (
    <motion.div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-6 backdrop-blur-2xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div initial={{ scale: .9, y: 20 }} animate={{ scale: 1, y: 0 }} className="max-w-sm text-center">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-xl border border-boxRed/35 bg-boxRed/15 shadow-[0_0_48px_rgba(245,38,1,.24)]">
          <Lock className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-4xl font-black leading-tight text-white">You're locked in. Go execute.</h2>
        <p className="mt-4 text-sm font-semibold text-zinc-200">Mark attendance on one of your three active missions to unlock the feed.</p>
      </motion.div>
    </motion.div>
  );
}

interface NavProps {
  tab: string;
  setTab: (tab: string) => void;
}

function Nav({ tab, setTab }: NavProps) {
  const items = [
    ["feed", Flame],
    ["active", Activity],
    ["profile", UserIcon]
  ] as const;

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md px-5">
      <div className="grid grid-cols-3 rounded-xl border border-white/10 bg-black/80 p-2 shadow-2xl shadow-black/40 backdrop-blur">
        {items.map(([key, Icon]) => (
          <button key={key} onClick={() => setTab(key)} className={`flex h-12 items-center justify-center rounded-md transition ${tab === key ? "bg-boxOrange text-black shadow-[0_0_24px_rgba(247,128,5,.28)]" : "text-zinc-400 hover:bg-white/10 hover:text-white"}`}>
            <Icon className="h-5 w-5" />
          </button>
        ))}
      </div>
    </nav>
  );
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("feed");
  const [locked, setLocked] = useState(false);

  async function refreshUser() {
    const id = localStorage.getItem("lockin_user_id");
    if (!id) return;
    const nextUser = await api(`/users/${id}`);
    const lock = await api(`/users/${id}/lock`);
    setUser(nextUser);
    setLocked(lock.locked);
  }

  useEffect(() => {
    const id = localStorage.getItem("lockin_user_id");
    if (!id) {
      setLoading(false);
      return;
    }
    Promise.all([api(`/users/${id}`), api(`/users/${id}/lock`)])
      .then(([nextUser, lock]) => {
        setUser(nextUser);
        setLocked(lock.locked);
      })
      .catch(() => localStorage.removeItem("lockin_user_id"))
      .finally(() => setLoading(false));
  }, []);

  const screen = useMemo(() => {
    if (!user) return null;
    if (tab === "active") return <ActiveMissions user={user} refreshUser={refreshUser} />;
    if (tab === "profile") return <Profile user={user} refreshUser={refreshUser} />;
    return <Feed user={user} refreshUser={refreshUser} setLocked={setLocked} />;
  }, [tab, user]);

  if (loading) {
    return (
      <Shell>
        <div className="flex min-h-screen items-center justify-center">
          <Flame className="h-10 w-10 animate-pulse text-boxOrange" />
        </div>
      </Shell>
    );
  }

  if (!user) {
    return <ProfileGate onReady={setUser} />;
  }

  return (
    <Shell>
      <Header user={user} />
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} className="flex flex-1 flex-col">
          {screen}
        </motion.div>
      </AnimatePresence>
      <Nav tab={tab} setTab={setTab} />
      {locked && tab !== "active" ? <LockScreen /> : null}
    </Shell>
  );
}
