"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Activity, Shield, Award, MapPin, Zap } from "lucide-react";
import { User } from "../app/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";

interface ProfileProps {
  user: User;
  refreshUser: () => Promise<void>;
  api: (path: string, options?: RequestInit) => Promise<any>;
}

const SRM_SPOTS = [
  "SRM KTR Tech Park",
  "SRM KTR Library",
  "SRM KTR Java Canteen",
  "SRM KTR Bio-Tech Block",
  "SRM KTR Cafe Court",
  "SRM KTR UB Block",
  "SRM KTR MBA Block",
  "SRM KTR Bel Canto"
];

export default function Profile({ user, refreshUser, api }: ProfileProps) {
  const [syncing, setSyncing] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({
    name: user.name || "",
    department: user.department || "",
    location: user.location || "SRM KTR Library"
  });
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

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
      setForm({
        name: user.name || "",
        department: user.department || "",
        location: user.location || "SRM KTR Library"
      });
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setSyncing(false), 800); // short delay to feel premium
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (form.name.trim().length < 3) {
      setError("Name must be at least 3 characters.");
      return;
    }
    if (form.department.trim().length < 3) {
      setError("Department description is required.");
      return;
    }

    setUpdating(true);
    setError("");
    try {
      await api(`/users/${user.id}`, {
        method: "PUT",
        body: JSON.stringify(form)
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
    <section className="mx-auto w-full max-w-md px-4 py-6 pb-24 space-y-6">
      {/* Profile Header Card */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/40 p-5 backdrop-blur-md">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(247,128,5,0.1),transparent_40%)]" />
        
        <div className="flex flex-col items-center md:flex-row md:items-start gap-4 text-left">
          {/* Avatar Initials with custom glow */}
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-boxOrange/30 bg-boxOrange/10 text-xl font-black text-white shadow-[0_0_30px_rgba(247,128,5,0.15)]">
            {initials}
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <h2 className="text-lg font-black text-white">{user.name}</h2>
              <span className="mx-auto md:mx-0 flex items-center gap-1 rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-zinc-400 w-fit">
                <Zap className="h-2.5 w-2.5 text-boxOrange fill-current" /> Lvl {level} • {levelName}
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-500 font-semibold">{user.department}</p>

            <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2.5 text-[9px] font-black text-zinc-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5 rounded-xl border border-white/5 bg-zinc-900/40 px-2.5 py-1.5">
                <Shield className="h-3.5 w-3.5 text-boxGreen" />
                {user.reputation_score} Reputation
              </span>
              <span className="flex items-center gap-1.5 rounded-xl border border-white/5 bg-zinc-900/40 px-2.5 py-1.5 truncate max-w-[200px]">
                <MapPin className="h-3.5 w-3.5 text-boxRed" />
                {user.location || "On Campus"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress & Level Card */}
      <div className="rounded-3xl border border-white/10 bg-zinc-950/40 p-5 backdrop-blur-md">
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
        <div className="flex justify-between mt-2 text-[9px] font-black text-zinc-600 uppercase tracking-widest">
          <span>Lvl {level}</span>
          <span>Lvl {level + 1}</span>
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-3xl border border-white/10 bg-zinc-950/40 p-4 text-center backdrop-blur-md">
          <Award className="h-5 w-5 mx-auto text-boxOrange animate-pulse" />
          <span className="mt-2 block text-[9px] font-black uppercase tracking-widest text-zinc-500">
            Reputation Rank
          </span>
          <span className="mt-1 block text-xl font-black text-white">
            #{Math.max(1, 100 - user.reputation_score)}
          </span>
        </div>

        <div className="rounded-3xl border border-white/10 bg-zinc-950/40 p-4 text-center backdrop-blur-md">
          <Activity className="h-5 w-5 mx-auto text-boxGreen" />
          <span className="mt-2 block text-[9px] font-black uppercase tracking-widest text-zinc-500">
            Showed Up Score
          </span>
          <span className="mt-1 block text-xl font-black text-white">
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
          <div key={info.label} className="rounded-2xl border border-white/5 bg-zinc-950/20 p-3.5 text-left">
            <span className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500">
              {info.label}
            </span>
            <span className="mt-1 block text-xs font-semibold text-zinc-300">
              {info.value}
            </span>
          </div>
        ))}
      </div>

      {/* Sync & Edit Actions grid */}
      <div className="grid grid-cols-2 gap-3 shrink-0">
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 text-xs font-black uppercase tracking-wider text-zinc-200 transition hover:bg-white/10 hover:text-white disabled:opacity-55"
        >
          <Activity className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing..." : "Sync Profile"}
        </button>
        <button
          onClick={() => setShowEdit(true)}
          className="flex h-11 items-center justify-center gap-2 rounded-xl border border-boxOrange/40 bg-boxOrange/10 text-xs font-black uppercase tracking-wider text-boxOrange transition hover:bg-boxOrange/20 hover:text-white active:scale-[0.98]"
        >
          Edit Profile
        </button>
      </div>

      {/* Edit Profile Dialog Modal */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="border-white/10 bg-zinc-950/95 text-white max-w-sm rounded-3xl backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black tracking-tight text-white uppercase">
              EDIT PROFILE
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 mt-2">
            <div className="space-y-1 text-left">
              <label className="text-[9px] font-black uppercase tracking-wider text-zinc-400">
                Full Name
              </label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your Name"
                className="h-10 border-white/10 bg-black/40 text-xs text-white"
                required
              />
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[9px] font-black uppercase tracking-wider text-zinc-400">
                Department & Year
              </label>
              <Input
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                placeholder="e.g. Networking & Comm, 3rd Year"
                className="h-10 border-white/10 bg-black/40 text-xs text-white"
                required
              />
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[9px] font-black uppercase tracking-wider text-zinc-400">
                Preferred Meet Spot
              </label>
              <select
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="h-10 w-full rounded-md border border-white/10 bg-black/40 px-2 text-xs text-white outline-none focus:border-boxOrange cursor-pointer"
              >
                {SRM_SPOTS.map((spot) => (
                  <option key={spot} value={spot} className="bg-zinc-950 text-white">
                    {spot}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <p className="text-xs font-bold text-boxRed animate-pulse text-left">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={updating}
              className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-boxGreen/40 bg-boxGreen text-xs font-black uppercase tracking-wider text-black shadow-[0_0_20px_rgba(24,189,0,0.15)] hover:bg-boxGreen/90 transition active:scale-[0.98] disabled:opacity-50"
            >
              {updating ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
