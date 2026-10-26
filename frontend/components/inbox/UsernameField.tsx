"use client";

import React, { useEffect, useRef, useState } from "react";
import { AtSign, Check, Loader2, X } from "lucide-react";

export type UsernameState = "idle" | "checking" | "available" | "taken" | "invalid";

/** Same rules as the server (backend/src/utils/security.js checkUsername). */
export function localUsernameError(raw: string): string | null {
  const u = raw.trim().replace(/^@/, "").toLowerCase();
  if (u.length < 3) return "At least 3 characters.";
  if (u.length > 20) return "At most 20 characters.";
  if (!/^[a-z0-9._]+$/.test(u)) return "Letters, numbers, periods and underscores only.";
  if (/^[._]|[._]$/.test(u) || /\.\./.test(u)) return "Periods and underscores can't start, end or repeat.";
  if (/^\d+$/.test(u)) return "Needs at least one letter.";
  return null;
}

/** Suggest a handle from a name: "Rayaan Arora" → "rayaan.arora". */
export function suggestUsername(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s._]/g, "")
    .trim()
    .replace(/\s+/g, ".")
    .replace(/\.{2,}/g, ".")
    .replace(/^[._]+|[._]+$/g, "")
    .slice(0, 20);
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  onState?: (s: UsernameState) => void;
  api: (path: string, options?: RequestInit) => Promise<any>;
  id?: string;
  serverError?: string;
}

/** Username input with a debounced live availability check. */
export default function UsernameField({ value, onChange, onState, api, id = "username", serverError }: Props) {
  const [state, setState] = useState<UsernameState>("idle");
  const [message, setMessage] = useState("");
  const seq = useRef(0);

  useEffect(() => {
    onState?.(state);
  }, [state, onState]);

  useEffect(() => {
    const u = value.trim().toLowerCase();
    if (!u) {
      setState("idle");
      setMessage("");
      return;
    }
    const local = localUsernameError(u);
    if (local) {
      setState("invalid");
      setMessage(local);
      return;
    }
    setState("checking");
    setMessage("");
    const mine = ++seq.current;
    const t = setTimeout(async () => {
      try {
        const r = await api(`/users/username-available?u=${encodeURIComponent(u)}`);
        if (mine !== seq.current) return;
        setState(r.available ? "available" : r.reason && !/taken/i.test(r.reason) ? "invalid" : "taken");
        setMessage(r.available ? "Available" : r.reason || "That username is taken.");
      } catch {
        if (mine !== seq.current) return;
        setState("idle");
        setMessage("");
      }
    }, 350);
    return () => clearTimeout(t);
  }, [value, api]);

  const error = serverError || (state === "taken" || state === "invalid" ? message : "");
  const describedBy = `${id}-hint`;

  return (
    <div>
      <div
        className={`flex h-12 items-center rounded-[2px] border bg-surface transition-colors focus-within:border-ink/50 ${
          error ? "border-signal/70" : state === "available" ? "border-ink/30" : "border-line"
        }`}
      >
        <AtSign className="ml-3.5 h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" />
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\s/g, "").replace(/^@/, "").toLowerCase().slice(0, 20))}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          inputMode="text"
          placeholder="yourname"
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className="h-full min-w-0 flex-1 bg-transparent px-2 text-body text-ink outline-none placeholder:text-ink-3"
        />
        <span className="mr-3.5 flex h-5 w-5 items-center justify-center" aria-hidden="true">
          {state === "checking" && <Loader2 className="h-4 w-4 animate-spin text-ink-3" />}
          {state === "available" && !serverError && <Check className="h-4 w-4 text-success" />}
          {(state === "taken" || state === "invalid" || serverError) && <X className="h-4 w-4 text-crimson" />}
        </span>
      </div>
      <p id={describedBy} role="status" aria-live="polite" className={`mt-2 min-h-[18px] text-footnote ${error ? "text-crimson" : "text-ink-3"}`}>
        {error || (state === "available" ? `@${value} is yours to take.` : "This is how people find and mention you.")}
      </p>
    </div>
  );
}
