"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, Check, Heart, Megaphone, MessageCircle, Star, UserPlus, Zap } from "lucide-react";
import { User } from "../app/types";
import { Avatar, shortTime } from "./inbox/people";
import { Skeleton } from "./ui/motion";
import PublicProfile from "./PublicProfile";

type Api = (path: string, options?: RequestInit & { background?: boolean }) => Promise<any>;

export interface AppNotification {
  id: number;
  type: string;
  title: string;
  body: string | null;
  mission_id: number | null;
  mission_title: string | null;
  post_id: number | null;
  actor: { id: number; name: string; username: string | null; avatar_url: string | null } | null;
  read: boolean;
  created_at: string;
}

const ICON: Record<string, React.ElementType> = {
  join_request: UserPlus,
  request_approved: Check,
  checked_in: Zap,
  rated: Star,
  host_broadcast: Megaphone,
  follow: UserPlus,
  reaction: Heart,
  comment: MessageCircle
};

function bucket(iso: string, read: boolean) {
  if (!read) return "New";
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Today";
  if (now.getTime() - d.getTime() < 7 * 86400e3) return "This week";
  return "Earlier";
}
const ORDER = ["New", "Today", "This week", "Earlier"];

export default function Notifications({
  user,
  api,
  setTab,
  onUnread
}: {
  user: User;
  api: Api;
  setTab: (tab: string) => void;
  onUnread?: (n: number) => void;
}) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [profileId, setProfileId] = useState<number | null>(null);

  const load = useCallback(
    async (quiet = false) => {
      try {
        const r = await api("/notifications", { background: quiet });
        setItems(r.notifications);
        setHasMore(r.has_more);
        setError("");
      } catch (err: any) {
        setError(err.message || "Couldn't load notifications.");
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  // Seeing the list reads it: the "New" group stays highlighted for this visit.
  useEffect(() => {
    load().then(() => {
      api("/notifications/read", { method: "POST", background: true })
        .then(() => onUnread?.(0))
        .catch(() => {});
    });
    const onLive = () => load(true);
    window.addEventListener("lockin:notification", onLive);
    return () => window.removeEventListener("lockin:notification", onLive);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function more() {
    const last = items[items.length - 1];
    if (!last) return;
    const r = await api(`/notifications?before=${last.id}`);
    setItems((list) => [...list, ...r.notifications]);
    setHasMore(r.has_more);
  }

  function open(n: AppNotification) {
    if (n.type === "follow" && n.actor) return setProfileId(n.actor.id);
    if (n.post_id) return setTab("feed");
    if (n.mission_id) return setTab("active");
  }

  const groups = useMemo(() => {
    const map = new Map<string, AppNotification[]>();
    for (const n of items) {
      const k = bucket(n.created_at, n.read);
      map.set(k, [...(map.get(k) || []), n]);
    }
    return ORDER.filter((k) => map.has(k)).map((k) => ({ label: k, items: map.get(k)! }));
  }, [items]);

  return (
    <section className="mx-auto w-full max-w-2xl flex-1 pt-2 md:pt-10">
      <div className="px-5">
        <p className="t-section">Updates</p>
        <h1 className="t-display mt-3 text-large-title text-ink md:text-[56px] md:leading-none">Notifications</h1>
      </div>

      {loading ? (
        <div className="mt-6 space-y-1 px-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <Skeleton className="h-11 w-11 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : error && !items.length ? (
        <div className="px-5 py-14 text-center">
          <p className="text-subhead text-ink-2">{error}</p>
          <button type="button" onClick={() => load()} className="btn-ghost mt-4 h-11 px-6">
            Try again
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center px-8 py-20 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full border border-line text-ink-3">
            <Bell className="h-7 w-7" strokeWidth={1.5} />
          </span>
          <p className="mt-5 text-title-3 text-ink">Nothing yet</p>
          <p className="mt-2 max-w-[280px] text-subhead text-ink-2">
            Join requests, check-ins, ratings, new followers and reactions to your posts show up here.
          </p>
        </div>
      ) : (
        <div className="mt-4 pb-6">
          {groups.map((g) => (
            <div key={g.label} className="mt-4 first:mt-0">
              <h2 className="px-5 pb-1 pt-2 text-headline text-ink">{g.label}</h2>
              <ul>
                {g.items.map((n) => (
                  <li key={n.id}>
                    <Row n={n} meId={user.id} onOpen={() => open(n)} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <button type="button" onClick={more} className="btn-ghost h-11 px-6">
                Show older
              </button>
            </div>
          )}
        </div>
      )}

      {profileId && (
        <PublicProfile userId={profileId} viewerId={user.id} isOpen={!!profileId} onClose={() => setProfileId(null)} api={api} />
      )}
    </section>
  );
}

function Row({ n, meId, onOpen }: { n: AppNotification; meId: number; onOpen: () => void }) {
  const Icon = ICON[n.type] || Bell;
  const name = n.actor?.name;
  // Bold the person's name at the start of the line, Instagram-style.
  const rest = name && n.title.startsWith(name) ? n.title.slice(name.length) : null;
  const actionable = !!(n.mission_id || n.post_id || (n.type === "follow" && n.actor && n.actor.id !== meId));

  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={!actionable}
      className={`flex w-full items-center gap-3.5 px-5 py-3 text-left transition-colors hover:bg-surface disabled:cursor-default disabled:hover:bg-transparent ${
        n.read ? "" : "shadow-[inset_2px_0_0_rgb(var(--signal))]"
      }`}
    >
      <span className="relative shrink-0">
        {n.actor ? (
          <Avatar name={n.actor.name} src={n.actor.avatar_url} size={44} round />
        ) : (
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-ink-2">
            <Icon className="h-5 w-5" strokeWidth={1.5} />
          </span>
        )}
        {n.actor && (
          <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-bg bg-signal text-ink">
            <Icon className="h-2.5 w-2.5" strokeWidth={2.5} />
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-subhead leading-snug text-ink-2">
          {rest !== null ? (
            <>
              <span className="font-medium text-ink">{name}</span>
              {rest}
            </>
          ) : (
            <span className="text-ink">{n.title}</span>
          )}
          <time dateTime={n.created_at} className="tabular whitespace-nowrap text-ink-3">
            {"  "}
            {shortTime(n.created_at)}
          </time>
        </span>
        {n.body && <span className="mt-0.5 block truncate text-footnote text-ink-3">{n.body}</span>}
      </span>
      {!n.read && <span aria-label="New" className="h-2 w-2 shrink-0 rounded-full bg-signal" />}
    </button>
  );
}
