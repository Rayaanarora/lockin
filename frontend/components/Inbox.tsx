"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Loader2, PenSquare, Search, Users } from "lucide-react";
import { User, Conversation, InboxPerson } from "../app/types";
import { Portal, Skeleton } from "./ui/motion";
import { LockinMark } from "./ui/LockinLogo";
import { Avatar, shortTime } from "./inbox/people";
import { DmPane, MissionChatPane, DM_EVENT } from "./inbox/panes";
import { ease } from "../lib/motion";

type Api = (path: string, options?: RequestInit & { background?: boolean }) => Promise<any>;

/** What the right pane (or the phone overlay) shows. */
type Selection =
  | { kind: "dm"; threadId: number }
  | { kind: "draft"; person: InboxPerson }
  | { kind: "mission"; missionId: number; title: string; sub?: string }
  | null;

export type InboxTarget = { userId: number } | { missionId: number; title: string } | null;

const FILTERS = [
  { key: "all", label: "All" },
  { key: "dm", label: "Direct" },
  { key: "mission", label: "Missions" },
  { key: "requests", label: "Requests" }
] as const;
type Filter = (typeof FILTERS)[number]["key"];

function useIsDesktop() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return desktop;
}

const missionSub = (c: Extract<Conversation, { kind: "mission" }>) =>
  `${c.member_count} ${c.member_count === 1 ? "member" : "members"}${c.is_host ? " · You're hosting" : c.host ? ` · Hosted by ${c.host.name}` : ""}`;

export default function Inbox({
  user,
  api,
  target,
  onTargetHandled,
  onUnread
}: {
  user: User;
  api: Api;
  /** Open straight into a conversation (from a profile or a mission card). */
  target?: InboxTarget;
  onTargetHandled?: () => void;
  onUnread?: (n: number) => void;
}) {
  const desktop = useIsDesktop();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Selection>(null);
  const [composing, setComposing] = useState(false);

  const refresh = useCallback(async (quiet = true) => {
    try {
      const r = await api("/inbox", { background: quiet });
      setConversations(r.conversations);
      setError("");
      onUnread?.(r.conversations.reduce((n: number, c: Conversation) => n + c.unread, 0));
    } catch (err: any) {
      setError(err.message || "Couldn't load your inbox.");
    } finally {
      setLoading(false);
    }
  }, [api, onUnread]);

  useEffect(() => {
    refresh(false);
    const t = setInterval(() => refresh(), 20000);
    const onDm = () => refresh();
    window.addEventListener(DM_EVENT, onDm);
    return () => {
      clearInterval(t);
      window.removeEventListener(DM_EVENT, onDm);
    };
  }, [refresh]);

  // Deep link from elsewhere in the app.
  useEffect(() => {
    if (!target) return;
    let live = true;
    (async () => {
      if ("missionId" in target) {
        setSelected({ kind: "mission", missionId: target.missionId, title: target.title });
      } else {
        try {
          const r = await api(`/inbox/dm/with/${target.userId}`);
          if (!live) return;
          setSelected(r.thread ? { kind: "dm", threadId: r.thread.thread_id } : { kind: "draft", person: r.other });
        } catch (err: any) {
          if (live) setError(err.message || "You can't message this person.");
        }
      }
      onTargetHandled?.();
    })();
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  const requestCount = conversations.filter((c) => c.kind === "dm" && c.incoming_request).length;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^@/, "");
    return conversations.filter((c) => {
      const isRequest = c.kind === "dm" && c.incoming_request;
      if (filter === "requests" && !isRequest) return false;
      if (filter !== "requests" && isRequest) return false;
      if (filter === "dm" && c.kind !== "dm") return false;
      if (filter === "mission" && c.kind !== "mission") return false;
      if (!q) return true;
      return c.kind === "dm"
        ? c.other.name.toLowerCase().includes(q) || (c.other.username || "").includes(q)
        : c.title.toLowerCase().includes(q);
    });
  }, [conversations, filter, query]);

  const isSelected = (c: Conversation) =>
    (c.kind === "dm" && selected?.kind === "dm" && selected.threadId === c.thread_id) ||
    (c.kind === "mission" && selected?.kind === "mission" && selected.missionId === c.mission_id);

  function open(c: Conversation) {
    setComposing(false);
    if (c.kind === "dm") setSelected({ kind: "dm", threadId: c.thread_id });
    else setSelected({ kind: "mission", missionId: c.mission_id, title: c.title, sub: missionSub(c) });
    // Optimistically clear the unread marker; the pane marks it read on the server.
    setConversations((list) => list.map((x) => (x.key === c.key ? { ...x, unread: 0 } : x)));
  }

  async function startWith(p: InboxPerson) {
    setComposing(false);
    try {
      const r = await api(`/inbox/dm/with/${p.id}`);
      setSelected(r.thread ? { kind: "dm", threadId: r.thread.thread_id } : { kind: "draft", person: r.other });
    } catch (err: any) {
      setError(err.message || "You can't message this person.");
    }
  }

  const close = () => setSelected(null);

  // Phone overlay: Escape goes back to the list.
  useEffect(() => {
    if (desktop || !selected) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [desktop, selected]);

  const pane =
    selected?.kind === "mission" ? (
      <MissionChatPane
        key={`m-${selected.missionId}`}
        missionId={selected.missionId}
        title={selected.title}
        sub={selected.sub}
        user={user}
        api={api}
        onBack={desktop ? undefined : close}
        onActivity={() => refresh()}
      />
    ) : selected?.kind === "dm" ? (
      <DmPane key={`dm-${selected.threadId}`} threadId={selected.threadId} user={user} api={api} onBack={desktop ? undefined : close} onChanged={() => refresh()} />
    ) : selected?.kind === "draft" ? (
      <DmPane
        key={`draft-${selected.person.id}`}
        draftWith={selected.person}
        user={user}
        api={api}
        onBack={desktop ? undefined : close}
        onChanged={() => refresh()}
        onOpened={(threadId) => setSelected({ kind: "dm", threadId })}
      />
    ) : null;

  return (
    <section className="mx-auto flex w-full flex-1 md:h-[calc(100dvh-4rem)] md:flex-none md:max-w-[1240px] md:px-8 md:pt-6">
      <div className="flex w-full flex-1 overflow-hidden md:grid md:grid-cols-[minmax(300px,380px)_minmax(0,1fr)] md:grid-rows-[minmax(0,1fr)] md:border md:border-line">
        {/* ── List column ── */}
        <div className="flex min-h-0 w-full flex-col md:border-r md:border-line">
          {composing ? (
            <ComposePanel api={api} onBack={() => setComposing(false)} onPick={startWith} />
          ) : (
            <>
              <div className="px-5 pt-2 md:px-5 md:pt-6">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="t-section">Inbox</p>
                    <h1 className="t-display mt-3 text-large-title text-ink md:text-title-1">Messages</h1>
                  </div>
                  <button
                    type="button"
                    onClick={() => setComposing(true)}
                    aria-label="New message"
                    className="btn-ghost h-11 w-11 shrink-0 p-0"
                  >
                    <PenSquare className="h-[18px] w-[18px]" strokeWidth={1.5} />
                  </button>
                </div>

                <label className="mt-5 flex h-11 items-center gap-2.5 rounded-full bg-raised px-4 focus-within:ring-1 focus-within:ring-ink/30">
                  <Search className="h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" />
                  <span className="sr-only">Search messages</span>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search messages"
                    className="h-full min-w-0 flex-1 bg-transparent text-subhead text-ink outline-none placeholder:text-ink-3"
                  />
                </label>
              </div>

              <div className="mt-3 flex gap-1 overflow-x-auto border-b border-line px-3 scrollbar-none" role="tablist" aria-label="Filter conversations">
                {FILTERS.map((f) => {
                  const on = filter === f.key;
                  return (
                    <button
                      key={f.key}
                      type="button"
                      role="tab"
                      aria-selected={on}
                      onClick={() => setFilter(f.key)}
                      className={`relative flex h-11 shrink-0 items-center gap-1.5 px-3 text-[11px] font-medium uppercase tracking-[0.2em] transition-colors ${
                        on ? "text-ink" : "text-ink-3 hover:text-ink-2"
                      }`}
                    >
                      {f.label}
                      {f.key === "requests" && requestCount > 0 && <span className="tabular text-crimson">{requestCount}</span>}
                      {on && <motion.span layoutId="inbox-filter" className="absolute inset-x-3 bottom-0 h-px bg-signal" />}
                    </button>
                  );
                })}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto">
                {loading ? (
                  <div className="space-y-px">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-3 px-5 py-4">
                        <Skeleton className="h-12 w-12 rounded-[3px]" />
                        <div className="flex-1 space-y-2 pt-1">
                          <Skeleton className="h-3.5 w-1/3" />
                          <Skeleton className="h-3 w-2/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : error && !conversations.length ? (
                  <div className="px-5 py-10 text-center">
                    <p className="text-subhead text-ink-2">{error}</p>
                    <button type="button" onClick={() => refresh(false)} className="btn-ghost mt-4 h-11 px-6">
                      Try again
                    </button>
                  </div>
                ) : visible.length === 0 ? (
                  <EmptyList filter={filter} searching={!!query.trim()} onCompose={() => setComposing(true)} />
                ) : (
                  <ul className="py-2">
                    {visible.map((c) => (
                      <li key={c.key}>
                        <ConversationRow c={c} meId={user.id} active={desktop && isSelected(c)} onOpen={() => open(c)} />
                      </li>
                    ))}
                  </ul>
                )}
                {error && conversations.length > 0 && <p className="px-5 py-3 text-footnote text-crimson">{error}</p>}
              </div>
            </>
          )}
        </div>

        {/* ── Conversation column (desktop) ── */}
        {desktop && (
          <div className="hidden min-h-0 flex-col md:flex">
            {pane || (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                <LockinMark size={56} color="rgb(var(--ink-3))" />
                <p className="mt-6 text-title-3 text-ink">Your messages</p>
                <p className="mt-2 max-w-[300px] text-subhead text-ink-2">
                  Pick a conversation, or message someone on your campus.
                </p>
                <button type="button" onClick={() => setComposing(true)} className="btn-primary mt-7 h-12 px-7">
                  New message
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Conversation overlay (phone) ── */}
      {!desktop && (
        <Portal>
          <AnimatePresence>
            {pane && (
              <motion.div
                key="pane"
                className="fixed inset-0 z-[995] flex flex-col bg-bg"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%", transition: { duration: 0.22, ease: ease.inOut } }}
                transition={{ duration: 0.32, ease: ease.out }}
                role="dialog"
                aria-modal="true"
                aria-label="Conversation"
              >
                {pane}
              </motion.div>
            )}
          </AnimatePresence>
        </Portal>
      )}
    </section>
  );
}

function ConversationRow({ c, meId, active, onOpen }: { c: Conversation; meId: number; active: boolean; onOpen: () => void }) {
  const unread = c.unread > 0;
  const name = c.kind === "dm" ? c.other.name : c.title;
  let preview: string;
  if (c.kind === "dm") {
    preview = c.last_message ? `${c.last_message.sender_id === meId ? "You: " : ""}${c.last_message.body}` : "Say hi";
  } else {
    preview = c.last_message
      ? `${c.last_message.sender_id === meId ? "You" : c.last_message.sender_name.split(" ")[0]}: ${c.last_message.body}`
      : c.is_host
        ? "No messages yet"
        : "No messages yet";
  }
  const tag =
    c.kind === "dm" && c.incoming_request ? "Request · " : c.kind === "dm" && c.outgoing_request ? "Pending · " : c.kind === "mission" ? "Mission · " : "";

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-current={active ? "true" : undefined}
      aria-label={`${name}${unread ? `, ${c.unread} unread` : ""}`}
      className={`relative flex w-full items-center gap-3.5 px-5 py-2.5 text-left transition-colors hover:bg-surface ${active ? "bg-surface" : ""}`}
    >
      {c.kind === "dm" ? (
        <Avatar name={c.other.name} src={c.other.avatar_url} size={56} round />
      ) : (
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[4px] border border-line bg-raised text-ink-2">
          <Users className="h-6 w-6" strokeWidth={1.5} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-subhead ${unread ? "font-medium text-ink" : "text-ink"}`}>{name}</span>
        <span className={`mt-0.5 flex min-w-0 text-footnote ${unread ? "font-medium text-ink" : "text-ink-3"}`}>
          <span className="truncate">
            {tag && <span className={c.kind === "dm" && c.incoming_request ? "text-crimson" : ""}>{tag}</span>}
            {preview}
          </span>
          {c.last_message && (
            <time dateTime={c.last_at} className="tabular shrink-0 whitespace-pre">
              {" · "}
              {shortTime(c.last_at)}
            </time>
          )}
        </span>
      </span>
      {unread && <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full bg-signal" />}
    </button>
  );
}

function EmptyList({ filter, searching, onCompose }: { filter: Filter; searching: boolean; onCompose: () => void }) {
  const copy = searching
    ? { title: "No matches", body: "Try a different name or @username." }
    : filter === "requests"
      ? { title: "No requests", body: "Messages from people you don't follow show up here first." }
      : filter === "mission"
        ? { title: "No mission chats yet", body: "Lock in to a group mission and its chat lands here." }
        : { title: "No conversations yet", body: "Message someone on your campus to get started." };
  return (
    <div className="px-6 py-14 text-center">
      <p className="text-title-3 text-ink">{copy.title}</p>
      <p className="mx-auto mt-2 max-w-[260px] text-subhead text-ink-2">{copy.body}</p>
      {!searching && filter !== "requests" && filter !== "mission" && (
        <button type="button" onClick={onCompose} className="btn-primary mt-6 h-12 px-7">
          New message
        </button>
      )}
    </div>
  );
}

function ComposePanel({ api, onBack, onPick }: { api: Api; onBack: () => void; onPick: (p: InboxPerson) => void }) {
  const [q, setQ] = useState("");
  const [people, setPeople] = useState<InboxPerson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await api(`/inbox/people?q=${encodeURIComponent(q.trim())}`);
        if (live) setPeople(r);
      } catch {
        if (live) setPeople([]);
      } finally {
        if (live) setLoading(false);
      }
    }, 250);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [q, api]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-line px-3 py-3 md:pt-6">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to messages"
          className="flex h-11 w-11 shrink-0 items-center justify-center text-ink-2 hover:text-ink"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-headline text-ink">New message</h2>
      </div>
      <div className="px-5 pt-4">
        <label className="flex h-11 items-center gap-2.5 rounded-full bg-raised px-4 focus-within:ring-1 focus-within:ring-ink/30">
          <Search className="h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" />
          <span className="sr-only">Search people</span>
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name or @username"
            autoCapitalize="none"
            className="h-full min-w-0 flex-1 bg-transparent text-subhead text-ink outline-none placeholder:text-ink-3"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-ink-3" />}
        </label>
        <p className="t-label mt-5">{q.trim() ? "People" : "On your campus"}</p>
      </div>
      <ul className="mt-2 min-h-0 flex-1 overflow-y-auto">
        {!loading && people.length === 0 && (
          <li className="px-5 py-8 text-center text-subhead text-ink-3">No one found on your campus.</li>
        )}
        {people.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => onPick(p)}
              className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-surface"
            >
              <Avatar name={p.name} src={p.avatar_url} size={44} round />
              <span className="min-w-0">
                <span className="block truncate text-subhead text-ink">{p.name}</span>
                <span className="block truncate text-footnote text-ink-3">
                  {p.username ? `@${p.username}` : ""}
                  {p.department ? `${p.username ? " · " : ""}${p.department}` : ""}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
