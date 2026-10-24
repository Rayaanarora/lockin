"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { Input } from "../../components/ui/input";
import { KeyRound, AlertTriangle, Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { LockinLogo } from "../../components/ui/LockinLogo";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [show, setShow] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      if (!supabase) throw new Error("Supabase client is not initialized.");
      const { error: updateErr } = await supabase.auth.updateUser({
        password: password
      });

      if (updateErr) throw updateErr;

      setSuccess(true);
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to update password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col items-center justify-center bg-bg px-5 py-8">
      <div className="grid-noise pointer-events-none fixed inset-0" />
      <motion.div className="race-stripe pointer-events-none fixed inset-x-0 top-0 h-[2px]" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1 }} />

      <div className="relative z-10 mx-auto w-full max-w-sm">
        <LockinLogo size="sm" />

        <AnimatePresence mode="wait" initial={false}>
          {success ? (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-12 flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 420, damping: 16 }}
                className="flex h-20 w-20 items-center justify-center rounded-full border border-success/40 bg-success/10"
              >
                <Check className="h-9 w-9 text-success" strokeWidth={2.5} />
              </motion.div>
              <h1 className="t-display mt-6 text-large-title text-ink">Password updated</h1>
              <p className="mt-2 text-subhead text-ink-2">Taking you back in…</p>
            </motion.div>
          ) : (
            <motion.form key="form" onSubmit={handleReset} exit={{ opacity: 0, y: -8 }} className="mt-12 space-y-7">
              <div>
                <h1 className="t-display text-large-title text-ink">Set a new one</h1>
                <p className="mt-2 text-subhead text-ink-2">At least 6 characters.</p>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    role="alert"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto", x: [0, -6, 6, -3, 0] }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-start gap-2.5 overflow-hidden rounded-xl border border-signal/70 bg-surface p-3.5 text-subhead text-ink"
                  >
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-crimson" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <label htmlFor="new-pw" className="t-label flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5" /> New password
                </label>
                <div className="relative">
                  <Input
                    id="new-pw"
                    type={show ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="New password"
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    aria-label={show ? "Hide password" : "Show password"}
                    className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-ink-3 hover:text-ink"
                  >
                    {show ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                  </button>
                </div>
                <div className="flex gap-1 pt-1" aria-hidden="true">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors duration-300 ${password.length >= [6, 10, 14][i] ? (i === 0 ? "bg-warn" : "bg-success") : "bg-line"}`}
                    />
                  ))}
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={busy}
                whileTap={{ scale: 0.97 }}
                className="flex h-14 w-full items-center justify-center gap-2 disabled:opacity-50 btn-primary"
              >
                {busy && <Loader2 className="h-5 w-5 animate-spin" />}
                {busy ? "Saving" : "Save password"}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
