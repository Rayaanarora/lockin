"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Heart, Mic, Pause, Play, RotateCcw, Send, Trash2, X } from "lucide-react";
import { Avatar } from "./people";
import { Portal, Skeleton } from "../ui/motion";
import { ease } from "../../lib/motion";
import {
  fmtSeconds,
  MAX_VOICE_SECONDS,
  MediaRef,
  prepareImage,
  toPeaks,
  uploadImage,
  uploadVoice,
  useVoiceRecorder,
  VoiceClip
} from "../../lib/chatMedia";

/** One message as the thread draws it, whatever its source (DM or mission chat). */
export interface ThreadMessage {
  id: number | string;
  sender_id: number;
  kind: "text" | "image" | "voice";
  body: string;
  media_url?: string | null;
  media_meta?: { width?: number; height?: number; duration?: number; peaks?: number[] } | null;
  created_at: string;
  sender_name: string;
  sender_username?: string | null;
  sender_avatar?: string | null;
  pending?: boolean;
  failed?: boolean;
  /** Local data kept on a draft so a failed send can be retried. */
  draft?: { image?: Awaited<ReturnType<typeof prepareImage>>; voice?: VoiceClip; ref?: MediaRef };
}

/** What the thread asks its owner to send (attachments are already uploaded). */
export interface Outgoing {
  kind: "text" | "image" | "voice";
  body: string;
  media_path?: string;
  media_meta?: Record<string, unknown>;
}

interface ThreadProps {
  me: { id: number; name: string; username?: string | null; avatar_url?: string | null };
  messages: ThreadMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ThreadMessage[]>>;
  loading: boolean;
  /** Resolves with the saved message; rejects to mark the draft failed. */
  onSend: (out: Outgoing) => Promise<ThreadMessage>;
  header: React.ReactNode;
  empty?: React.ReactNode;
  /** Shown above the composer (request banners). */
  notice?: React.ReactNode;
  /** When set, the composer is replaced by this explanation. */
  composerDisabled?: string | null;
  /** Other side's read time (DMs): "Seen" under your last message. */
  otherLastReadAt?: string | null;
  /** Group chats label the first bubble of each run with the sender's name. */
  showNames?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => Promise<void>;
  placeholder?: string;
  maxLength?: number;
}

const RUN_GAP_MS = 5 * 60e3;
const STAMP_GAP_MS = 20 * 60e3;
const EMOJI_ONLY = /^(?:\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*\s*){1,3}$/u;

function stampLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (d.toDateString() === now.toDateString()) return `Today ${time}`;
  const y = new Date();
  y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return `Yesterday ${time}`;
  if (now.getTime() - d.getTime() < 6 * 86400e3) return `${d.toLocaleDateString(undefined, { weekday: "short" })} ${time}`;
  return `${d.toLocaleDateString(undefined, { day: "numeric", month: "short" })} ${time}`;
}

export default function Thread({
  me,
  messages,
  setMessages,
  loading,
  onSend,
  header,
  empty,
  notice,
  composerDisabled,
  otherLastReadAt,
  showNames = false,
  hasMore,
  onLoadMore,
  placeholder = "Message…",
  maxLength = 2000
}: ThreadProps) {
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<{ prepared: Awaited<ReturnType<typeof prepareImage>>; url: string } | null>(null);
  const [hint, setHint] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [viewer, setViewer] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const stickToBottom = useRef(true);
  const voice = useVoiceRecorder();
  const meId = me.id;
  const lastId = messages.length ? messages[messages.length - 1].id : null;

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [lastId, loading, photo]);

  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [text]);

  useEffect(() => {
    if (!viewer) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setViewer(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer]);

  useEffect(() => {
    if (voice.state === "denied") setHint("Microphone access is blocked. Allow it in your browser settings to send voice messages.");
    if (voice.state === "unsupported") setHint("This browser can't record voice messages.");
  }, [voice.state]);

  async function loadMore() {
    const el = scrollRef.current;
    if (!onLoadMore || !el) return;
    setLoadingMore(true);
    const before = el.scrollHeight;
    await onLoadMore().catch(() => {});
    setLoadingMore(false);
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop += scrollRef.current.scrollHeight - before;
    });
  }

  /** Upload (if needed) and send one draft; flips it to saved or failed. */
  async function deliver(draft: ThreadMessage) {
    try {
      let ref = draft.draft?.ref;
      if (!ref && draft.kind === "image" && draft.draft?.image) ref = await uploadImage(draft.draft.image);
      if (!ref && draft.kind === "voice" && draft.draft?.voice) ref = await uploadVoice(draft.draft.voice);
      if (ref) {
        // Keep the uploaded path so a retry doesn't upload twice.
        const kept = ref;
        setMessages((list) => list.map((m) => (m.id === draft.id ? { ...m, draft: { ...m.draft, ref: kept } } : m)));
      }
      const saved = await onSend({ kind: draft.kind, body: draft.body, media_path: ref?.media_path, media_meta: ref?.media_meta });
      setMessages((list) => {
        const local = list.find((m) => m.id === draft.id);
        // Keep the local file on screen if the signed URL isn't back yet.
        const merged = { ...saved, media_url: saved.media_url || local?.media_url };
        return [...list.filter((m) => m.id !== draft.id && m.id !== saved.id), merged];
      });
    } catch (err: any) {
      setMessages((list) => list.map((m) => (m.id === draft.id ? { ...m, pending: false, failed: true } : m)));
      if (err?.message && /10 MB|JPG|Sign in|Upload/.test(err.message)) setHint(err.message);
    }
  }

  function addDraft(partial: Pick<ThreadMessage, "kind" | "body"> & Partial<ThreadMessage>) {
    const draft: ThreadMessage = {
      id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sender_id: meId,
      created_at: new Date().toISOString(),
      sender_name: me.name,
      sender_username: me.username,
      sender_avatar: me.avatar_url,
      pending: true,
      ...partial
    };
    stickToBottom.current = true;
    setMessages((list) => [...list, draft]);
    deliver(draft);
  }

  function sendText(body: string) {
    if (!body.trim() || composerDisabled) return;
    addDraft({ kind: "text", body: body.trim() });
  }

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (composerDisabled) return;
    const body = text.trim();
    if (photo) {
      addDraft({
        kind: "image",
        body,
        media_url: photo.url,
        media_meta: { width: photo.prepared.width, height: photo.prepared.height },
        draft: { image: photo.prepared }
      });
      setPhoto(null);
      setText("");
      return;
    }
    if (!body) return;
    setText("");
    sendText(body);
  }

  async function pickPhoto(file?: File | null) {
    if (!file) return;
    setHint("");
    try {
      const prepared = await prepareImage(file);
      setPhoto({ prepared, url: URL.createObjectURL(prepared.blob) });
      inputRef.current?.focus();
    } catch (err: any) {
      setHint(err.message || "Couldn't use that photo.");
    }
  }

  async function finishVoice() {
    const clip = await voice.stop();
    if (!clip) return;
    addDraft({
      kind: "voice",
      body: "",
      media_url: URL.createObjectURL(clip.blob),
      media_meta: { duration: clip.duration, peaks: clip.peaks },
      draft: { voice: clip }
    });
  }

  function retry(m: ThreadMessage) {
    setMessages((list) => list.map((x) => (x.id === m.id ? { ...x, pending: true, failed: false } : x)));
    deliver({ ...m, pending: true, failed: false });
  }

  const lastMine = [...messages].reverse().find((m) => m.sender_id === meId && !m.pending && !m.failed);
  const seen = !!(otherLastReadAt && lastMine && new Date(otherLastReadAt) >= new Date(lastMine.created_at));
  const lastMessage = messages[messages.length - 1];
  const recording = voice.state === "recording";
  const canSend = !!text.trim() || !!photo;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {header}

      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-3 pt-4 md:px-6"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        {loading ? (
          <div className="space-y-3 pt-2">
            <Skeleton className="h-10 w-2/3 rounded-[20px]" />
            <Skeleton className="ml-auto h-10 w-1/2 rounded-[20px]" />
            <Skeleton className="h-16 w-3/5 rounded-[20px]" />
            <Skeleton className="ml-auto h-10 w-2/5 rounded-[20px]" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">{empty}</div>
        ) : (
          <>
            {hasMore && (
              <div className="mb-4 flex justify-center">
                <button type="button" onClick={loadMore} disabled={loadingMore} className="t-label h-10 px-4 transition-colors hover:text-ink disabled:opacity-50">
                  {loadingMore ? "Loading…" : "Earlier messages"}
                </button>
              </div>
            )}
            <ol>
              {messages.map((m, i) => {
                const prev = messages[i - 1];
                const next = messages[i + 1];
                const t = new Date(m.created_at).getTime();
                const stamp = !prev || t - new Date(prev.created_at).getTime() > STAMP_GAP_MS;
                const joinsPrev = !!prev && !stamp && prev.sender_id === m.sender_id && t - new Date(prev.created_at).getTime() < RUN_GAP_MS;
                const nextStamp = !!next && new Date(next.created_at).getTime() - t > STAMP_GAP_MS;
                const joinsNext = !!next && !nextStamp && next.sender_id === m.sender_id && new Date(next.created_at).getTime() - t < RUN_GAP_MS;
                const self = m.sender_id === meId;
                return (
                  <li key={m.id}>
                    {stamp && <p className="py-4 text-center text-caption text-ink-3">{stampLabel(m.created_at)}</p>}
                    {showNames && !self && !joinsPrev && (
                      <p className="mb-1 ml-11 mt-2 text-caption text-ink-3">
                        {m.sender_name}
                        {m.sender_username ? ` · @${m.sender_username}` : ""}
                      </p>
                    )}
                    <div className={`flex items-end gap-2 ${self ? "justify-end" : "justify-start"} ${joinsPrev ? "mt-[3px]" : "mt-2"}`}>
                      {!self && <div className="w-7 shrink-0">{!joinsNext && <Avatar name={m.sender_name} src={m.sender_avatar} size={28} round />}</div>}
                      <Bubble m={m} self={self} joinsPrev={joinsPrev} joinsNext={joinsNext} onOpenImage={setViewer} />
                    </div>
                    {m.failed && (
                      <button type="button" onClick={() => retry(m)} className="ml-auto mt-1 flex items-center gap-1.5 text-caption text-crimson">
                        <RotateCcw className="h-3 w-3" /> Not delivered. Tap to retry
                      </button>
                    )}
                    {self && m === lastMessage && m.pending && <p className="mt-1 text-right text-caption text-ink-3">Sending…</p>}
                    {seen && lastMine && m.id === lastMine.id && <p className="mt-1 text-right text-caption text-ink-3">Seen</p>}
                  </li>
                );
              })}
            </ol>
          </>
        )}
      </div>

      {notice}

      {composerDisabled ? (
        <p className="border-t border-line px-5 py-5 text-center text-subhead text-ink-3">{composerDisabled}</p>
      ) : (
        <div className="bg-bg px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 md:px-6 md:pb-4">
          {hint && (
            <p role="alert" className="mb-2 flex items-start justify-between gap-3 px-2 text-footnote text-crimson">
              {hint}
              <button
                type="button"
                onClick={() => {
                  setHint("");
                  voice.reset();
                }}
                aria-label="Dismiss"
                className="shrink-0 text-ink-3 hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </p>
          )}

          <AnimatePresence>
            {photo && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8, transition: { duration: 0.12 } }}
                className="mb-2 flex items-end gap-3 px-1"
              >
                <div className="relative">
                  <img src={photo.url} alt="Photo to send" className="h-24 w-auto max-w-[160px] rounded-[14px] border border-line object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhoto(null)}
                    aria-label="Remove photo"
                    className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-line bg-bg text-ink"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="pb-1 text-caption text-ink-3">Add a caption, or just send it.</p>
              </motion.div>
            )}
          </AnimatePresence>

          {recording ? (
            <div className="flex h-12 items-center gap-2 rounded-full border border-signal/60 bg-surface px-1.5">
              <button type="button" onClick={voice.cancel} aria-label="Discard recording" className="flex h-9 w-9 items-center justify-center rounded-full text-ink-3 hover:text-ink">
                <Trash2 className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </button>
              <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-signal" aria-hidden="true" />
              <span className="tabular w-11 shrink-0 text-subhead text-ink">{fmtSeconds(voice.elapsed)}</span>
              <div className="flex h-7 min-w-0 flex-1 items-center justify-end gap-[2px] overflow-hidden" aria-hidden="true">
                {voice.levels.map((l, i) => (
                  <span key={i} className="w-[3px] shrink-0 rounded-full bg-ink/70" style={{ height: `${Math.max(12, l * 100)}%` }} />
                ))}
              </div>
              <span className="sr-only">Recording, up to {MAX_VOICE_SECONDS / 60} minutes</span>
              <button type="button" onClick={finishVoice} aria-label="Send voice message" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-signal text-ink">
                <Send className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="flex min-h-[52px] items-end gap-1 rounded-[26px] border border-line bg-surface p-1 focus-within:border-ink/30">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                aria-label="Send a photo"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-signal text-ink transition-transform active:scale-95"
              >
                <Camera className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
                onChange={(e) => {
                  pickPhoto(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <label htmlFor="thread-composer" className="sr-only">
                Message
              </label>
              <textarea
                id="thread-composer"
                ref={inputRef}
                rows={1}
                value={text}
                maxLength={maxLength}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    submit();
                  }
                }}
                placeholder={photo ? "Add a caption…" : placeholder}
                className="min-h-[44px] flex-1 resize-none bg-transparent px-2 py-2.5 text-body leading-6 text-ink outline-none placeholder:text-ink-3"
              />
              {canSend ? (
                <button type="submit" className="h-11 shrink-0 px-3 text-subhead font-medium text-crimson transition-colors hover:text-ink">
                  Send
                </button>
              ) : (
                <>
                  <button type="button" onClick={voice.start} aria-label="Record a voice message" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-2 transition-colors hover:text-ink">
                    <Mic className="h-5 w-5" strokeWidth={1.75} />
                  </button>
                  <button type="button" onClick={() => sendText("❤️")} aria-label="Send a heart" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-2 transition-colors hover:text-crimson">
                    <Heart className="h-5 w-5" strokeWidth={1.75} />
                  </button>
                </>
              )}
            </form>
          )}
        </div>
      )}

      <Portal>
        <AnimatePresence>
          {viewer && (
            <motion.div
              className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/95 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              onClick={() => setViewer(null)}
              role="dialog"
              aria-modal="true"
              aria-label="Photo"
            >
              <motion.img
                src={viewer}
                alt=""
                initial={{ scale: 0.96 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.25, ease: ease.out }}
                className="max-h-full max-w-full rounded-[6px] object-contain"
              />
              <button
                type="button"
                onClick={() => setViewer(null)}
                aria-label="Close photo"
                className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </Portal>
    </div>
  );
}

/* ─── Bubbles ──────────────────────────────────────────────────────── */

function corners(self: boolean, joinsPrev: boolean, joinsNext: boolean) {
  // Instagram-style runs: inner corners tighten where bubbles stack.
  if (self) return `rounded-[20px] ${joinsPrev ? "rounded-tr-[6px]" : ""} ${joinsNext ? "rounded-br-[6px]" : ""}`;
  return `rounded-[20px] ${joinsPrev ? "rounded-tl-[6px]" : ""} ${joinsNext ? "rounded-bl-[6px]" : ""}`;
}

function Bubble({
  m,
  self,
  joinsPrev,
  joinsNext,
  onOpenImage
}: {
  m: ThreadMessage;
  self: boolean;
  joinsPrev: boolean;
  joinsNext: boolean;
  onOpenImage: (url: string) => void;
}) {
  const shape = corners(self, joinsPrev, joinsNext);
  const tone = self ? "bg-signal text-ink" : "border border-line bg-raised text-ink";
  const fade = m.pending ? "opacity-60" : m.failed ? "opacity-50" : "";

  if (m.kind === "image") {
    const w = m.media_meta?.width || 4;
    const h = m.media_meta?.height || 5;
    return (
      <div className={`flex max-w-[72%] flex-col gap-[3px] ${self ? "items-end" : "items-start"} ${fade}`}>
        <button
          type="button"
          onClick={() => m.media_url && onOpenImage(m.media_url)}
          aria-label="Open photo"
          className={`relative block w-[220px] max-w-full overflow-hidden border border-line bg-raised sm:w-[260px] ${shape}`}
          style={{ aspectRatio: `${w} / ${Math.min(h, w * 1.6)}` }}
        >
          {m.media_url ? (
            <img src={m.media_url} alt={m.body || "Photo"} loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-caption text-ink-3">Photo unavailable</span>
          )}
          {m.pending && <span className="absolute inset-0 animate-pulse bg-black/30" aria-hidden="true" />}
        </button>
        {m.body && (
          <p className={`max-w-full whitespace-pre-wrap break-words px-4 py-2 text-body leading-snug ${tone} ${corners(self, true, joinsNext)}`}>{m.body}</p>
        )}
      </div>
    );
  }

  if (m.kind === "voice") return <VoiceBubble m={m} self={self} className={`${shape} ${tone} ${fade}`} />;

  if (EMOJI_ONLY.test(m.body.trim())) {
    return <p className={`px-1 text-[40px] leading-[1.15] ${fade}`}>{m.body.trim()}</p>;
  }

  return (
    <p className={`max-w-[75%] whitespace-pre-wrap break-words px-4 py-2 text-body leading-snug md:max-w-[60%] ${shape} ${tone} ${fade}`}>
      {m.body}
    </p>
  );
}

function VoiceBubble({ m, self, className }: { m: ThreadMessage; self: boolean; className: string }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const duration = m.media_meta?.duration || 0;
  const peaks = m.media_meta?.peaks?.length ? m.media_meta.peaks : toPeaks([], 32);

  useEffect(() => {
    if (!m.media_url) return;
    const a = new Audio();
    a.preload = "none";
    a.ontimeupdate = () => setProgress(duration ? a.currentTime / duration : a.duration ? a.currentTime / a.duration : 0);
    a.onended = () => {
      setPlaying(false);
      setProgress(0);
    };
    a.onpause = () => setPlaying(false);
    a.onplay = () => setPlaying(true);
    audio.current = a;
    return () => {
      a.pause();
      audio.current = null;
    };
  }, [m.media_url, duration]);

  // One voice message plays at a time.
  useEffect(() => {
    const stopOthers = (e: Event) => {
      if ((e as CustomEvent).detail !== m.id) audio.current?.pause();
    };
    window.addEventListener("lockin:voice-play", stopOthers);
    return () => window.removeEventListener("lockin:voice-play", stopOthers);
  }, [m.id]);

  function toggle() {
    const a = audio.current;
    if (!a) return;
    if (a.paused) {
      if (!a.src && m.media_url) a.src = m.media_url;
      window.dispatchEvent(new CustomEvent("lockin:voice-play", { detail: m.id }));
      a.play().catch(() => {});
    } else a.pause();
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const a = audio.current;
    if (!a || !duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    a.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * duration;
    setProgress(a.currentTime / duration);
  }

  return (
    <div className={`flex w-[230px] max-w-[75%] items-center gap-2.5 py-2 pl-2 pr-4 ${className}`}>
      <button
        type="button"
        onClick={toggle}
        disabled={!m.media_url}
        aria-label={playing ? "Pause voice message" : `Play voice message, ${fmtSeconds(duration)}`}
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink ${self ? "text-signal" : "text-bg"} disabled:opacity-50`}
      >
        {playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}
      </button>
      <div className="flex h-8 min-w-0 flex-1 cursor-pointer items-center gap-[2px]" onClick={seek} aria-hidden="true">
        {peaks.map((p, i) => (
          <span
            key={i}
            className={`w-[3px] flex-1 rounded-full ${i / peaks.length < progress ? "bg-ink" : self ? "bg-ink/45" : "bg-ink/30"}`}
            style={{ height: `${Math.max(14, p * 100)}%` }}
          />
        ))}
      </div>
      <span className="tabular shrink-0 text-caption">{fmtSeconds(playing ? progress * duration : duration)}</span>
    </div>
  );
}
