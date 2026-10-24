"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Shell from "../../components/Shell";
import SocialFeed from "../../components/SocialFeed";
import Header from "../../components/Header";
import Nav from "../../components/Nav";
import ProfileGate from "../../components/ProfileGate";
import LoadingScreen from "../../components/LoadingScreen";
import { User } from "../types";
import { Flame } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { api } from "../../lib/api";

export default function FeedPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Force dark mode
    document.documentElement.classList.remove("light");

    if (!supabase) {
      setLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        setUser(null);
        setLoading(false);
        return;
      }
      if (event === "TOKEN_REFRESHED" || event === "USER_UPDATED") return;
      // Defer: calling Supabase inside this callback can deadlock the auth lock.
      setTimeout(async () => {
        try {
          const nextUser = await api("/auth/me");
          setUser(nextUser.incomplete ? null : nextUser);
        } catch (err: any) {
          if (err?.status === 403) setUser(null);
        } finally {
          setLoading(false);
        }
      }, 0);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <ProfileGate onReady={setUser} api={api} />;
  }

  const navigateToTab = (t: string) => {
    router.push(`/?tab=${t}`);
  };

  return (
    <Shell tab="feed" setTab={navigateToTab} user={user}>
      <Header user={user} />
      <div className="flex flex-1 flex-col overflow-y-auto scrollbar-none pb-28 md:pb-6">
        <SocialFeed user={user} api={api} />
      </div>
      <Nav tab="feed" setTab={navigateToTab} />
    </Shell>
  );
}
