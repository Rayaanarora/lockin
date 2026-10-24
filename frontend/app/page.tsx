"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Flame } from "lucide-react";
import { User } from "./types";
import { screen as screenVariants, spring } from "../lib/motion";

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

import { supabase } from "../lib/supabase";
import { api, API, isDemoSession } from "../lib/api";

const SOCKET_URL = API.replace("/api", "");

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("missions");
  const [locked, setLocked] = useState(false);
  const [toast, setToast] = useState<{ title: string; message: string; type: string } | null>(null);

  // Synchronize active tab from URL query params if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryTab = params.get("tab");
      if (queryTab && ["missions", "feed", "active", "profile"].includes(queryTab)) {
        setTab(queryTab);
      }
    }
  }, []);


  // Request Notification permission & Subscribe to Supabase Realtime Notifications
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }

    if (!user || !supabase) return;

    // Private channel: Supabase RLS lets only this user receive (supabase/security.sql).
    const channel = supabase.channel(`notifications:${user.id}`, { config: { private: true } });

    channel.on(
      "broadcast",
      { event: "push_notification" },
      ({ payload }: { payload: { title: string; message: string; type: string; missionId?: number } }) => {
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

    channel.subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id]);

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
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setUser(null);
        return;
      }
      const nextUser = await api("/auth/me");
      if (nextUser.incomplete) {
        setUser(null);
        return;
      }
      const lock = await api(`/users/${nextUser.id}/lock`);
      setUser(nextUser);
      setLocked(lock.locked);
    } catch {
      setUser(null);
    }
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

    // Set up auth state change listener to sync login sessions
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // If demo mode is active, don't overwrite user with null
      if (isDemoSession()) {
        setLoading(false);
        return;
      }
      if (session) {
        try {
          const nextUser = await api("/auth/me");
          if (nextUser.incomplete) {
            setUser(null);
          } else {
            setUser(nextUser);
            const lock = await api(`/users/${nextUser.id}/lock`);
            setLocked(lock.locked);
          }
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
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
      return <SocialFeed user={user} api={api} />;
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
  }, [tab, user, locked]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <ProfileGate onReady={setUser} api={api} />;
  }

  return (
    <Shell tab={tab} setTab={setTab} user={user}>
      <Header user={user} />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tab}
          variants={screenVariants}
          initial="initial"
          animate="enter"
          exit="exit"
          className="flex flex-1 flex-col pb-32 md:pb-8"
        >
          {screen}
        </motion.div>
      </AnimatePresence>
      <Nav tab={tab} setTab={setTab} />

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
