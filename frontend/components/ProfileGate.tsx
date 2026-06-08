"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Flame } from "lucide-react";
import { Input } from "./ui/input";
import { User } from "../app/types";

interface ProfileGateProps {
  onReady: (user: User) => void;
  api: (path: string, options?: RequestInit) => Promise<any>;
}

export default function ProfileGate({ onReady, api }: ProfileGateProps) {
  const [form, setForm] = useState({
    name: "",
    college: "SRM Institute of Science and Technology KTR",
    college_id: "",
    department: "",
    location: "SRM KTR Library"
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
      setError(err.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-4 py-8 md:grid md:grid-cols-2 md:gap-12">
      {/* Visual Column (Left on Desktop) */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        className="hidden md:flex flex-col justify-center space-y-6"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-boxRed/30 bg-boxRed/10 shadow-[0_0_30px_rgba(245,38,1,0.2)]">
            <Lock className="h-7 w-7 text-boxRed" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white">LOCKIN</h1>
            <p className="text-sm font-bold text-zinc-500">Stop chatting. Start executing.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-zinc-950/40 p-6 backdrop-blur">
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

      {/* Form Column (Right on Desktop) */}
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
            <h1 className="text-2xl font-black text-white">LOCKIN</h1>
            <p className="text-xs text-zinc-500">Stop chatting. Start executing.</p>
          </div>
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-zinc-950/60 p-6 shadow-2xl backdrop-blur-md">
          <div className="mb-6">
            <span className="text-[10px] font-black uppercase tracking-widest text-boxOrange">
              Registration
            </span>
            <h2 className="mt-1 text-xl font-bold text-white">Setup Execution Profile</h2>
          </div>

          <div className="space-y-4">
            {[
              { id: "name", label: "Full Name", placeholder: "e.g. Faheem" },
              { id: "college", label: "College Name", placeholder: "e.g. SRM IST KTR" },
              { id: "college_id", label: "College ID / Reg No", placeholder: "e.g. RA221100..." },
              { id: "department", label: "Department & Year", placeholder: "e.g. Networking & Comm, 3rd Year" },
              { id: "location", label: "Preferred Campus Meet Spot", placeholder: "e.g. SRM KTR Tech Park" }
            ].map((field) => (
              <div key={field.id} className="space-y-1.5">
                <label htmlFor={field.id} className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  {field.label}
                </label>
                <Input
                  id={field.id}
                  value={form[field.id as keyof typeof form]}
                  onChange={(e) => setForm((c) => ({ ...c, [field.id]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="h-11 border-white/10 bg-black/40 text-sm text-white placeholder-zinc-600 transition duration-200 focus:border-boxOrange focus:ring-2 focus:ring-boxOrange/10"
                  required
                />
              </div>
            ))}
          </div>

          {error && (
            <p className="mt-4 text-xs font-bold text-boxRed animate-pulse">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-boxGreen/40 bg-boxGreen text-xs font-black uppercase tracking-wider text-black shadow-[0_0_20px_rgba(24,189,0,0.15)] transition-all hover:bg-boxGreen/90 active:scale-[0.98] disabled:opacity-50"
          >
            <Flame className="h-4 w-4 fill-current animate-pulse" />
            {busy ? "Locking..." : "Enter Lock-In"}
          </button>
        </form>
      </motion.div>
    </section>
  );
}
