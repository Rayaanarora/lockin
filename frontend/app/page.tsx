"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Flame } from "lucide-react";
import { io } from "socket.io-client";
import { User } from "./types";

// Import custom modular components
import Shell from "../components/Shell";
import Header from "../components/Header";
import Nav from "../components/Nav";
import ProfileGate from "../components/ProfileGate";
import Feed from "../components/Feed";
import ActiveMissions from "../components/ActiveMissions";
import Profile from "../components/Profile";
import ActivityFeed from "../components/ActivityFeed";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const SOCKET_URL = API.replace("/api", "");

async function api(path: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(`${API}${path}`, {
      headers: { 
        "Content-Type": "application/json", 
        "bypass-tunnel-reminder": "true",
        ...(options.headers || {}) 
      },
      signal: controller.signal,
      ...options
    });
    clearTimeout(timeoutId);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }
    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("feed");
  const [locked, setLocked] = useState(false);
  const [toast, setToast] = useState<{ title: string; message: string; type: string } | null>(null);

  // Socket.io connection state
  useEffect(() => {
    if (!user) return;

    // Connect socket
    const socket = io(SOCKET_URL);

    // Register user
    socket.emit("register", user.id);

    // Listen for push notifications
    socket.on("push_notification", (data: { title: string; message: string; type: string }) => {
      // 1. Show in-app Toast
      setToast(data);
      // Auto dismiss after 4 seconds
      const timer = setTimeout(() => {
        setToast((current) => (current && current.message === data.message ? null : current));
      }, 4000);

      // 2. Issue browser native HTML5 Notification
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        try {
          new Notification(data.title, { body: data.message });
        } catch (e) {
          console.warn("Failed to trigger native notification:", e);
        }
      }
    });

    // Request Notification permission
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }

    return () => {
      socket.disconnect();
    };
  }, [user?.id]);

  async function refreshUser() {
    const id = localStorage.getItem("lockin_user_id");
    if (!id) return;
    try {
      const nextUser = await api(`/users/${id}`);
      const lock = await api(`/users/${id}/lock`);
      if (!nextUser.department || !nextUser.college) {
        localStorage.removeItem("lockin_user_id");
        setUser(null);
      } else {
        setUser(nextUser);
        setLocked(lock.locked);
      }
    } catch {
      localStorage.removeItem("lockin_user_id");
      setUser(null);
    }
  }

  useEffect(() => {
    // Force dark mode on mount
    document.documentElement.classList.remove("light");

    const id = localStorage.getItem("lockin_user_id");
    if (!id) {
      setLoading(false);
      return;
    }
    Promise.all([api(`/users/${id}`), api(`/users/${id}/lock`)])
      .then(([nextUser, lock]) => {
        if (!nextUser.department || !nextUser.college) {
          localStorage.removeItem("lockin_user_id");
          setUser(null);
        } else {
          setUser(nextUser);
          setLocked(lock.locked);
        }
      })
      .catch(() => localStorage.removeItem("lockin_user_id"))
      .finally(() => setLoading(false));
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
    if (tab === "discover") {
      return <ActivityFeed user={user} api={api} />;
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
    return (
      <Shell>
        <div className="flex min-h-screen items-center justify-center">
          <Flame className="h-10 w-10 text-luxuryGold animate-pulse" />
        </div>
      </Shell>
    );
  }

  if (!user) {
    return <ProfileGate onReady={setUser} api={api} />;
  }

  return (
    <Shell tab={tab} setTab={setTab} user={user}>
      <Header user={user} />
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -18 }}
          className="flex flex-1 flex-col"
        >
          {screen}
        </motion.div>
      </AnimatePresence>
      <Nav tab={tab} setTab={setTab} />

      {/* Real-time Custom Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9, x: "-50%" }}
            animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
            exit={{ opacity: 0, y: -20, scale: 0.9, x: "-50%" }}
            className="fixed top-6 left-1/2 z-[1000] w-[90%] max-w-sm rounded-2xl border border-cherryRed/35 bg-[#120F0D]/90 p-4 shadow-[0_10px_35px_rgba(222,33,30,0.25)] backdrop-blur-xl flex items-start gap-3 text-left"
          >
            <div className="flex-1">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">{toast.title}</h4>
              <p className="text-[11px] text-zinc-400 font-semibold mt-1 leading-normal">{toast.message}</p>
            </div>
            <button 
              onClick={() => setToast(null)} 
              className="text-zinc-500 hover:text-white text-[10px] font-black uppercase tracking-wider shrink-0 mt-0.5"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </Shell>
  );
}
