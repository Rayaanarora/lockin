"use client";

import React, { useEffect, useState } from "react";
import { ArrowRight, MapPin } from "lucide-react";
import { User, Mission, InboxPerson } from "../app/types";
import { Skeleton } from "./ui/motion";

type Api = (path: string, options?: RequestInit & { background?: boolean }) => Promise<any>;

function startsIn(iso?: string | null) {
  if (!iso) return "Anytime";
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "Now";
  const h = Math.floor(diff / 3600e3);
  const m = Math.max(1, Math.ceil((diff % 3600e3) / 60e3));
  if (h >= 24) return new Date(iso).toLocaleDateString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" });
  return h ? `In ${h}h ${m}m` : `In ${m} min`;
}

/**
 * Desktop-only companion to the feed: what's about to happen on campus and
 * who to follow. Uses existing endpoints; renders nothing it can't fill.
 */
export default function FeedRail({
  user,
  api,
  setTab,
  onOpenProfile
}: {
  user: User;
  api: Api;
  setTab?: (tab: string) => void;
  onOpenProfile: (id: number) => void;
}) {
  const [missions, setMissions] = useState<Mission[] | null>(null);
  const [people, setPeople] = useState<InboxPerson[] | null>(null);
  const [followed, setFollowed] = useState<Set<number>>(new Set());

  useEffect(() => {
    let live = true;
    api("/missions/feed", { background: true })
      .then((rows: Mission[]) => {
        if (!live) return;
        // Real peer missions with a time, soonest first.
        const upcoming = (rows || [])
          .filter((m) => m.creator_id && m.datetime && m.mission_type !== "solo" && new Date(m.datetime).getTime() > Date.now() - 15 * 60e3)
          .sort((a, b) => new Date(a.datetime!).getTime() - new Date(b.datetime!).getTime());
        setMissions(upcoming.slice(0, 3));
      })
      .catch(() => live && setMissions([]));

    Promise.all([
      api("/inbox/people?q=", { background: true }).catch(() => []),
      api(`/follow/${user.id}/following`, { background: true }).catch(() => [])
    ]).then(([all, following]) => {
      if (!live) return;
      const already = new Set<number>((Array.isArray(following) ? following : following?.following || []).map((f: any) => f.id ?? f.followingId));
      setPeople((all as InboxPerson[]).filter((p) => !already.has(p.id)).slice(0, 4));
    });
    return () => {
      live = false;
    };
  }, [api, user.id]);

  async function follow(id: number) {
    setFollowed((s) => new Set(s).add(id));
    try {
      await api("/follow", { method: "POST", body: JSON.stringify({ followingId: id }) });
    } catch (err: any) {
      // "Already following" is still a follow; anything else rolls back.
      if (!/already/i.test(err?.message || "")) {
        setFollowed((s) => {
          const n = new Set(s);
          n.delete(id);
          return n;
        });
      }
    }
  }

  return (
    <aside className="hidden space-y-10 lg:block" aria-label="On your campus">
      <section aria-labelledby="rail-happening">
        <div className="flex items-baseline justify-between border-b border-line pb-3">
          <h2 id="rail-happening" className="t-section">Happening on campus</h2>
          {setTab && (
            <button type="button" onClick={() => setTab("missions")} className="flex h-9 items-center gap-1 text-footnote text-ink-2 transition-colors hover:text-ink">
              Deck <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {missions === null ? (
          <div className="space-y-4 pt-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : missions.length === 0 ? (
          <p className="pt-4 text-subhead text-ink-3">Nothing scheduled yet. Launch one and others can lock in.</p>
        ) : (
          <ul>
            {missions.map((m) => (
              <li key={m.id} className="border-b border-line">
                <button type="button" onClick={() => setTab?.("missions")} className="group block w-full py-4 text-left">
                  <p className="t-label">{startsIn(m.datetime)}{m.category_name ? ` · ${m.category_name}` : ""}</p>
                  <p className="mt-1 line-clamp-2 text-headline text-ink transition-colors group-hover:text-crimson">{m.title}</p>
                  <p className="mt-1 flex items-center gap-1.5 truncate text-footnote text-ink-3">
                    <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{m.location || "Campus"}</span>
                    <span aria-hidden="true">·</span>
                    <span className="shrink-0">{m.locked_in_count ?? 0} locked in</span>
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="rail-people">
        <h2 id="rail-people" className="t-section border-b border-line pb-3">People on your campus</h2>
        {people === null ? (
          <div className="space-y-4 pt-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : people.length === 0 ? (
          <p className="pt-4 text-subhead text-ink-3">You follow everyone here. Invite a friend to LOCKIN.</p>
        ) : (
          <ul className="pt-2">
            {people.map((p) => {
              const on = followed.has(p.id);
              return (
                <li key={p.id} className="flex items-center gap-3 py-2">
                  <button type="button" onClick={() => onOpenProfile(p.id)} aria-label={`View ${p.name}`} className="shrink-0 rounded-full">
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt="" className="h-10 w-10 rounded-full border border-line object-cover" />
                    ) : (
                      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-raised text-footnote font-medium text-ink-2">
                        {p.name.split(" ").map((x) => x[0]).join("").slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </button>
                  <button type="button" onClick={() => onOpenProfile(p.id)} className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-subhead text-ink">{p.name}</span>
                    <span className="block truncate text-footnote text-ink-3">{p.username ? `@${p.username}` : p.department || ""}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => !on && follow(p.id)}
                    disabled={on}
                    aria-pressed={on}
                    className={`h-11 shrink-0 px-3.5 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors ${
                      on ? "text-ink-3" : "border border-ink/40 text-ink hover:bg-ink hover:text-bg"
                    }`}
                  >
                    {on ? "Following" : "Follow"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </aside>
  );
}
