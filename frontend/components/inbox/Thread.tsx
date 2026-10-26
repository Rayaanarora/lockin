"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUp, Loader2, RotateCcw } from "lucide-react";
import { Avatar, Handle } from "./people";
import { Skeleton } from "../ui/motion";
import { ease } from "../../lib/motion";

/** One message as the thread draws it, whatever its source (DM or mission chat). */
export interface ThreadMessage {
  id: number | string;
  sender_id: number;
  body: string;
  created_at: string;
  sender_name: string;
  sender_username?: string | null;
  sender_avatar?: string | null;
  pending?: boolean;
  failed?: boolean;
}

interface ThreadProps {
  me: { id: number; name: string; username?: string | null; avatar_url?: string | null };
  messages: ThreadMessage[];
  loading: boolean;
  /** Resolves with the saved message; rejects to mark the draft failed. */
  onSend: (body: string) => Promise<ThreadMessage>;
  /** Replace the local list (optimistic drafts in and out). */
  setMessages: React.Dispatch<React.SetStateAction<ThreadMessage[]>>;
  header: React.ReactNode;
  empty?: React.ReactNode;
  /** Shown above the composer (request banners). */
  notice?: React.ReactNode;
  /** When set, the composer is replaced by this explanation. */
  composerDisabled?: string | null;
  /** Other side's read time (DMs): adds "Seen" under your last message. */
  otherLastReadAt?: string | null;
  hasMore?: boolean;
  onLoadMore?: () => Promise<void>;
  placeholder?: string;
  maxLength?: number;
}

const GROUP_GAP_MS = 5 * 60e3;

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

const clock = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

export default function Thread({
  me,
  messages,
  loading,
  onSend,
  setMessages,
  header,
  empty,
  notice,
  composerDisabled,
  otherLastReadAt,
  hasMore,
  onLoadMore,
  placeholder = "Write a message",
  maxLength = 2000
}: ThreadProps) {
  const [text, setText] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const stickToBottom = useRef(true);
  const meId = me.id;
  const lastId = messages.length ? messages[messages.length - 1].id : null;

  // Follow new messages only when the reader is already at the bottom.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [lastId, loading]);

  // Auto-size the composer up to ~6 lines.
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 168)}px`;
  }, [text]);

  useEffect(() => {
    if (!loading && !composerDisabled) inputRef.current?.focus({ preventScroll: true });
  }, [loading, composerDisabled]);

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

  async function deliver(body: string, draftId: string) {
    try {
      const saved = await onSend(body);
      setMessages((list) => {
        const without = list.filter((m) => m.id !== draftId && m.id !== saved.id);
        return [...without, saved];
      });
    } catch {
      setMessages((list) => list.map((m) => (m.id === draftId ? { ...m, pending: false, failed: true } : m)));
    }
  }

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const body = text.trim();
    if (!body || composerDisabled) return;
    const draftId = `draft-${Date.now()}`;
    setText("");
    stickToBottom.current = true;
    setMessages((list) => [
      ...list,
      {
        id: draftId,
        sender_id: meId,
        body,
        created_at: new Date().toISOString(),
        sender_name: me.name,
        sender_username: me.username,
        sender_avatar: me.avatar_url,
        pending: true
      }
    ]);
    deliver(body, draftId);
  }

  function retry(m: ThreadMessage) {
    setMessages((list) => list.map((x) => (x.id === m.id ? { ...x, pending: true, failed: false } : x)));
    deliver(m.body, String(m.id));
  }

  const lastMine = [...messages].reverse().find((m) => m.sender_id === meId && !m.pending && !m.failed);
  const seen = !!(otherLastReadAt && lastMine && new Date(otherLastReadAt) >= new Date(lastMine.created_at));

  return (
    <div className="flex h-full min-h-0 flex-col">
      {header}

      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 md:px-8"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        {loading ? (
          <div className="space-y-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-9 w-9 rounded-[3px]" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className={`h-4 ${i === 1 ? "w-1/2" : "w-3/4"}`} />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">{empty}</div>
        ) : (
          <>
            {hasMore && (
              <div className="mb-6 flex justify-center">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="t-label h-10 px-4 transition-colors hover:text-ink disabled:opacity-50"
                >
                  {loadingMore ? "Loading…" : "Earlier messages"}
                </button>
              </div>
            )}
            <ol className="space-y-0.5">
              {messages.map((m, i) => {
                const prev = messages[i - 1];
                const newDay = !prev || new Date(prev.created_at).toDateString() !== new Date(m.created_at).toDateString();
                const grouped =
                  !newDay &&
                  prev &&
                  prev.sender_id === m.sender_id &&
                  new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() < GROUP_GAP_MS;
                const self = m.sender_id === meId;
                return (
                  <li key={m.id}>
                    {newDay && (
                      <div className="my-5 flex items-center gap-4" role="separator">
                        <span className="h-px flex-1 bg-line" />
                        <span className="t-label">{dayLabel(m.created_at)}</span>
                        <span className="h-px flex-1 bg-line" />
                      </div>
                    )}
                    <motion.div
                      initial={m.pending ? { opacity: 0, y: 6 } : false}
                      animate={{ opacity: m.pending ? 0.55 : 1, y: 0 }}
                      transition={{ duration: 0.25, ease: ease.out }}
                      className={`group flex gap-3 ${grouped ? "" : "pt-3"}`}
                    >
                      <div className="w-9 shrink-0">
                        {!grouped && <Avatar name={m.sender_name} src={m.sender_avatar} size={36} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        {!grouped && (
                          <p className="flex flex-wrap items-baseline gap-x-2 leading-tight">
                            <span className="text-subhead font-medium text-ink">{self ? "You" : m.sender_name}</span>
                            {!self && <Handle username={m.sender_username} className="text-footnote" />}
                            <time dateTime={m.created_at} className="tabular text-caption text-ink-3">
                              {clock(m.created_at)}
                            </time>
                          </p>
                        )}
                        <p className={`whitespace-pre-wrap break-words text-body font-light leading-relaxed text-ink-2 ${grouped ? "" : "mt-1"}`}>{m.body}</p>
                        {m.failed && (
                          <button
                            type="button"
                            onClick={() => retry(m)}
                            className="mt-1 flex items-center gap-1.5 text-footnote text-crimson hover:text-ink"
                          >
                            <RotateCcw className="h-3.5 w-3.5" /> Not sent. Tap to retry
                          </button>
                        )}
                        {seen && lastMine && m.id === lastMine.id && <p className="t-label mt-1.5">Seen</p>}
                      </div>
                    </motion.div>
                  </li>
                );
              })}
            </ol>
          </>
        )}
      </div>

      {notice}

      {composerDisabled ? (
        <p className="border-t border-line px-5 py-5 text-center text-subhead text-ink-3 md:px-8">{composerDisabled}</p>
      ) : (
        <form
          onSubmit={submit}
          className="flex items-end gap-3 border-t border-line bg-bg px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 md:px-8 md:pb-4"
        >
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
            placeholder={placeholder}
            className="min-h-[48px] flex-1 resize-none rounded-[2px] border border-line bg-surface px-4 py-3 text-body leading-6 text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-ink/40"
          />
          <motion.button
            type="submit"
            aria-label="Send"
            disabled={!text.trim()}
            whileTap={{ scale: 0.92 }}
            className="btn-primary h-12 w-12 shrink-0 p-0"
          >
            {messages.some((m) => m.pending) ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-[18px] w-[18px]" />}
          </motion.button>
        </form>
      )}
    </div>
  );
}
