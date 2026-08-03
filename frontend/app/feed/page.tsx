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

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

async function api(path: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  let authHeaders: Record<string, string> = {};
  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      authHeaders["Authorization"] = `Bearer ${session.access_token}`;
    }
  }

  try {
    const response = await fetch(`${API}${path}`, {
      headers: {
        "Content-Type": "application/json",
        "bypass-tunnel-reminder": "true",
        ...authHeaders,
        ...(options.headers || {})
      },
      signal: controller.signal,
      ...options
    });
    clearTimeout(timeoutId);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (
        (response.status === 401 && data.error === "Invalid or expired session token.") ||
        (response.status === 404 && data.error === "User not found.")
      ) {
        if (typeof window !== "undefined") {
          if (supabase) await supabase.auth.signOut().catch(() => {});
          localStorage.removeItem("lockin_user_id");
          window.location.reload();
        }
      }
      throw new Error(data.error || "Request failed");
    }
    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        try {
          const nextUser = await api("/auth/me");
          if (nextUser.incomplete) {
            setUser(null);
          } else {
            setUser(nextUser);
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
