"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Flame, Info, CheckCircle, AlertTriangle } from "lucide-react";
import { Input } from "./ui/input";
import { User } from "../app/types";

interface ProfileGateProps {
  onReady: (user: User) => void;
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

export default function ProfileGate({ onReady, api }: ProfileGateProps) {
  const [form, setForm] = useState({
    name: "",
    college: "SRM Institute of Science and Technology KTR",
    college_id: "",
    department: "",
    location: "SRM KTR Library"
  });

  const [validation, setValidation] = useState<{ [key: string]: string }>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function validate() {
    const errs: { [key: string]: string } = {};

    if (form.name.trim().length < 3) {
      errs.name = "Name must be at least 3 characters.";
    }

    const regNo = form.college_id.trim().toUpperCase();
    if (!regNo.startsWith("RA") || regNo.length < 8) {
      errs.college_id = "Must be a valid Reg No starting with 'RA' (e.g. RA2211003).";
    }

    if (form.department.trim().length < 3) {
      errs.department = "Enter department & year (e.g. CSE, 3rd Year).";
    }

    setValidation(errs);
    return Object.keys(errs).length === 0;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!validate()) return;

    setBusy(true);
    setError("");
    try {
      const user = await api("/users", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          college_id: form.college_id.trim().toUpperCase()
        })
      });
      localStorage.setItem("lockin_user_id", String(user.id));
      onReady(user);
    } catch (err: any) {
      setError(err.message || "Registration failed. Please check details.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-4 py-8 md:grid md:grid-cols-2 md:gap-12">
      {/* Visual Branding Column (Left) */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        className="hidden md:flex flex-col justify-center space-y-6"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-boxRed/30 bg-boxRed/10 shadow-[0_0_30px_rgba(245,38,1,0.2)]">
            <Lock className="h-7 w-7 text-boxRed animate-pulse" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white uppercase">LOCKIN</h1>
            <p className="text-sm font-bold text-zinc-500">Stop chatting. Start executing.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-zinc-950/40 p-6 backdrop-blur-md">
          <p className="text-sm font-semibold text-zinc-300 leading-relaxed">
            The mission execution system for campus projects. Build your reputation through showing up, not chatting.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { label: "Accept", border: "border-boxRed/25 bg-boxRed/5 text-boxRed" },
              { label: "Lock In", border: "border-boxOrange/25 bg-boxOrange/5 text-boxOrange" },
              { label: "Execute", border: "border-boxGreen/25 bg-boxGreen/5 text-boxGreen" }
            ].map((item) => (
              <div
                key={item.label}
                className={`rounded-xl border p-3 text-center text-xs font-black tracking-wider uppercase ${item.border}`}
              >
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Form Column (Right) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="mb-6 flex items-center gap-3 md:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-boxRed/30 bg-boxRed/10">
            <Lock className="h-5 w-5 text-boxRed" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white uppercase">LOCKIN</h1>
            <p className="text-xs text-zinc-500">Stop chatting. Start executing.</p>
          </div>
        </div>

        <form
          onSubmit={submit}
          className="rounded-3xl border border-white/10 bg-zinc-950/80 p-6 shadow-2xl backdrop-blur-lg space-y-5"
        >
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-boxOrange">
              Onboarding
            </span>
            <h2 className="text-xl font-black text-white leading-tight tracking-tight uppercase mt-0.5">
              Setup Pilot Profile
            </h2>
          </div>

          <div className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1">
              <label htmlFor="name" className="text-[9px] font-black uppercase tracking-wider text-zinc-400">
                Full Name
              </label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
                placeholder="e.g. Faheem"
                className={`h-11 border-white/10 bg-black/40 text-sm text-white placeholder-zinc-700 focus:border-boxOrange focus:ring-boxOrange/10 ${
                  validation.name ? "border-boxRed/50 focus:border-boxRed focus:ring-boxRed/10" : ""
                }`}
                required
              />
              {validation.name && (
                <span className="text-[10px] font-bold text-boxRed flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> {validation.name}
                </span>
              )}
            </div>

            {/* College Name (Read-Only) */}
            <div className="space-y-1">
              <label htmlFor="college" className="text-[9px] font-black uppercase tracking-wider text-zinc-500">
                College Campus
              </label>
              <Input
                id="college"
                value={form.college}
                className="h-11 border-white/5 bg-zinc-900/50 text-xs text-zinc-500 cursor-not-allowed"
                disabled
              />
            </div>

            {/* College ID / Reg No */}
            <div className="space-y-1">
              <label htmlFor="college_id" className="text-[9px] font-black uppercase tracking-wider text-zinc-400">
                SRM Registration Number
              </label>
              <Input
                id="college_id"
                value={form.college_id}
                onChange={(e) => setForm((c) => ({ ...c, college_id: e.target.value }))}
                placeholder="e.g. RA2211003010123"
                className={`h-11 border-white/10 bg-black/40 text-sm text-white placeholder-zinc-700 uppercase focus:border-boxOrange focus:ring-boxOrange/10 ${
                  validation.college_id ? "border-boxRed/50 focus:border-boxRed focus:ring-boxRed/10" : ""
                }`}
                required
              />
              {validation.college_id && (
                <span className="text-[10px] font-bold text-boxRed flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> {validation.college_id}
                </span>
              )}
            </div>

            {/* Department */}
            <div className="space-y-1">
              <label htmlFor="department" className="text-[9px] font-black uppercase tracking-wider text-zinc-400">
                Department & Year
              </label>
              <Input
                id="department"
                value={form.department}
                onChange={(e) => setForm((c) => ({ ...c, department: e.target.value }))}
                placeholder="e.g. Networking & Comm, 3rd Year"
                className={`h-11 border-white/10 bg-black/40 text-sm text-white placeholder-zinc-700 focus:border-boxOrange focus:ring-boxOrange/10 ${
                  validation.department ? "border-boxRed/50 focus:border-boxRed focus:ring-boxRed/10" : ""
                }`}
                required
              />
              {validation.department && (
                <span className="text-[10px] font-bold text-boxRed flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> {validation.department}
                </span>
              )}
            </div>

            {/* Campus Meet Spot (Dropdown Selector) */}
            <div className="space-y-1">
              <label htmlFor="location" className="text-[9px] font-black uppercase tracking-wider text-zinc-400">
                Preferred Campus Meet Spot
              </label>
              <div className="relative">
                <select
                  id="location"
                  value={form.location}
                  onChange={(e) => setForm((c) => ({ ...c, location: e.target.value }))}
                  className="h-11 w-full rounded-md border border-white/10 bg-black/40 px-3 text-sm text-white outline-none transition focus:border-boxOrange focus:ring-2 focus:ring-boxOrange/10 appearance-none cursor-pointer"
                >
                  {SRM_SPOTS.map((spot) => (
                    <option key={spot} value={spot} className="bg-zinc-950 text-white">
                      {spot}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-zinc-400">
                  <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <p className="text-xs font-bold text-boxRed bg-boxRed/5 border border-boxRed/20 rounded-xl p-3 flex items-start gap-2 animate-pulse">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-boxGreen/40 bg-boxGreen text-xs font-black uppercase tracking-wider text-black shadow-[0_0_20px_rgba(24,189,0,0.15)] transition-all hover:bg-boxGreen/90 active:scale-[0.98] disabled:opacity-50"
          >
            <Flame className="h-4 w-4 fill-current animate-pulse" />
            {busy ? "Activating..." : "Initialize Lock-In"}
          </button>
        </form>
      </motion.div>
    </section>
  );
}
