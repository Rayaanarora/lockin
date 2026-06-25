"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Shell from "../../components/Shell";
import SocialFeed from "../../components/SocialFeed";
import Header from "../../components/Header";
import Nav from "../../components/Nav";
import ProfileGate from "../../components/ProfileGate";
import { User } from "../types";
import { Flame } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

async function api(path: string, options: RequestInit = {}) {
  try {
    const response = await fetch(`${API}${path}`, {
      headers: {
        "Content-Type": "application/json",
        "bypass-tunnel-reminder": "true",
        ...(options.headers || {})
      },
      ...options
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }
    return data;
  } catch (err) {
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

    const id = localStorage.getItem("lockin_user_id");
    if (!id) {
      setLoading(false);
      return;
    }
    api(`/users/${id}`)
      .then((nextUser) => {
        if (!nextUser.department || !nextUser.college) {
          localStorage.removeItem("lockin_user_id");
          setUser(null);
        } else {
          setUser(nextUser);
        }
      })
      .catch(() => {
        localStorage.removeItem("lockin_user_id");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Shell>
        <div className="flex min-h-screen items-center justify-center">
          <Flame className="h-10 w-10 text-cherryRed animate-pulse" />
        </div>
      </Shell>
    );
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
