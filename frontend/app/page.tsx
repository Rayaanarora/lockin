"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Flame } from "lucide-react";
import { User } from "./types";

// Import custom modular components
import Shell from "../components/Shell";
import Header from "../components/Header";
import Nav from "../components/Nav";
import ProfileGate from "../components/ProfileGate";
import Feed from "../components/Feed";
import ActiveMissions from "../components/ActiveMissions";
import Profile from "../components/Profile";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const SOCKET_URL = API.replace("/api", "");

async function api(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("feed");
  const [locked, setLocked] = useState(false);

  async function refreshUser() {
    const id = localStorage.getItem("lockin_user_id");
    if (!id) return;
    try {
      const nextUser = await api(`/users/${id}`);
      const lock = await api(`/users/${id}/lock`);
      setUser(nextUser);
      setLocked(lock.locked);
    } catch {
      localStorage.removeItem("lockin_user_id");
      setUser(null);
    }
  }

  useEffect(() => {
    const id = localStorage.getItem("lockin_user_id");
    if (!id) {
      setLoading(false);
      return;
    }
    Promise.all([api(`/users/${id}`), api(`/users/${id}/lock`)])
      .then(([nextUser, lock]) => {
        setUser(nextUser);
        setLocked(lock.locked);
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
      />
    );
  }, [tab, user, locked]);

  if (loading) {
    return (
      <Shell>
        <div className="flex min-h-screen items-center justify-center">
          <Flame className="h-10 w-10 animate-pulse text-boxOrange" />
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
    </Shell>
  );
}
