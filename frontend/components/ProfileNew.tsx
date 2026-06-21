"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Trophy,
  MapPin,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  Instagram,
  Github,
  ChevronRight,
  Flame,
  LayoutGrid,
  Users,
  ListTodo,
  Calendar as CalendarIcon,
  LogOut,
  Sparkles,
  User as UserIcon,
  Sliders,
  Award
} from "lucide-react";
import { User, Mission } from "../app/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import RecapCard from "./RecapCard";
import HeatMap from "./HeatMap";
import PublicProfile from "./PublicProfile";

interface ProfileProps {
  user: User;
  refreshUser: () => Promise<void>;
  api: (path: string, options?: RequestInit) => Promise<any>;
}

interface LeaderboardEntry {
  id: number;
  name: string;
  department: string;
  reputation_score: number;
  interests?: string;
}

const TABS = ["Stats", "Leaderboard", "Missions", "Gallery"] as const;
type Tab = (typeof TABS)[number];

export default function ProfileNew({ user, refreshUser, api }: ProfileProps) {
  const [activeTab, setActiveTab] = useState<Tab>("Stats");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [pastMissions, setPastMissions] = useState<Mission[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [loadingMissions, setLoadingMissions] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [form, setForm] = useState({
    name: user.name || "",
    department: user.department || "",
    bio: user.bio || "",
    instagram: user.instagram || "",
    github: user.github || "",
    location: user.location || "",
  });
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const [recapData, setRecapData] = useState<any | null>(null);
  const [showRecapCard, setShowRecapCard] = useState(false);
  const [recapsList, setRecapsList] = useState<any[]>([]);
  const [loadingRecaps, setLoadingRecaps] = useState(false);

  // Gallery filters/sorters
  const [gallerySort, setGallerySort] = useState("newest");
  const [galleryCategory, setGalleryCategory] = useState("all");
  const [galleryYear, setGalleryYear] = useState("all");

  // V2 stats & public profiles
  const [profileStats, setProfileStats] = useState<any | null>(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(false);

  const [selectedLeaderboardUserId, setSelectedLeaderboardUserId] = useState<number | null>(null);
  const [leaderboardProfileOpen, setLeaderboardProfileOpen] = useState(false);

  async function loadProfileStats() {
    setLoadingStats(true);
    try {
      const data = await api(`/users/${user.id}/public`);
      setProfileStats(data.stats);
      setFollowersCount(data.followersCount);
      setFollowingCount(data.followingCount);
    } catch (err) {
      console.error("Failed to load profile stats:", err);
    } finally {
      setLoadingStats(false);
    }
  }

  useEffect(() => {
    loadProfileStats();
  }, [user.id]);

  async function handleLogout() {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout API call failed", e);
    }
    localStorage.removeItem("lockin_user_id");
    window.location.reload();
  }

  async function loadRecaps() {
    setLoadingRecaps(true);
    try {
      const list = await api(
        `/recaps/user/${user.id}?sortBy=${gallerySort}&category=${galleryCategory}&year=${galleryYear}`
      );
      setRecapsList(list);
    } catch (err) {
      console.error(err);
      setRecapsList([]);
    } finally {
      setLoadingRecaps(false);
    }
  }

  useEffect(() => {
    if (activeTab === "Gallery") {
      loadRecaps();
    }
  }, [activeTab, gallerySort, galleryCategory, galleryYear]);

  async function handleGenerateWrapped(recapType: "weekly" | "monthly" | "yearly") {
    try {
      const result = await api("/recaps/generate", {
        method: "POST",
        body: JSON.stringify({ userId: user.id, recapType })
      });
      setRecapData(result);
      setShowRecapCard(true);
    } catch (err: any) {
      alert(err.message || "Failed to generate Wrapped card.");
    }
  }

  async function handleGenerateTeamSummary() {
    try {
      const list = await api(`/recaps/user/${user.id}`);
      const teamRecap = list.find((r: any) => r.participantCount && r.participantCount > 1);
      
      if (!teamRecap) {
        alert("No collaborative team focus runs found in your history.");
        return;
      }
      
      setRecapData({
        ...teamRecap,
        recapType: "team"
      });
      setShowRecapCard(true);
    } catch (err: any) {
      alert(err.message || "Failed to generate team summary.");
    }
  }

  async function handleViewMissionRecap(missionId: number) {
    try {
      const result = await api(`/recaps/mission/${missionId}/user/${user.id}`);
      setRecapData(result);
      setShowRecapCard(true);
    } catch (err: any) {
      alert("No recap data saved for this past mission.");
    }
  }

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const idx = TABS.indexOf(activeTab);
    const el = tabRefs.current[idx];
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "Leaderboard" && user.campus_id) {
      setLoadingLeaderboard(true);
      api(`/users/leaderboard?campusId=${user.campus_id}`)
        .then(setLeaderboard)
        .catch(() => setLeaderboard([]))
        .finally(() => setLoadingLeaderboard(false));
    }
  }, [activeTab, user.campus_id]);

  useEffect(() => {
    if (activeTab === "Missions") {
      setLoadingMissions(true);
      api(`/missions/active/${user.id}`)
        .then((data: Mission[]) => {
          const past = data.filter(
            (m) => m.status === "Completed" || m.status === "Missed" || m.showed_up !== undefined
          );
          setPastMissions(past);
        })
        .catch(() => setPastMissions([]))
        .finally(() => setLoadingMissions(false));
    }
  }, [activeTab, user.id]);

  const initials = user.name
    ? user.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  const aura = user.reputation_score ?? 0;

  async function handleSync() {
    setSyncing(true);
    try {
      await refreshUser();
      await loadProfileStats();
    } catch {}
    setTimeout(() => setSyncing(false), 800);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (form.name.trim().length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }
    setUpdating(true);
    setError("");
    try {
      await api(`/users/${user.id}`, {
        method: "PUT",
        body: JSON.stringify(form),
      });
      await refreshUser();
      await loadProfileStats();
      setShowEdit(false);
    } catch (err: any) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-md md:max-w-5xl px-4 py-6 pb-28 md:pb-8 space-y-6 select-none">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Profile Card */}
        <div className="md:col-span-1">
          <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[#161211]/50 p-6 backdrop-blur-xl shadow-2xl">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 h-36 w-36 rounded-full bg-luxuryGold/5 blur-3xl pointer-events-none" />
            
            {/* Avatar and Name */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-[24px] border-2 border-luxuryGold/40 bg-zinc-950 text-2xl font-black text-cotton shadow-[0_0_25px_rgba(197,168,128,0.15)] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-luxuryMaroon/30 to-luxuryGold/10" />
                <span className="relative z-10">{initials}</span>
              </div>
              
              <div className="space-y-1">
                <h2 className="text-lg md:text-xl font-black text-cotton tracking-tight">{user.name}</h2>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">{user.department}</p>
                {user.bio && (
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed max-w-[200px] mx-auto font-medium">
                    {user.bio}
                  </p>
                )}
              </div>
            </div>

            {/* Aura display */}
            <div className="mt-6 flex justify-center">
              <span className="flex items-center gap-2 rounded-full border border-luxuryGold/30 bg-luxuryGold/10 px-4 py-2 text-xs font-black text-luxuryGold uppercase tracking-widest shadow-[0_0_15px_rgba(197,168,128,0.1)]">
                <Sparkles className="h-4 w-4 animate-pulse" />
                {aura} Aura
              </span>
            </div>

            {/* Follow Counts */}
            <div className="mt-5 flex gap-2 justify-center text-[10px] font-black uppercase tracking-wider text-zinc-500 bg-zinc-950/40 py-2.5 px-4 rounded-2xl border border-white/5 shadow-inner">
              <div className="px-1">
                <span className="text-cotton font-black mr-0.5">{followersCount}</span> Followers
              </div>
              <div className="w-px bg-white/10 h-3 self-center" />
              <div className="px-1">
                <span className="text-cotton font-black mr-0.5">{followingCount}</span> Following
              </div>
            </div>

            {/* Location & Tags */}
            <div className="mt-5 space-y-2 text-left text-xs font-bold text-zinc-400">
              {user.location && (
                <div className="flex items-center gap-2.5 rounded-xl border border-white/5 bg-[#1B1716]/30 p-3">
                  <MapPin className="h-4 w-4 text-cherryRed shrink-0" />
                  <span className="truncate text-zinc-300">{user.location}</span>
                </div>
              )}
              {user.interests && (
                <div className="flex items-center gap-2.5 rounded-xl border border-white/5 bg-[#1B1716]/30 p-3">
                  <Sliders className="h-4 w-4 text-luxuryGold shrink-0" />
                  <span className="truncate text-zinc-300">{user.interests}</span>
                </div>
              )}
            </div>

            {/* Socials Row */}
            {(user.instagram || user.github) && (
              <div className="mt-5 flex flex-col gap-2.5 border-t border-white/5 pt-4 text-left">
                {user.instagram && (
                  <a
                    href={`https://instagram.com/${user.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition group"
                  >
                    <Instagram className="h-4 w-4 text-zinc-500 group-hover:text-pink-500 transition-colors" />
                    <span>@{user.instagram}</span>
                  </a>
                )}
                {user.github && (
                  <a
                    href={`https://github.com/${user.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition group"
                  >
                    <Github className="h-4 w-4 text-zinc-500 group-hover:text-white transition-colors" />
                    <span>@{user.github}</span>
                  </a>
                )}
              </div>
            )}

            {/* Actions grid */}
            <div className="mt-6 flex flex-col gap-2 border-t border-white/5 pt-5">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="flex h-10 items-center justify-center gap-2 rounded-xl border border-white/5 bg-zinc-950/60 text-xs font-black uppercase tracking-wider text-cotton hover:bg-white/5 disabled:opacity-50 transition active:scale-95 shadow-md"
                >
                  <Activity className={`h-3.5 w-3.5 text-luxuryGold ${syncing ? "animate-spin" : ""}`} />
                  <span>{syncing ? "Syncing" : "Sync"}</span>
                </button>
                <button
                  onClick={() => setShowEdit(true)}
                  className="flex h-10 items-center justify-center gap-2 rounded-xl border border-white/5 bg-zinc-950/60 text-xs font-black uppercase tracking-wider text-cotton hover:bg-white/5 transition active:scale-95 shadow-md"
                >
                  <span>Edit Profile</span>
                </button>
              </div>
              
              <button
                type="button"
                onClick={handleLogout}
                className="flex h-10 items-center justify-center gap-2 rounded-xl border border-cherryRed/35 bg-cherryRed/5 text-xs font-black uppercase tracking-wider text-cherryRed hover:bg-cherryRed/10 transition active:scale-[0.98] shadow-md"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Content Dashboard */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Tab Selector pills */}
          <div className="relative flex rounded-[20px] border border-white/10 bg-[#161211]/50 p-1 backdrop-blur-md shadow-lg">
            <motion.div
              className="absolute top-1 bottom-1 rounded-xl bg-luxuryGold/10 border border-luxuryGold/30 shadow-[0_0_12px_rgba(197,168,128,0.12)]"
              animate={{ left: indicator.left, width: indicator.width }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
            {TABS.map((tab, idx) => (
              <button
                key={tab}
                ref={(el) => { tabRefs.current[idx] = el; }}
                onClick={() => setActiveTab(tab)}
                className={`relative z-10 flex-1 py-3 text-[11px] font-black uppercase tracking-widest transition-colors duration-300 ${
                  activeTab === tab ? "text-luxuryGold" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content Panels */}
          <AnimatePresence mode="wait">
            {activeTab === "Stats" && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-6"
              >
                {/* Aura Progress Panel */}
                <div className="rounded-[24px] border border-white/5 bg-zinc-950/40 p-5 space-y-4 shadow-xl">
                  <div className="flex justify-between items-center">
                    <div className="text-left">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block">
                        Aura Rank Progress
                      </span>
                      <h4 className="text-xs font-black uppercase text-cotton mt-1 tracking-wider">
                        {aura < 100 ? "Initiate" : aura < 250 ? "Executor" : aura < 500 ? "Specialist" : "Elite"}
                      </h4>
                    </div>
                    <span className="text-base font-black text-luxuryGold tracking-tight">{aura} Aura</span>
                  </div>
                  
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-900 border border-white/5 shadow-inner">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (aura / 500) * 100)}%` }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-cherryRed via-luxuryMaroon to-luxuryGold"
                    />
                  </div>
                  
                  <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-black text-left">
                    {aura < 500 ? `${Math.max(0, 500 - aura)} Aura to Elite Level` : "Max Rank Achieved"}
                  </p>
                </div>

                {/* Institution & Verification Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                  {[
                    { label: "Institution College", value: user.college },
                    { label: "Registered ID / Email", value: user.college_id },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-white/5 bg-zinc-950/40 px-5 py-4 flex flex-col justify-between space-y-1.5 shadow-md"
                    >
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{item.label}</span>
                      <span className="text-xs font-bold text-zinc-200 truncate">{item.value || "Not configured"}</span>
                    </div>
                  ))}
                </div>

                {/* Execution Metrics Grid */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 text-left pl-1">
                    Flight metrics
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {[
                      { label: "Completed", value: profileStats?.totalMissions ?? 0, icon: Flame, color: "text-cherryRed", border: "hover:border-cherryRed/30" },
                      { label: "Focus Hours", value: `${profileStats?.focusHours ?? 0}h`, icon: Clock, color: "text-luxuryGold", border: "hover:border-luxuryGold/30" },
                      { label: "Completion Rate", value: `${profileStats?.completionRate ?? 100}%`, icon: CheckCircle2, color: "text-emerald-400", border: "hover:border-emerald-500/30" },
                      { label: "Active Streak", value: `${profileStats?.currentStreak ?? 0}d`, icon: Zap, color: "text-amber-500", border: "hover:border-amber-500/30" },
                      { label: "Tasks Logged", value: profileStats?.tasksCompleted ?? 0, icon: ListTodo, color: "text-zinc-200", border: "hover:border-white/20" },
                      { label: "Active Days", value: profileStats?.activeDays ?? 0, icon: CalendarIcon, color: "text-sky-400", border: "hover:border-sky-500/30" },
                    ].map((stat) => {
                      const Icon = stat.icon;
                      return (
                        <div key={stat.label} className={`rounded-2xl border border-white/5 bg-zinc-950/40 p-4.5 flex flex-col justify-between space-y-3 text-left transition-all duration-300 hover:bg-zinc-950/65 ${stat.border} shadow-lg`}>
                          <div className="flex justify-between items-start">
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 leading-tight">{stat.label}</span>
                            <Icon className={`h-4.5 w-4.5 ${stat.color} shrink-0`} />
                          </div>
                          <span className="text-xl font-black text-white leading-none tracking-tight">{stat.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* LOCKIN Heatmap wrapped */}
                <div className="rounded-[24px] border border-white/5 bg-zinc-950/40 p-5 shadow-xl">
                  <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
                    <Activity className="h-4.5 w-4.5 text-luxuryGold" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Activity Grid</span>
                  </div>
                  <HeatMap userId={user.id} api={api} />
                </div>

                {/* Wrapped Recaps Action Block */}
                <div className="rounded-[24px] border border-white/5 bg-zinc-950/40 p-5 space-y-4 shadow-xl text-left">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                    <Award className="h-4.5 w-4.5 text-luxuryGold" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Wrapped Logs</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleGenerateWrapped("weekly")}
                      className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/5 bg-zinc-900/40 text-xs font-black uppercase tracking-wider text-zinc-300 hover:text-white hover:bg-[#1B1716]/60 transition active:scale-95"
                    >
                      <Zap className="h-3.5 w-3.5 text-luxuryGold" /> 
                      <span>Weekly Wrapped</span>
                    </button>
                    <button
                      onClick={() => handleGenerateWrapped("monthly")}
                      className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/5 bg-zinc-900/40 text-xs font-black uppercase tracking-wider text-zinc-300 hover:text-white hover:bg-[#1B1716]/60 transition active:scale-95"
                    >
                      <Trophy className="h-3.5 w-3.5 text-luxuryGold" />
                      <span>Monthly Wrapped</span>
                    </button>
                    <button
                      onClick={() => handleGenerateWrapped("yearly")}
                      className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/5 bg-zinc-900/40 text-xs font-black uppercase tracking-wider text-zinc-300 hover:text-white hover:bg-[#1B1716]/60 transition active:scale-95"
                    >
                      <Activity className="h-3.5 w-3.5 text-luxuryGold" />
                      <span>Yearly Wrapped</span>
                    </button>
                    <button
                      onClick={handleGenerateTeamSummary}
                      className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/5 bg-zinc-900/40 text-xs font-black uppercase tracking-wider text-zinc-300 hover:text-white hover:bg-[#1B1716]/60 transition active:scale-95"
                    >
                      <Users className="h-3.5 w-3.5 text-luxuryGold" />
                      <span>Team Summary</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "Leaderboard" && (
              <motion.div
                key="leaderboard"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-4"
              >
                {!user.campus_id ? (
                  <div className="rounded-[24px] border border-white/5 bg-zinc-950/40 p-10 text-center">
                    <Trophy className="h-8 w-8 mx-auto text-zinc-600 mb-3" />
                    <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Campus not logged</p>
                    <p className="text-[11px] text-zinc-600 mt-1">Re-register with a campus to view relative rankings.</p>
                  </div>
                ) : loadingLeaderboard ? (
                  <div className="flex flex-col items-center justify-center py-16 space-y-3">
                    <div className="h-6 w-6 rounded-full border border-zinc-700 border-t-zinc-300 animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Querying Standings...</span>
                  </div>
                ) : leaderboard.length === 0 ? (
                  <div className="rounded-[24px] border border-white/5 bg-zinc-950/40 p-10 text-center">
                    <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Board empty</p>
                    <p className="text-[11px] text-zinc-600 mt-1">Submit completed focus tasks to register on the board.</p>
                  </div>
                ) : (
                  <div className="rounded-[24px] border border-white/10 bg-[#161211]/50 overflow-hidden shadow-2xl backdrop-blur-xl">
                    <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-luxuryGold" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Campus Leaderboard</span>
                    </div>
                    
                    <div className="divide-y divide-white/5">
                      {leaderboard.map((entry, idx) => {
                        const isYou = entry.id === user.id;
                        let rankBadge = `${idx + 1}`;
                        let bgStyle = "";
                        let rankText = "text-zinc-500";
                        
                        if (idx === 0) {
                          rankBadge = "👑";
                          bgStyle = "bg-gradient-to-r from-luxuryGold/10 to-transparent border-l-2 border-luxuryGold";
                          rankText = "text-luxuryGold font-black";
                        } else if (idx === 1) {
                          rankBadge = "🥈";
                          bgStyle = "bg-gradient-to-r from-zinc-500/5 to-transparent border-l-2 border-zinc-400";
                          rankText = "text-zinc-300 font-bold";
                        } else if (idx === 2) {
                          rankBadge = "🥉";
                          bgStyle = "bg-gradient-to-r from-amber-800/5 to-transparent border-l-2 border-amber-700";
                          rankText = "text-amber-500 font-semibold";
                        }

                        return (
                          <div
                            key={entry.id}
                            onClick={() => {
                              if (!isYou) {
                                setSelectedLeaderboardUserId(entry.id);
                                setLeaderboardProfileOpen(true);
                              }
                            }}
                            className={`flex items-center gap-4 px-5 py-3.5 transition-colors duration-300 ${bgStyle} ${
                              isYou ? "bg-white/[0.02]" : "cursor-pointer hover:bg-white/[0.02]"
                            }`}
                          >
                            <span className={`w-6 text-sm shrink-0 text-center ${rankText}`}>
                              {rankBadge}
                            </span>
                            <div className="flex-1 min-w-0 text-left">
                              <p className={`text-xs font-black truncate tracking-wide ${isYou ? "text-luxuryGold" : "text-cotton"}`}>
                                {entry.name} {isYou && <span className="text-[9px] text-zinc-500 lowercase">(you)</span>}
                              </p>
                              <p className="text-[10px] text-zinc-500 font-semibold truncate mt-0.5">{entry.department}</p>
                            </div>
                            
                            <span className="text-xs font-black text-cotton shrink-0 tracking-wider">
                              {entry.reputation_score}
                              <span className="text-[9px] text-zinc-500 ml-1 font-bold">Aura</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "Missions" && (
              <motion.div
                key="missions"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-4"
              >
                {loadingMissions ? (
                  <div className="flex flex-col items-center justify-center py-16 space-y-3">
                    <div className="h-6 w-6 rounded-full border border-zinc-700 border-t-zinc-300 animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Querying Logs...</span>
                  </div>
                ) : pastMissions.length === 0 ? (
                  <div className="rounded-[24px] border border-white/5 bg-zinc-950/40 p-10 text-center">
                    <LayoutGrid className="h-8 w-8 mx-auto text-zinc-600 mb-3" />
                    <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">No past runs</p>
                    <p className="text-[11px] text-zinc-600 mt-1">Lock in on a discovered mission to record runs.</p>
                  </div>
                ) : (
                  <div className="rounded-[24px] border border-white/10 bg-[#161211]/50 overflow-hidden shadow-2xl backdrop-blur-xl">
                    <div className="divide-y divide-white/5">
                      {pastMissions.map((m) => {
                        const done = m.status === "Completed";
                        const missed = m.status === "Missed";
                        return (
                          <div key={`${m.id}-${m.role}`} className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-white/[0.01]">
                            <div className="flex items-center gap-3 min-w-0">
                              {done ? (
                                <div className="flex h-7.5 w-7.5 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                                  <CheckCircle2 className="h-4 w-4" />
                                </div>
                              ) : missed ? (
                                <div className="flex h-7.5 w-7.5 items-center justify-center rounded-xl bg-cherryRed/10 border border-cherryRed/20 text-cherryRed shrink-0">
                                  <XCircle className="h-4 w-4" />
                                </div>
                              ) : (
                                <div className="flex h-7.5 w-7.5 items-center justify-center rounded-xl bg-zinc-900 border border-white/5 text-zinc-500 shrink-0">
                                  <Clock className="h-4 w-4" />
                                </div>
                              )}
                              
                              <div className="text-left min-w-0">
                                <p className="text-xs font-black text-cotton truncate tracking-wide">{m.title}</p>
                                <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">
                                  {m.role === "creator" ? "Hosted Runway" : `Partner: ${m.creator_name}`}
                                  {" · "}
                                  {new Date(m.datetime).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                  })}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2.5 shrink-0">
                              {done && (
                                <button
                                  onClick={() => handleViewMissionRecap(m.id)}
                                  className="text-[9px] font-black uppercase tracking-wider border border-luxuryGold/30 bg-luxuryGold/5 px-3 py-1.5 rounded-lg text-luxuryGold hover:bg-luxuryGold/15 active:scale-95 transition"
                                >
                                  View recap
                                </button>
                              )}
                              <span
                                className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                                  done
                                    ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
                                    : missed
                                    ? "border-cherryRed/25 bg-cherryRed/5 text-cherryRed"
                                    : "border-white/10 text-zinc-500"
                                }`}
                              >
                                {m.status}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "Gallery" && (
              <motion.div
                key="gallery"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-4"
              >
                {/* Custom Filters pillbox */}
                <div className="flex flex-wrap gap-2.5 items-center justify-between bg-zinc-950/40 p-4.5 rounded-[24px] border border-white/5 shadow-inner">
                  <div className="flex flex-1 gap-2 min-w-[200px]">
                    <select
                      value={galleryCategory}
                      onChange={(e) => setGalleryCategory(e.target.value)}
                      className="flex-1 h-9 rounded-xl border border-white/10 bg-zinc-900 text-[10px] font-black uppercase tracking-widest text-zinc-400 px-2 outline-none focus:border-luxuryGold transition"
                    >
                      <option value="all">All Channels</option>
                      <option value="Programming">💻 Programming</option>
                      <option value="Study">📚 Study</option>
                      <option value="Design">🎨 Design</option>
                      <option value="Writing">✍️ Writing</option>
                      <option value="Research">🔍 Research</option>
                      <option value="Fitness">⚡ Fitness</option>
                      <option value="Other">⚙️ Other</option>
                    </select>

                    <select
                      value={galleryYear}
                      onChange={(e) => setGalleryYear(e.target.value)}
                      className="flex-1 h-9 rounded-xl border border-white/10 bg-zinc-900 text-[10px] font-black uppercase tracking-widest text-zinc-400 px-2 outline-none focus:border-luxuryGold transition"
                    >
                      <option value="all">All Years</option>
                      <option value="2026">2026</option>
                      <option value="2025">2025</option>
                    </select>
                  </div>

                  <select
                    value={gallerySort}
                    onChange={(e) => setGallerySort(e.target.value)}
                    className="h-9 rounded-xl border border-white/10 bg-zinc-900 text-[10px] font-black uppercase tracking-widest text-zinc-400 px-2 outline-none focus:border-luxuryGold transition"
                  >
                    <option value="newest">Newest First</option>
                    <option value="longest">Duration Log</option>
                    <option value="tasks">Completed Tasks</option>
                  </select>
                </div>

                {/* Gallery Cards Grid */}
                {loadingRecaps ? (
                  <div className="flex flex-col items-center justify-center py-16 space-y-3">
                    <div className="h-6 w-6 rounded-full border border-zinc-700 border-t-zinc-300 animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Querying Gallery...</span>
                  </div>
                ) : recapsList.length === 0 ? (
                  <div className="rounded-[24px] border border-white/5 bg-zinc-950/40 p-12 text-center">
                    <LayoutGrid className="h-8 w-8 mx-auto text-zinc-600 mb-3" />
                    <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Gallery Empty</p>
                    <p className="text-[11px] text-zinc-600 mt-1">Completed flights with reflecting logs appear here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {recapsList.map((recap) => {
                      const durationHrs = Math.floor(recap.sessionDuration / 60);
                      const durationMins = recap.sessionDuration % 60;
                      const durationText = durationHrs > 0 ? `${durationHrs}h ${durationMins}m` : `${durationMins}m`;

                      return (
                        <motion.div
                          key={recap.id}
                          whileHover={{ scale: 1.02, y: -2 }}
                          onClick={() => {
                            setRecapData(recap);
                            setShowRecapCard(true);
                          }}
                          className="cursor-pointer group relative overflow-hidden rounded-[24px] border border-white/5 bg-zinc-950/40 p-5 flex flex-col justify-between hover:border-luxuryGold/35 hover:shadow-lg transition-all duration-300"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <span className="rounded-full px-2.5 py-0.5 text-[8px] font-black uppercase tracking-widest bg-white/5 text-zinc-500 font-display">
                              {recap.categorySnapshot || "Other"}
                            </span>
                            <span className="text-[9px] font-bold text-zinc-500 font-display">
                              {new Date(recap.generatedAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric"
                              })}
                            </span>
                          </div>
                          
                          <h4 className="text-xs font-black text-white line-clamp-1 group-hover:text-luxuryGold transition text-left tracking-wide">
                            {recap.missionTitle || "Focus Sprint"}
                          </h4>
                          
                          <div className="mt-4 flex items-center justify-between border-t border-white/4 pt-3 text-[10px] font-bold text-zinc-500 font-display">
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-luxuryGold" />
                              <span>{durationText}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2 className="h-3.5 w-3.5 text-white/50" />
                              <span>{recap.tasksCompleted} Tasks</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Edit Profile Dialog ── */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="border-white/10 bg-zinc-950/98 text-white max-w-sm rounded-[32px] backdrop-blur-2xl p-6.5 shadow-2xl">
          <DialogHeader className="border-b border-white/5 pb-3">
            <DialogTitle className="text-base font-black tracking-widest text-white uppercase flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-luxuryGold" />
              EDIT PILOT LOG
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 mt-4 text-left">
            {[
              { label: "Full Name", key: "name", placeholder: "Your Name" },
              { label: "Department & Academic Year", key: "department", placeholder: "e.g. CSE, 3rd Year" },
              { label: "Default Meet Location", key: "location", placeholder: "e.g. Library, Block B..." },
              { label: "Bio / Target description", key: "bio", placeholder: "What goals are you executing?" },
              { label: "Instagram Handle", key: "instagram", placeholder: "username" },
              { label: "GitHub Profile", key: "github", placeholder: "username" },
            ].map(({ label, key, placeholder }) => (
              <div key={key} className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                  {label}
                </label>
                <Input
                  value={(form as any)[key]}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm((f) => ({ ...f, [key]: e.target.value }))
                  }
                  placeholder={placeholder}
                  className="h-10 border-white/5 bg-[#1B1716]/40 text-xs text-cotton placeholder-zinc-700 focus:border-luxuryGold rounded-xl"
                />
              </div>
            ))}

            {error && (
              <p className="text-xs font-bold text-cherryRed">{error}</p>
            )}

            <button
              type="submit"
              disabled={updating}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-luxuryGold text-xs font-black uppercase tracking-wider text-black hover:bg-luxuryGold/95 active:scale-[0.98] transition disabled:opacity-50 shadow-md"
            >
              <Flame className="h-4 w-4 fill-current" />
              <span>{updating ? "Saving pilot file..." : "Save Changes"}</span>
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Recap Card Modal */}
      {recapData && (
        <RecapCard
          isOpen={showRecapCard}
          onClose={() => setShowRecapCard(false)}
          recapData={recapData}
        />
      )}

      {/* Leaderboard Public Profile Overlay */}
      {selectedLeaderboardUserId && (
        <PublicProfile
          userId={selectedLeaderboardUserId}
          viewerId={user.id}
          isOpen={leaderboardProfileOpen}
          onClose={() => {
            setLeaderboardProfileOpen(false);
            setSelectedLeaderboardUserId(null);
          }}
          api={api}
        />
      )}
    </section>
  );
}
