"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Flame } from "lucide-react";
import { User } from "./types";
import { spring } from "../lib/motion";

// Import custom modular components
import Shell from "../components/Shell";
import Header from "../components/Header";
import Nav from "../components/Nav";
import ProfileGate from "../components/ProfileGate";
import Feed from "../components/Feed";
import ActiveMissions from "../components/ActiveMissions";
import Profile from "../components/Profile";
import SocialFeed from "../components/SocialFeed";
import LoadingScreen from "../components/LoadingScreen";
import Inbox, { InboxTarget } from "../components/Inbox";
import ClaimUsername from "../components/ClaimUsername";
import Notifications from "../components/Notifications";
import GritGuide from "../components/GritGuide";
import { DM_EVENT, DmEventDetail } from "../components/inbox/panes";

import { supabase } from "../lib/supabase";
import { api, API, isDemoSession } from "../lib/api";

const SOCKET_URL = API.replace("/api", "");

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("missions");
  const [locked, setLocked] = useState(false);
  const [bootError, setBootError] = useState(false);
  const [toast, setToast] = useState<{ title: string; message: string; type: string } | null>(null);
  const [unread, setUnread] = useState(0);
  const [unreadNotes, setUnreadNotes] = useState(0);
  const [showGuide, setShowGuide] = useState(false);
  const [inboxTarget, setInboxTarget] = useState<InboxTarget>(null);
  const tabRef = useRef(tab);
  tabRef.current = tab;

  // Synchronize active tab from URL query params if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryTab = params.get("tab");
      if (queryTab && ["missions", "feed", "active", "inbox", "notifications", "profile"].includes(queryTab)) {
        setTab(queryTab);
      }
    }
  }, []);


  // Request Notification permission & Subscribe to Supabase Realtime Notifications
  useEffect(() => {
    if (!user || !supabase) return;

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }

    // Private channel: Supabase RLS lets only this user receive (supabase/security.sql).
    const channel = supabase.channel(`notifications:${user.id}`, { config: { private: true } });

    channel.on(
      "broadcast",
      { event: "push_notification" },
      ({ payload }: { payload: { title: string; message: string; type: string; missionId?: number } }) => {
        window.dispatchEvent(new CustomEvent("lockin:notification", { detail: payload }));
        if (tabRef.current !== "notifications") setUnreadNotes((n) => n + 1);
        // 1. Show in-app Toast
        setToast(payload);
        // Auto dismiss after 4 seconds
        setTimeout(() => {
          setToast((current) => (current && current.message === payload.message ? null : current));
        }, 4000);

        // 2. Issue browser native HTML5 Notification
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          try {
            new Notification(payload.title, { body: payload.message });
          } catch (e) {
            console.warn("Failed to trigger native notification:", e);
          }
        }
      }
    );

    // Direct messages ride the same private channel; open panes listen for the re-dispatch.
    channel.on("broadcast", { event: "dm" }, ({ payload }: { payload: DmEventDetail }) => {
      window.dispatchEvent(new CustomEvent(DM_EVENT, { detail: payload }));
      if (tabRef.current === "inbox") return;
      setUnread((n) => n + 1);
      const body = payload.preview || payload.message.body;
      const toastMsg = body.length > 90 ? `${body.slice(0, 90)}…` : body;
      setToast({
        title: payload.incoming_request ? `Message request from ${payload.from.name}` : payload.from.name,
        message: toastMsg,
        type: "dm"
      });
      setTimeout(() => setToast((t) => (t && t.type === "dm" && t.message === toastMsg ? null : t)), 4000);
    });

    channel.subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id]);

  const userRef = useRef<User | null>(null);
  userRef.current = user;

  // First visit after signing up: explain Grit once.
  useEffect(() => {
    if (!user?.username) return;
    try {
      const key = `lockin_guide_seen_${user.id}`;
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
      const t = setTimeout(() => setShowGuide(true), 900);
      return () => clearTimeout(t);
    } catch {}
  }, [user?.id, user?.username]);

  // Inbox badge: a cheap count, refreshed quietly in the background.
  useEffect(() => {
    if (!user?.username) return;
    let live = true;
    const tick = () => {
      api("/inbox/unread", { background: true })
        .then((r) => live && typeof r.count === "number" && setUnread(r.count))
        .catch(() => {});
      api("/notifications/unread", { background: true })
        .then((r) => live && typeof r.count === "number" && setUnreadNotes(r.count))
        .catch(() => {});
    };
    tick();
    const t = setInterval(tick, 45000);
    return () => {
      live = false;
      clearInterval(t);
    };
  }, [user?.id, user?.username]);

  // Open a conversation from anywhere:
  // window.dispatchEvent(new CustomEvent("lockin:open-dm", { detail: { userId } }))
  useEffect(() => {
    const openDm = (e: Event) => {
      const d = (e as CustomEvent<{ userId?: number; missionId?: number; title?: string }>).detail || {};
      if (d.userId) setInboxTarget({ userId: d.userId });
      else if (d.missionId) setInboxTarget({ missionId: d.missionId, title: d.title || "Mission chat" });
      setTab("inbox");
    };
    window.addEventListener("lockin:open-dm", openDm);
    return () => window.removeEventListener("lockin:open-dm", openDm);
  }, []);

  /**
   * Load the signed-in user's profile. A failed request never signs anyone out:
   * 401 is handled inside api(), 403 means there is no profile yet (onboarding),
   * and anything else keeps the current user (or offers a retry on first load).
   */
  async function loadUser() {
    try {
      const nextUser = await api("/auth/me");
      if (nextUser.incomplete) {
        setUser(null);
        return;
      }
      setUser(nextUser);
      setBootError(false);
      api(`/users/${nextUser.id}/lock`)
        .then((lock) => typeof lock?.locked === "boolean" && setLocked(lock.locked))
        .catch(() => {});
    } catch (err: any) {
      if (err?.status === 403) setUser(null);
      else if (!userRef.current) setBootError(true);
    }
  }

  async function refreshUser() {
    if (isDemoSession()) {
      try {
        const nextUser = await api("/auth/me");
        if (nextUser && !nextUser.incomplete) {
          setUser(nextUser);
          localStorage.setItem("lockin_demo_user", JSON.stringify(nextUser));
          const lock = await api(`/users/${nextUser.id}/lock`);
          setLocked(lock.locked);
        }
      } catch (e) {
        console.warn("Failed to refresh demo user:", e);
      }
      return;
    }
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setUser(null);
      return;
    }
    await loadUser();
  }

  useEffect(() => {
    // Force dark mode on mount
    document.documentElement.classList.remove("light");

    // Check if demo session is active
    if (isDemoSession()) {
      const demoUserStr = localStorage.getItem("lockin_demo_user");
      if (demoUserStr) {
        try {
          const parsed = JSON.parse(demoUserStr);
          setUser(parsed);
          setLoading(false);
          api(`/users/${parsed.id}/lock`).then((lock) => {
            if (lock && typeof lock.locked === "boolean") setLocked(lock.locked);
          }).catch(() => {});
          return;
        } catch (e) {}
      }
    }

    if (!supabase) {
      setLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // If demo mode is active, don't overwrite user with null
      if (isDemoSession()) {
        setLoading(false);
        return;
      }
      if (!session) {
        setUser(null);
        setLoading(false);
        return;
      }
      // Same person, new token: nothing to reload.
      if (event === "TOKEN_REFRESHED" || event === "USER_UPDATED") return;
      // Recovery code just verified: ProfileGate asks for the new password first.
      if (event === "PASSWORD_RECOVERY") return;
      // Never call Supabase from inside this callback: it holds the auth lock,
      // and api() reading the session would deadlock. Defer instead.
      setTimeout(() => {
        loadUser().finally(() => setLoading(false));
      }, 0);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const screen = useMemo(() => {
    if (!user) return null;
    if (tab === "active") {
      return (
        <ActiveMissions
          user={user}
          refreshUser={refreshUser}
          api={api}
          socketUrl={SOCKET_URL}
        />
      );
    }
    if (tab === "feed") {
      return <SocialFeed user={user} api={api} setTab={setTab} />;
    }
    if (tab === "inbox") {
      return (
        <Inbox
          user={user}
          api={api}
          target={inboxTarget}
          onTargetHandled={() => setInboxTarget(null)}
          onUnread={setUnread}
        />
      );
    }
    if (tab === "notifications") {
      return <Notifications user={user} api={api} setTab={setTab} onUnread={setUnreadNotes} />;
    }
    if (tab === "profile") {
      return <Profile user={user} refreshUser={refreshUser} api={api} />;
    }
    return (
      <Feed
        user={user}
        refreshUser={refreshUser}
        locked={locked}
        setLocked={setLocked}
        api={api}
        setTab={setTab}
      />
    );
  }, [tab, user, locked, inboxTarget]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user && bootError) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-bg px-6 text-center">
        <p className="t-section">Connection</p>
        <h1 className="t-display mt-4 text-title-1 text-ink">Couldn&apos;t reach LOCKIN</h1>
        <p className="mt-2 max-w-xs text-subhead text-ink-2">Your session is fine. The server didn&apos;t answer in time.</p>
        <button
          type="button"
          onClick={() => {
            setBootError(false);
            setLoading(true);
            loadUser().finally(() => setLoading(false));
          }}
          className="btn-primary mt-8 h-12 px-8"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!user) {
    return <ProfileGate onReady={setUser} api={api} />;
  }

  // Accounts from before usernames existed claim one once.
  if (!user.username && !isDemoSession()) {
    return <ClaimUsername user={user} api={api} onDone={setUser} />;
  }

  return (
    <Shell tab={tab} setTab={setTab} user={user} unread={unread} unreadNotes={unreadNotes} onGrit={() => setShowGuide(true)}>
      <Header user={user} unreadNotes={unreadNotes} onBell={() => setTab("notifications")} active={tab === "notifications"} onGrit={() => setShowGuide(true)} />
      <GritGuide open={showGuide} onOpenChange={setShowGuide} />
      {/*
        Tab change: the new screen mounts immediately and fades in with CSS.
        (It used to wait for the old screen's exit animation; when that exit
        never finished, the main area stayed blank until a reload.)
      */}
      <div key={tab} className="screen-enter flex flex-1 flex-col pb-32 md:pb-8">
        {screen}
      </div>
      <Nav tab={tab} setTab={setTab} unread={unread} />

      {/* Realtime toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: -40, scale: 0.94, x: "-50%" }}
            animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
            exit={{ opacity: 0, y: -16, scale: 0.96, x: "-50%", transition: { duration: 0.15 } }}
            transition={spring.pop}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.6, bottom: 0.1 }}
            onDragEnd={(_, info) => { if (info.offset.y < -30) setToast(null); }}
            className="glass fixed left-1/2 top-4 z-[1000] flex w-[calc(100%-32px)] max-w-sm items-start gap-3 overflow-hidden rounded-2xl p-4 text-left"
          >
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-signal" />
            <div className="min-w-0 flex-1">
              <h4 className="text-headline text-ink">{toast.title}</h4>
              <p className="mt-0.5 text-subhead leading-snug text-ink-2">{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="-mr-1 -mt-1 shrink-0 rounded-lg px-2 py-2 text-footnote font-medium text-ink-3 transition-colors hover:text-ink"
            >
              Dismiss
            </button>
            <motion.span
              className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-signal/70"
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 4, ease: "linear" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </Shell>
  );
}
