"use client";

import React, { useCallback, useEffect, useState } from "react";
import { ChevronLeft, Users } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { User, InboxPerson, DmMessage } from "../../app/types";
import Thread, { Outgoing, ThreadMessage } from "./Thread";
import { Avatar, Handle } from "./people";

type Api = (path: string, options?: RequestInit) => Promise<any>;

/** Broadcast name the app shell re-dispatches realtime "dm" events under. */
export const DM_EVENT = "lockin:dm";
export interface DmEventDetail {
  thread_id: number;
  status: "active" | "request";
  incoming_request: boolean;
  from: InboxPerson;
  message: DmMessage;
  /** "Sent a photo" etc. for notifications. */
  preview?: string;
}

function PaneHeader({
  onBack,
  avatar,
  title,
  sub,
  action
}: {
  onBack?: () => void;
  avatar: React.ReactNode;
  title: React.ReactNode;
  sub?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex items-center gap-3 border-b border-line px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:px-8 md:pt-5">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to inbox"
          className="flex h-11 w-11 shrink-0 items-center justify-center text-ink-2 transition-colors hover:text-ink"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {avatar}
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-headline text-ink">{title}</h2>
        {sub && <p className="truncate text-footnote text-ink-3">{sub}</p>}
      </div>
      {action}
    </header>
  );
}

/* ─── Mission chat ─────────────────────────────────────────────────── */

const fromMission = (m: any): ThreadMessage => ({
  id: m.id,
  sender_id: m.sender_id,
  kind: m.kind || "text",
  body: m.message,
  media_url: m.media_url,
  media_meta: m.media_meta,
  created_at: m.created_at,
  sender_name: m.sender_name,
  sender_username: m.sender_username
});

export function MissionChatPane({
  missionId,
  title,
  sub,
  user,
  api,
  onBack,
  onActivity
}: {
  missionId: number;
  title: string;
  sub?: string;
  user: User;
  api: Api;
  onBack?: () => void;
  onActivity?: () => void;
}) {
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError("");
    api(`/messages/${missionId}`)
      .then((list) => live && setMessages(list.map(fromMission)))
      .catch((err) => live && setError(err.message || "Couldn't load this chat."))
      .finally(() => {
        if (live) setLoading(false);
        onActivity?.();
      });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missionId]);

  // Private channel: only the mission's members can receive (supabase/security.sql).
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase.channel(`mission_chat:${missionId}`, { config: { private: true } });
    channel.on("broadcast", { event: "new_message" }, ({ payload }: { payload: any }) => {
      if (payload.mission_id !== missionId) return;
      setMessages((list) => (list.some((m) => m.id === payload.id) ? list : [...list, fromMission(payload)]));
      if (payload.sender_id !== user.id) api(`/inbox/mission/${missionId}/read`, { method: "POST" }).catch(() => {});
    });
    channel.subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [missionId, user.id, api]);

  return (
    <Thread
      me={user}
      messages={messages}
      setMessages={setMessages}
      loading={loading}
      showNames
      onSend={async (out: Outgoing) => {
        const saved = await api(`/messages/${missionId}`, { method: "POST", body: JSON.stringify(out) });
        onActivity?.();
        return fromMission(saved);
      }}
      maxLength={1000}
      placeholder="Message the crew"
      composerDisabled={error || null}
      header={
        <PaneHeader
          onBack={onBack}
          avatar={
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] border border-line bg-raised text-ink-2">
              <Users className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </span>
          }
          title={title}
          sub={sub || "Mission chat"}
        />
      }
      empty={
        <div className="max-w-[280px] text-center">
          <p className="t-section text-crimson">Mission chat</p>
          <p className="mt-3 text-title-3 text-ink">Sort out the details</p>
          <p className="mt-1.5 text-subhead text-ink-2">Where exactly, who&apos;s bringing what. Everyone on the mission sees this.</p>
        </div>
      }
    />
  );
}

/* ─── Direct messages ──────────────────────────────────────────────── */

export function DmPane({
  threadId,
  draftWith,
  user,
  api,
  onBack,
  onChanged,
  onOpened
}: {
  /** An existing thread… */
  threadId?: number | null;
  /** …or a person you haven't messaged yet. */
  draftWith?: InboxPerson | null;
  user: User;
  api: Api;
  onBack?: () => void;
  /** Something changed that the list should reflect (sent, accepted, declined). */
  onChanged?: () => void;
  /** A draft became a real thread. */
  onOpened?: (threadId: number) => void;
}) {
  const [other, setOther] = useState<InboxPerson | null>(draftWith || null);
  const [status, setStatus] = useState<"active" | "request" | null>(null);
  const [incoming, setIncoming] = useState(false);
  const [outgoing, setOutgoing] = useState(false);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [loading, setLoading] = useState(!!threadId);
  const [hasMore, setHasMore] = useState(false);
  const [otherRead, setOtherRead] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const toThread = useCallback(
    (m: DmMessage, who?: InboxPerson | null): ThreadMessage => {
      const mine = m.sender_id === user.id;
      const p = mine ? null : who;
      return {
        id: m.id,
        sender_id: m.sender_id,
        kind: m.kind || "text",
        body: m.body,
        media_url: m.media_url,
        media_meta: m.media_meta,
        created_at: m.created_at,
        sender_name: mine ? user.name : p?.name || "Them",
        sender_username: mine ? user.username : p?.username,
        sender_avatar: mine ? user.avatar_url : p?.avatar_url
      };
    },
    [user]
  );

  useEffect(() => {
    if (!threadId) {
      setMessages([]);
      setStatus(null);
      setLoading(false);
      return;
    }
    let live = true;
    setLoading(true);
    setError("");
    api(`/inbox/dm/${threadId}`)
      .then((r) => {
        if (!live) return;
        setOther(r.thread.other);
        setStatus(r.thread.status);
        setIncoming(r.thread.incoming_request);
        setOutgoing(r.thread.outgoing_request);
        setOtherRead(r.other_last_read_at);
        setHasMore(r.has_more);
        setMessages(r.messages.map((m: DmMessage) => toThread(m, r.thread.other)));
        onChanged?.();
      })
      .catch((err) => live && setError(err.message || "Couldn't open this conversation."))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  // Live: messages for this thread arrive on your private notification channel.
  useEffect(() => {
    if (!threadId) return;
    const onDm = (e: Event) => {
      const d = (e as CustomEvent<DmEventDetail>).detail;
      if (d.thread_id !== threadId) return;
      setMessages((list) => (list.some((m) => m.id === d.message.id) ? list : [...list, toThread(d.message, d.from)]));
      setStatus(d.status);
      if (d.status === "active") {
        setIncoming(false);
        setOutgoing(false);
      }
      setOtherRead(d.message.created_at);
      api(`/inbox/dm/${threadId}/read`, { method: "POST" }).catch(() => {});
    };
    window.addEventListener(DM_EVENT, onDm);
    return () => window.removeEventListener(DM_EVENT, onDm);
  }, [threadId, api, toThread]);

  async function loadMore() {
    if (!threadId || !messages.length) return;
    const oldest = messages.find((m) => typeof m.id === "number");
    if (!oldest) return;
    const r = await api(`/inbox/dm/${threadId}?before=${oldest.id}`);
    setHasMore(r.has_more);
    setMessages((list) => [...r.messages.map((m: DmMessage) => toThread(m, other)), ...list]);
  }

  async function accept() {
    if (!threadId) return;
    setBusy(true);
    try {
      await api(`/inbox/dm/${threadId}/accept`, { method: "POST" });
      setStatus("active");
      setIncoming(false);
      onChanged?.();
    } catch (err: any) {
      setError(err.message || "Couldn't accept.");
    } finally {
      setBusy(false);
    }
  }

  async function decline() {
    if (!threadId) return;
    setBusy(true);
    try {
      await api(`/inbox/dm/${threadId}`, { method: "DELETE" });
      onChanged?.();
      onBack?.();
    } catch (err: any) {
      setError(err.message || "Couldn't decline.");
      setBusy(false);
    }
  }

  const name = other?.name || "Conversation";
  const sentInRequest = messages.filter((m) => m.sender_id === user.id && !m.failed).length;
  const capped = outgoing && sentInRequest >= 3;

  return (
    <Thread
      me={user}
      messages={messages}
      setMessages={setMessages}
      loading={loading}
      hasMore={hasMore}
      onLoadMore={loadMore}
      otherLastReadAt={otherRead}
      onSend={async (out: Outgoing) => {
        if (threadId) {
          const r = await api(`/inbox/dm/${threadId}`, { method: "POST", body: JSON.stringify(out) });
          setStatus(r.status);
          if (r.status === "active") setIncoming(false);
          onChanged?.();
          return toThread(r.message, other);
        }
        const r = await api(`/inbox/dm`, { method: "POST", body: JSON.stringify({ ...out, toUserId: other?.id }) });
        setStatus(r.status);
        setOutgoing(r.status === "request");
        onOpened?.(r.thread_id);
        onChanged?.();
        return toThread(r.message, other);
      }}
      composerDisabled={
        error && !messages.length
          ? error
          : capped
            ? `Waiting for ${name.split(" ")[0]} to accept your request.`
            : null
      }
      placeholder={incoming ? "Reply to accept" : `Message ${name.split(" ")[0]}`}
      header={
        <PaneHeader
          onBack={onBack}
          avatar={<Avatar name={other?.name} src={other?.avatar_url} size={40} round />}
          title={name}
          sub={
            <>
              <Handle username={other?.username} />
              {other?.department ? <span>{other?.username ? " · " : ""}{other.department}</span> : null}
            </>
          }
        />
      }
      notice={
        incoming ? (
          <div className="flex flex-col gap-3 border-t border-line bg-surface px-4 py-4 md:flex-row md:items-center md:justify-between md:px-8">
            <div>
              <p className="t-section text-crimson">Message request</p>
              <p className="mt-1 text-subhead text-ink-2">
                {name.split(" ")[0]} doesn&apos;t follow you yet. Reply or accept to move this to your inbox.
              </p>
            </div>
            <div className="flex gap-2">
              <button type="button" disabled={busy} onClick={decline} className="btn-ghost h-11 flex-1 px-5 md:flex-none">
                Decline
              </button>
              <button type="button" disabled={busy} onClick={accept} className="btn-primary h-11 flex-1 px-5 md:flex-none">
                Accept
              </button>
            </div>
          </div>
        ) : outgoing && !capped ? (
          <p className="border-t border-line px-4 py-2.5 text-center text-footnote text-ink-3 md:px-8">
            Sent as a request. {name.split(" ")[0]} sees it once they accept or reply.
          </p>
        ) : null
      }
      empty={
        <div className="flex max-w-[300px] flex-col items-center text-center">
          <Avatar name={other?.name} src={other?.avatar_url} size={88} round />
          <p className="mt-4 text-title-3 text-ink">{name}</p>
          <Handle username={other?.username} className="text-subhead" />
          <p className="mt-4 text-subhead text-ink-2">
            Say what you&apos;re working on, or ask them to lock in with you.
          </p>
        </div>
      }
    />
  );
}
