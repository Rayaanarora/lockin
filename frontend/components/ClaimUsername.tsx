"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { User } from "../app/types";
import { Input } from "./ui/input";
import { LockinMark } from "./ui/LockinLogo";
import UsernameField, { UsernameState, suggestUsername } from "./inbox/UsernameField";
import { ease } from "../lib/motion";

/**
 * One-time step for accounts created before usernames existed: pick a
 * display name and a unique @username before entering the app.
 */
export default function ClaimUsername({
  user,
  api,
  onDone
}: {
  user: User;
  api: (path: string, options?: RequestInit) => Promise<any>;
  onDone: (u: User) => void;
}) {
  // Accounts made before onboarding asked for a name carry the email prefix.
  const emailPrefix = (user.email || "").split("@")[0];
  const [name, setName] = useState(user.name && user.name !== emailPrefix ? user.name : "");
  const [username, setUsername] = useState(() => suggestUsername(user.name || emailPrefix));
  const [state, setState] = useState<UsernameState>("idle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [usernameError, setUsernameError] = useState("");

  const nameOk = name.trim().length >= 2;
  const canSave = nameOk && state === "available" && !busy;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    setBusy(true);
    setError("");
    setUsernameError("");
    try {
      const updated = await api(`/users/${user.id}`, {
        method: "PUT",
        body: JSON.stringify({ name: name.trim(), username })
      });
      onDone({ ...user, ...updated });
    } catch (err: any) {
      if (err?.status === 409 || err?.status === 400) setUsernameError(err.message);
      else setError(err.message || "Couldn't save. Try again.");
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-bg px-6 py-10">
      <motion.form
        onSubmit={save}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: ease.out }}
        className="mx-auto my-auto w-full max-w-sm"
      >
        <LockinMark size={44} color="rgb(var(--ink))" />
        <p className="t-section mt-8 text-crimson">One more thing</p>
        <h1 className="t-display mt-3 text-large-title text-ink">Claim your name</h1>
        <p className="mt-2 text-subhead text-ink-2">
          People on your campus find you, message you and lock in with you by this.
        </p>

        <div className="mt-9 space-y-6">
          <div>
            <label htmlFor="claim-name" className="t-label mb-2 block">
              Name
            </label>
            <Input
              id="claim-name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 50))}
              placeholder="Your full name"
            />
            {!nameOk && name.length > 0 && <p className="mt-2 text-footnote text-crimson">At least 2 characters.</p>}
          </div>
          <div>
            <label htmlFor="claim-username" className="t-label mb-2 block">
              Username
            </label>
            <UsernameField
              id="claim-username"
              value={username}
              onChange={(v) => {
                setUsername(v);
                setUsernameError("");
              }}
              onState={setState}
              api={api}
              serverError={usernameError}
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-subhead text-crimson">
            {error}
          </p>
        )}

        <button type="submit" disabled={!canSave} className="btn-primary mt-8 h-14 w-full disabled:opacity-50">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {busy ? "Saving" : "Continue"}
        </button>
      </motion.form>
    </div>
  );
}
